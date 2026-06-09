<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectPage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MockupImportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $client;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'admin']);
        Role::create(['name' => 'manager']);
        Role::create(['name' => 'client']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->client = User::factory()->create();
        $this->client->assignRole('client');

        $this->project = Project::factory()->create([
            'manager_id'     => $this->admin->id,
            'client_user_id' => $this->client->id,
        ]);

        Storage::fake('local');
    }

    /** Build a real .zip on the local filesystem and wrap it as an UploadedFile. */
    private function makeZip(array $files, string $name = 'MySite.zip'): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'mock') . '.zip';
        $zip = new \ZipArchive();
        $zip->open($path, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
        foreach ($files as $rel => $content) {
            $zip->addFromString($rel, $content);
        }
        $zip->close();

        return new UploadedFile($path, $name, 'application/zip', null, true);
    }

    /** A typical multi-page mockup nested inside a wrapper folder. */
    private function sampleFiles(): array
    {
        return [
            'MySite/index.html' => '<!DOCTYPE html><html><head><title>Home</title>'
                . '<link rel="stylesheet" href="css/style.css"></head>'
                . '<body><h1>Home Page</h1><a href="about.html">About</a></body></html>',
            'MySite/about.html' => '<!DOCTYPE html><html><head><title>About</title></head>'
                . '<body><h1>About Page</h1><a href="index.html">Home</a></body></html>',
            'MySite/css/style.css' => 'body{font-family:sans-serif;color:#222}',
            'MySite/js/app.js'     => 'console.log("hi");',
        ];
    }

    private function share(ProjectPage $page, string $code = 'sharecode01'): void
    {
        $page->update(['is_shared' => true, 'share_code' => $code]);
    }

    // ── Import ────────────────────────────────────────────────────────────────

    public function test_admin_can_import_a_multi_page_mockup(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip($this->sampleFiles())]
        );

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $page = ProjectPage::where('project_id', $this->project->id)->first();
        $this->assertNotNull($page);
        // Wrapper folder detected as the served root; entry auto-detected.
        $this->assertSame("mockups/{$page->id}/MySite", $page->mockup_path);
        $this->assertSame('index.html', $page->entry_file);
        $this->assertSame('MySite', $page->title); // derived from the zip name

        Storage::disk('local')->assertExists("{$page->mockup_path}/index.html");
        Storage::disk('local')->assertExists("{$page->mockup_path}/about.html");
        Storage::disk('local')->assertExists("{$page->mockup_path}/css/style.css");
        Storage::disk('local')->assertExists("{$page->mockup_path}/js/app.js");
    }

    public function test_import_uses_explicit_title_when_provided(): void
    {
        $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['title' => 'Client Pitch', 'file' => $this->makeZip($this->sampleFiles())]
        );

        $this->assertDatabaseHas('project_pages', [
            'project_id' => $this->project->id,
            'title'      => 'Client Pitch',
        ]);
    }

    public function test_import_handles_flat_zip_without_wrapper_folder(): void
    {
        $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip([
                'index.html'     => '<!DOCTYPE html><html><head></head><body>Flat</body></html>',
                'css/style.css'  => 'body{}',
            ])]
        );

        $page = ProjectPage::where('project_id', $this->project->id)->first();
        $this->assertSame("mockups/{$page->id}", $page->mockup_path);
        $this->assertSame('index.html', $page->entry_file);
    }

    public function test_import_picks_index_html_even_when_not_first(): void
    {
        $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip([
                'aaa.html'   => '<html><body>A</body></html>',
                'index.html' => '<html><body>Home</body></html>',
                'zzz.html'   => '<html><body>Z</body></html>',
            ])]
        );

        $page = ProjectPage::where('project_id', $this->project->id)->first();
        $this->assertSame('index.html', $page->entry_file);
    }

    public function test_import_falls_back_to_shallowest_html_without_index(): void
    {
        $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip([
                'deep/nested/page.html' => '<html><body>Deep</body></html>',
                'home.html'             => '<html><body>Home</body></html>',
            ])]
        );

        $page = ProjectPage::where('project_id', $this->project->id)->first();
        $this->assertSame('home.html', $page->entry_file);
        $this->assertSame("mockups/{$page->id}", $page->mockup_path);
    }

    // ── Serving ───────────────────────────────────────────────────────────────

    public function test_shared_mockup_serves_entry_page_with_base_tag(): void
    {
        $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip($this->sampleFiles())]
        );
        $page = ProjectPage::where('project_id', $this->project->id)->first();
        $this->share($page, 'homecode');

        $response = $this->get('/page/homecode');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/html; charset=UTF-8');
        $response->assertSee('Home Page', false);
        $response->assertSee('<base href="/page/homecode/">', false);
        $response->assertHeader('x-robots-tag', 'noindex, nofollow');
    }

    public function test_shared_mockup_serves_css_asset_with_correct_mime(): void
    {
        $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip($this->sampleFiles())]
        );
        $page = ProjectPage::where('project_id', $this->project->id)->first();
        $this->share($page, 'csscode');

        $response = $this->get('/page/csscode/css/style.css');

        $response->assertOk();
        $this->assertStringStartsWith('text/css', $response->headers->get('content-type'));
        $response->assertSee('font-family:sans-serif', false);
    }

    public function test_shared_mockup_serves_subpage_with_base_tag(): void
    {
        $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip($this->sampleFiles())]
        );
        $page = ProjectPage::where('project_id', $this->project->id)->first();
        $this->share($page, 'subcode');

        $response = $this->get('/page/subcode/about.html');

        $response->assertOk();
        $response->assertSee('About Page', false);
        $response->assertSee('<base href="/page/subcode/">', false);
    }

    public function test_missing_asset_returns_404(): void
    {
        $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip($this->sampleFiles())]
        );
        $page = ProjectPage::where('project_id', $this->project->id)->first();
        $this->share($page, 'miss404');

        $this->get('/page/miss404/css/nope.css')->assertNotFound();
    }

    public function test_path_traversal_is_blocked(): void
    {
        $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip($this->sampleFiles())]
        );
        $page = ProjectPage::where('project_id', $this->project->id)->first();
        $this->share($page, 'travcode');

        $this->get('/page/travcode/' . urlencode('../../') . 'index.html')->assertNotFound();
    }

    public function test_unshared_mockup_is_not_publicly_accessible(): void
    {
        $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip($this->sampleFiles())]
        );
        // never shared
        $this->get('/page/whatever')->assertNotFound();
    }

    // ── Validation & cleanup ──────────────────────────────────────────────────

    public function test_non_zip_upload_is_rejected_and_no_page_created(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => UploadedFile::fake()->create('notes.txt', 10)]
        );

        $response->assertSessionHasErrors('file');
        $this->assertDatabaseCount('project_pages', 0);
    }

    public function test_zip_without_html_is_rejected_and_no_page_persists(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip(['css/style.css' => 'body{}', 'js/app.js' => ''])]
        );

        $response->assertSessionHasErrors('file');
        // page is created then rolled back when no entry is found
        $this->assertDatabaseCount('project_pages', 0);
    }

    public function test_file_is_required(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            []
        );

        $response->assertSessionHasErrors('file');
    }

    public function test_client_cannot_import_mockup(): void
    {
        $response = $this->actingAs($this->client)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip($this->sampleFiles())]
        );

        $response->assertForbidden();
        $this->assertDatabaseCount('project_pages', 0);
    }

    public function test_deleting_mockup_page_removes_extracted_files(): void
    {
        $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip($this->sampleFiles())]
        );
        $page = ProjectPage::where('project_id', $this->project->id)->first();
        Storage::disk('local')->assertExists("mockups/{$page->id}/MySite/index.html");

        $this->actingAs($this->admin)->delete(
            route('projects.pages.destroy', [$this->project, $page])
        )->assertRedirect();

        $this->assertDatabaseMissing('project_pages', ['id' => $page->id]);
        Storage::disk('local')->assertMissing("mockups/{$page->id}/MySite/index.html");
    }

    public function test_macos_junk_and_dotfiles_are_skipped(): void
    {
        $this->actingAs($this->admin)->post(
            route('projects.pages.import-mockup', $this->project),
            ['file' => $this->makeZip([
                'index.html'                  => '<html><body>Home</body></html>',
                '__MACOSX/._index.html'       => 'junk',
                '.DS_Store'                   => 'junk',
                'css/.hidden'                 => 'secret',
            ])]
        );

        $page = ProjectPage::where('project_id', $this->project->id)->first();
        Storage::disk('local')->assertExists("{$page->mockup_path}/index.html");
        Storage::disk('local')->assertMissing("{$page->mockup_path}/__MACOSX/._index.html");
        Storage::disk('local')->assertMissing("{$page->mockup_path}/.DS_Store");
        Storage::disk('local')->assertMissing("{$page->mockup_path}/css/.hidden");
    }
}
