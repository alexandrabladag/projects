<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Project;
use App\Models\ProjectPage;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DocumentPageFeatureTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $client;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'manager']);
        Role::create(['name' => 'client']);

        // Create admin user
        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        // Create client user
        $this->client = User::factory()->create();
        $this->client->assignRole('client');

        // Create project
        $this->project = Project::factory()->create([
            'manager_id' => $this->admin->id,
            'client_user_id' => $this->client->id,
        ]);

        Storage::fake('local');
    }

    // ── Document CRUD ─────────────────────────────────────────────────────────

    public function test_admin_can_upload_document_to_project(): void
    {
        $file = UploadedFile::fake()->create('contract.pdf', 1024);

        $response = $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'Signed Contract', 'type' => 'contract', 'file' => $file]
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('documents', [
            'project_id' => $this->project->id,
            'name' => 'Signed Contract',
            'type' => 'contract',
        ]);

        $doc = Document::where('name', 'Signed Contract')->first();
        $this->assertNotNull($doc->file_path);
        $this->assertNotNull($doc->file_size);
        Storage::disk('local')->assertExists($doc->file_path);
    }

    public function test_document_can_be_created_without_file(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'Placeholder Document', 'type' => 'brief']
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('documents', [
            'project_id' => $this->project->id,
            'name' => 'Placeholder Document',
            'file_path' => null,
        ]);
    }

    public function test_admin_can_update_document(): void
    {
        $doc = Document::factory()->create([
            'project_id' => $this->project->id,
            'added_by' => $this->admin->id,
            'name' => 'Old Name',
            'type' => 'other',
        ]);

        $response = $this->actingAs($this->admin)->put(
            route('projects.documents.update', [$this->project, $doc]),
            ['name' => 'New Name', 'type' => 'report']
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('documents', [
            'id' => $doc->id,
            'name' => 'New Name',
            'type' => 'report',
        ]);
    }

    public function test_admin_can_replace_document_file(): void
    {
        $oldFile = UploadedFile::fake()->create('old.pdf', 500);
        $doc = Document::factory()->create([
            'project_id' => $this->project->id,
            'added_by' => $this->admin->id,
        ]);

        // Upload initial file
        $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'Replaceable', 'type' => 'asset', 'file' => $oldFile]
        );

        $doc = Document::where('name', 'Replaceable')->first();
        $oldPath = $doc->file_path;

        // Replace with new file
        $newFile = UploadedFile::fake()->create('new.png', 800);
        $this->actingAs($this->admin)->put(
            route('projects.documents.update', [$this->project, $doc]),
            ['name' => 'Replaceable', 'type' => 'asset', 'file' => $newFile]
        );

        $doc->refresh();
        $this->assertNotEquals($oldPath, $doc->file_path);
        Storage::disk('local')->assertExists($doc->file_path);
    }

    public function test_admin_can_delete_document(): void
    {
        $file = UploadedFile::fake()->create('delete-me.pdf', 256);

        $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'To Delete', 'type' => 'other', 'file' => $file]
        );

        $doc = Document::where('name', 'To Delete')->first();
        $filePath = $doc->file_path;

        $response = $this->actingAs($this->admin)->delete(
            route('projects.documents.destroy', [$this->project, $doc])
        );

        $response->assertRedirect();
        $this->assertDatabaseMissing('documents', ['id' => $doc->id]);
        Storage::disk('local')->assertMissing($filePath);
    }

    public function test_client_cannot_upload_document(): void
    {
        $response = $this->actingAs($this->client)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'Unauthorized', 'type' => 'other']
        );

        $response->assertForbidden();
    }

    // ── Task Document Attachment ──────────────────────────────────────────────

    public function test_document_can_be_attached_to_task(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id]);
        $file = UploadedFile::fake()->create('deliverable.pdf', 512);

        $response = $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'Task Deliverable', 'type' => 'report', 'file' => $file, 'task_id' => $task->id]
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('documents', [
            'project_id' => $this->project->id,
            'task_id' => $task->id,
            'name' => 'Task Deliverable',
        ]);
    }

    public function test_task_document_appears_in_task_relationship(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id]);
        $doc = Document::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $task->id,
            'added_by' => $this->admin->id,
        ]);

        $this->assertTrue($task->documents->contains($doc));
        $this->assertEquals($task->id, $doc->task_id);
    }

    public function test_deleting_task_nullifies_document_task_id(): void
    {
        $task = Task::factory()->create(['project_id' => $this->project->id]);
        $doc = Document::factory()->create([
            'project_id' => $this->project->id,
            'task_id' => $task->id,
            'added_by' => $this->admin->id,
        ]);

        $task->delete();
        $doc->refresh();

        $this->assertNull($doc->task_id);
        $this->assertDatabaseHas('documents', ['id' => $doc->id]);
    }

    // ── Page Document Attachment ──────────────────────────────────────────────

    public function test_document_can_be_attached_to_page(): void
    {
        $page = ProjectPage::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->admin->id,
        ]);
        $file = UploadedFile::fake()->create('specs.pdf', 1024);

        $response = $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'Page Attachment', 'type' => 'report', 'file' => $file, 'page_id' => $page->id]
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('documents', [
            'project_id' => $this->project->id,
            'page_id' => $page->id,
            'name' => 'Page Attachment',
        ]);
    }

    public function test_page_document_appears_in_page_relationship(): void
    {
        $page = ProjectPage::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->admin->id,
        ]);
        $doc = Document::factory()->create([
            'project_id' => $this->project->id,
            'page_id' => $page->id,
            'added_by' => $this->admin->id,
        ]);

        $this->assertTrue($page->documents->contains($doc));
        $this->assertEquals($page->id, $doc->page_id);
    }

    public function test_deleting_page_nullifies_document_page_id(): void
    {
        $page = ProjectPage::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->admin->id,
        ]);
        $doc = Document::factory()->create([
            'project_id' => $this->project->id,
            'page_id' => $page->id,
            'added_by' => $this->admin->id,
        ]);

        $page->delete();
        $doc->refresh();

        $this->assertNull($doc->page_id);
        $this->assertDatabaseHas('documents', ['id' => $doc->id]);
    }

    public function test_page_can_have_multiple_documents(): void
    {
        $page = ProjectPage::factory()->create([
            'project_id' => $this->project->id,
            'created_by' => $this->admin->id,
        ]);

        $docs = Document::factory()->count(3)->create([
            'project_id' => $this->project->id,
            'page_id' => $page->id,
            'added_by' => $this->admin->id,
        ]);

        $this->assertCount(3, $page->fresh()->documents);
    }

    // ── Document Download & Preview ──────────────────────────────────────────

    public function test_admin_can_download_document(): void
    {
        $file = UploadedFile::fake()->create('download-test.pdf', 256);

        $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'Downloadable', 'type' => 'report', 'file' => $file]
        );

        $doc = Document::where('name', 'Downloadable')->first();

        $response = $this->actingAs($this->admin)->get(
            route('documents.download', $doc)
        );

        $response->assertOk();
        $response->assertHeader('content-disposition');
    }

    public function test_admin_can_preview_document(): void
    {
        $file = UploadedFile::fake()->create('preview-test.pdf', 256);

        $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'Previewable', 'type' => 'report', 'file' => $file]
        );

        $doc = Document::where('name', 'Previewable')->first();

        $response = $this->actingAs($this->admin)->get(
            route('documents.preview', $doc)
        );

        $response->assertOk();
        $this->assertStringContainsString('inline', $response->headers->get('content-disposition'));
    }

    public function test_download_returns_404_for_missing_file(): void
    {
        $doc = Document::factory()->create([
            'project_id' => $this->project->id,
            'added_by' => $this->admin->id,
            'file_path' => 'nonexistent/path.pdf',
        ]);

        $response = $this->actingAs($this->admin)->get(
            route('documents.download', $doc)
        );

        $response->assertNotFound();
    }

    // ── Validation ───────────────────────────────────────────────────────────

    public function test_document_requires_name(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['type' => 'other']
        );

        $response->assertSessionHasErrors('name');
    }

    public function test_document_requires_valid_type(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'Test', 'type' => 'invalid']
        );

        $response->assertSessionHasErrors('type');
    }

    public function test_task_id_must_exist(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'Test', 'type' => 'other', 'task_id' => 99999]
        );

        $response->assertSessionHasErrors('task_id');
    }

    public function test_page_id_must_exist(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'Test', 'type' => 'other', 'page_id' => 99999]
        );

        $response->assertSessionHasErrors('page_id');
    }

    // ── Portal Access ────────────────────────────────────────────────────────

    public function test_portal_enabled_project_allows_unauthenticated_download(): void
    {
        $this->project->update(['portal_enabled' => true, 'portal_code' => 'test123']);

        $file = UploadedFile::fake()->create('portal-doc.pdf', 256);
        $this->actingAs($this->admin)->post(
            route('projects.documents.store', $this->project),
            ['name' => 'Portal Doc', 'type' => 'report', 'file' => $file]
        );

        $doc = Document::where('name', 'Portal Doc')->first();

        // Access without authentication
        $response = $this->get(route('documents.download', $doc));
        $response->assertOk();
    }
}
