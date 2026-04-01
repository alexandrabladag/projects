<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Project;
use App\Models\ProjectPage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectPageController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title'   => 'required|string|max:255',
            'content' => 'nullable|string',
        ]);

        // Auto-generate a simple 6-char password
        $password = strtoupper(substr(md5(rand()), 0, 6));

        $project->pages()->create(array_merge($validated, [
            'created_by' => $request->user()->id,
            'password'   => $password,
        ]));

        return back()->with('success', 'Page created.');
    }

    public function update(Request $request, Project $project, ProjectPage $page)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title'    => 'required|string|max:255',
            'content'  => 'nullable|string',
            'password' => 'nullable|string|max:100',
        ]);

        $page->update($validated);

        return back()->with('success', 'Page updated.');
    }

    public function destroy(Project $project, ProjectPage $page)
    {
        $this->authorize('update', $project);
        $page->delete();
        return back()->with('success', 'Page deleted.');
    }

    public function toggleShare(Project $project, ProjectPage $page)
    {
        $this->authorize('update', $project);

        if ($page->is_shared) {
            $page->update(['is_shared' => false, 'share_code' => null]);
        } else {
            $code = substr(md5($page->id . now()->timestamp . rand()), 0, 12);
            $page->update(['is_shared' => true, 'share_code' => $code]);
        }

        return back()->with('success', $page->is_shared ? 'Page shared.' : 'Page unshared.');
    }

    // Public view (no auth)
    public function publicView(Request $request, string $code)
    {
        $page = ProjectPage::where('share_code', $code)->where('is_shared', true)->firstOrFail();

        // Full HTML document — serve directly as raw HTML
        $isFullHtml = str_contains($page->content ?? '', '<!DOCTYPE') || str_contains($page->content ?? '', '<html');

        if ($isFullHtml) {
            $html = str_replace('<head>', '<head><meta name="robots" content="noindex, nofollow">', $page->content);
            return response($html, 200, [
                'Content-Type' => 'text/html; charset=UTF-8',
                'X-Robots-Tag' => 'noindex, nofollow',
            ]);
        }

        // Simple content — render with Inertia wrapper
        $page->load('project');
        $company = Company::first();

        return Inertia::render('Pages/PublicPage', [
            'page'    => $page,
            'company' => $company ? ['name' => $company->name, 'logo_path' => $company->logo_path] : null,
        ]);
    }
}
