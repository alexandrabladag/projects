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
        ]);

        $filePath = null;
        $fileSize = null;

        if ($request->hasFile('file')) {
            $file     = $request->file('file');
            $filePath = $file->store("projects/{$project->id}/documents", 'private');
            $fileSize = $this->formatBytes($file->getSize());
        }

        $project->documents()->create([
            'name'      => $validated['name'],
            'type'      => $validated['type'],
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'added_by'  => $request->user()->id,
        ]);

        return back()->with('success', 'Document added.');
    }

    public function download(Document $document)
    {
        $this->authorize('view', $document->project);

        if (!$document->file_path || !Storage::disk('private')->exists($document->file_path)) {
            abort(404, 'File not found.');
        }

        return Storage::disk('private')->download($document->file_path, $document->name);
    }

    public function destroy(Document $document)
    {
        $this->authorize('update', $document->project);

        if ($document->file_path) {
            Storage::disk('private')->delete($document->file_path);
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
