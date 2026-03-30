<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $projects = Project::forUser($user)
            ->with(['manager', 'invoices.items', 'tasks'])
            ->latest()
            ->get()
            ->map(fn ($p) => array_merge($p->toArray(), [
                'budget_percent' => $p->budget_percent,
                'total_billed'   => $p->total_billed,
            ]));

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Project::class);

        return Inertia::render('Projects/Create');
    }

    public function store(Request $request)
    {
        $this->authorize('create', Project::class);

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'client'        => 'required|string|max:255',
            'contact_name'  => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'status'        => 'required|in:active,completed,on-hold',
            'start_date'    => 'nullable|date',
            'end_date'      => 'nullable|date|after_or_equal:start_date',
            'budget'        => 'nullable|numeric|min:0',
            'description'   => 'nullable|string',
            'tags'          => 'nullable|array',
            'tags.*'        => 'string|max:50',
            'phase'         => 'nullable|string|max:100',
        ]);

        $project = Project::create(array_merge($validated, [
            'manager_id' => $request->user()->id,
            'progress'   => 0,
            'spent'      => 0,
        ]));

        return redirect()->route('projects.show', $project)
            ->with('success', 'Project created successfully.');
    }

    public function show(Request $request, Project $project): Response
    {
        $this->authorize('view', $project);

        $project->load([
            'manager',
            'proposals',
            'invoices.items',
            'meetings',
            'documents.uploader',
            'tasks',
        ]);

        // Append computed attributes
        $projectData = array_merge($project->toArray(), [
            'budget_percent'   => $project->budget_percent,
            'total_billed'     => $project->total_billed,
            'total_paid'       => $project->total_paid,
            'budget_remaining' => $project->budget_remaining,
        ]);

        // Append invoice totals
        $projectData['invoices'] = $project->invoices->map(fn ($inv) => array_merge(
            $inv->toArray(),
            ['total' => $inv->total]
        ));

        return Inertia::render('Projects/Show', [
            'project'   => $projectData,
            'canManage' => $request->user()->canManageProjects(),
        ]);
    }

    public function edit(Project $project): Response
    {
        $this->authorize('update', $project);

        return Inertia::render('Projects/Edit', [
            'project' => $project,
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'client'        => 'required|string|max:255',
            'contact_name'  => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'status'        => 'required|in:active,completed,on-hold',
            'start_date'    => 'nullable|date',
            'end_date'      => 'nullable|date',
            'budget'        => 'nullable|numeric|min:0',
            'spent'         => 'nullable|numeric|min:0',
            'description'   => 'nullable|string',
            'tags'          => 'nullable|array',
            'phase'         => 'nullable|string|max:100',
        ]);

        $project->update($validated);

        return back()->with('success', 'Project updated.');
    }

    public function destroy(Project $project)
    {
        $this->authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects.index')
            ->with('success', 'Project deleted.');
    }

    public function updateProgress(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $request->validate([
            'progress' => 'required|integer|min:0|max:100',
            'phase'    => 'nullable|string|max:100',
        ]);

        $project->update([
            'progress' => $request->progress,
            'phase'    => $request->phase ?? $project->phase,
        ]);

        return back()->with('success', 'Progress updated.');
    }
}
