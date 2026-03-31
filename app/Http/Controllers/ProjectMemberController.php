<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectMember;
use Illuminate\Http\Request;

class ProjectMemberController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'role'      => 'nullable|string|max:255',
            'notes'     => 'nullable|string',
        ]);

        $project->members()->create($validated);

        return back()->with('success', 'Team member added.');
    }

    public function destroy(Project $project, ProjectMember $member)
    {
        $this->authorize('update', $project);
        $member->delete();
        return back()->with('success', 'Team member removed.');
    }
}
