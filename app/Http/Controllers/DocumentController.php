<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:contract,brief,report,asset,other',
            'file' => 'nullable|file|max:102400', // 100MB max
            'task_id' => 'nullable|exists:tasks,id',
        ]);

        $filePath = null;
        $fileSize = null;

        if ($request->hasFile('file')) {
            $file     = $request->file('file');
            $filePath = $file->store("projects/{$project->id}/documents", 'local');
            $fileSize = $this->formatBytes($file->getSize());
        }

        $project->documents()->create([
            'name'      => $validated['name'],
            'type'      => $validated['type'],
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'added_by'  => $request->user()->id,
            'task_id'   => $validated['task_id'] ?? null,
        ]);

        return back()->with('success', 'Document added.');
    }

    public function download(Request $request, Document $document)
    {
        $this->authorizeDocumentAccess($request, $document);

        if (!$document->file_path || !Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'File not found.');
        }

        $originalExt = pathinfo($document->file_path, PATHINFO_EXTENSION);
        $nameExt = pathinfo($document->name, PATHINFO_EXTENSION);
        $downloadName = $nameExt ? $document->name : $document->name . '.' . $originalExt;

        return Storage::disk('local')->download($document->file_path, $downloadName);
    }

    public function preview(Request $request, Document $document)
    {
        $this->authorizeDocumentAccess($request, $document);

        if (!$document->file_path || !Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'File not found.');
        }

        $mime = Storage::disk('local')->mimeType($document->file_path);

        return response(Storage::disk('local')->get($document->file_path), 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . $document->name . '"',
        ]);
    }

    private function authorizeDocumentAccess(Request $request, Document $document): void
    {
        $project = $document->project;

        // Allow access if the project portal is enabled (public portal)
        if ($project->portal_enabled) {
            return;
        }

        // Otherwise require standard authorization
        $this->authorize('view', $project);
    }

    public function update(Request $request, Project $project, Document $document)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:contract,brief,report,asset,other',
            'file' => 'nullable|file|max:102400',
        ]);

        if ($request->hasFile('file')) {
            // Delete old file
            if ($document->file_path) {
                Storage::disk('local')->delete($document->file_path);
            }
            $file = $request->file('file');
            $validated['file_path'] = $file->store("projects/{$project->id}/documents", 'local');
            $validated['file_size'] = $this->formatBytes($file->getSize());
        }
        unset($validated['file']);

        $document->update($validated);

        return back()->with('success', 'Document updated.');
    }

    public function destroy(Project $project, Document $document)
    {
        $this->authorize('update', $document->project);

        if ($document->file_path) {
            Storage::disk('local')->delete($document->file_path);
        }

        $document->delete();

        return back()->with('success', 'Document deleted.');
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
        if ($bytes >= 1024) return round($bytes / 1024, 1) . ' KB';
        return $bytes . ' B';
    }
}
