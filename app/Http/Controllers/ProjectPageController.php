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

        $project->pages()->create(array_merge($validated, [
            'created_by' => $request->user()->id,
        ]));

        return back()->with('success', 'Page created.');
    }

    public function update(Request $request, Project $project, ProjectPage $page)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title'   => 'required|string|max:255',
            'content' => 'nullable|string',
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
    public function publicView(string $code)
    {
        $page = ProjectPage::where('share_code', $code)->where('is_shared', true)->firstOrFail();
        $page->load('project');
        $company = Company::first();

        return Inertia::render('Pages/PublicPage', [
            'page'    => $page,
            'company' => $company ? ['name' => $company->name, 'logo_path' => $company->logo_path] : null,
        ]);
    }
}
