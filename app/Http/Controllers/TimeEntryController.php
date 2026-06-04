<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\TimeEntry;
use Illuminate\Http\Request;

class TimeEntryController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $this->validateEntry($request, $project);

        $project->timeEntries()->create($validated);

        return back()->with('success', 'Time logged.');
    }

    public function update(Request $request, Project $project, TimeEntry $entry)
    {
        $this->authorize('update', $project);
        abort_unless($entry->project_id === $project->id, 404);

        $entry->update($this->validateEntry($request, $project));

        return back()->with('success', 'Time entry updated.');
    }

    public function destroy(Project $project, TimeEntry $entry)
    {
        $this->authorize('update', $project);
        abort_unless($entry->project_id === $project->id, 404);

        $entry->delete();

        return back()->with('success', 'Time entry deleted.');
    }

    private function validateEntry(Request $request, Project $project): array
    {
        $validated = $request->validate([
            'date'           => 'required|date',
            'hours'          => 'required|numeric|min:0.01|max:24',
            'team_member_id' => 'nullable|exists:team_members,id',
            'task_id'        => 'nullable|exists:tasks,id',
            'description'    => 'nullable|string|max:255',
            'billable'       => 'boolean',
        ]);

        // Defence in depth: a task must belong to this project.
        if (! empty($validated['task_id']) && ! $project->tasks()->whereKey($validated['task_id'])->exists()) {
            $validated['task_id'] = null;
        }

        $validated['billable'] = $request->boolean('billable');

        return $validated;
    }
}
