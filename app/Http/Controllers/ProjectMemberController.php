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
            'client_id'      => 'nullable|required_without:team_member_id|exists:clients,id',
            'team_member_id' => 'nullable|required_without:client_id|exists:team_members,id',
            'role'           => 'nullable|string|max:255',
            'notes'          => 'nullable|string',
        ]);

        $alreadyOnTeam = $project->members()
            ->when($validated['client_id'] ?? null, fn ($q, $id) => $q->where('client_id', $id))
            ->when($validated['team_member_id'] ?? null, fn ($q, $id) => $q->where('team_member_id', $id))
            ->exists();

        if ($alreadyOnTeam) {
            return back()->with('error', 'That person is already on this project team.');
        }

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
