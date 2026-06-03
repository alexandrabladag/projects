<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMember;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function reorder(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        // Only reorder tasks that actually belong to this project.
        $ids = $project->tasks()->whereIn('id', $validated['ids'])->pluck('id')->all();
        $ordered = array_values(array_filter($validated['ids'], fn ($id) => in_array($id, $ids)));

        foreach ($ordered as $position => $id) {
            Task::where('id', $id)->update(['position' => $position]);
        }

        return back(303)->with('success', 'Tasks reordered.');
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'assignee_id' => 'nullable|exists:team_members,id',
            'due_date'    => 'nullable|date',
            'priority'    => 'required|in:high,medium,low',
            'status'      => 'required|in:not-started,in-progress,review,pending-approval,completed',
            'category'    => 'nullable|string|max:100',
        ]);

        $validated['assignee'] = $this->assigneeName($validated['assignee_id'] ?? null);

        $project->tasks()->create($validated);
        $project->recalculateProgress();

        return back()->with('success', 'Task added.');
    }

    public function update(Request $request, Project $project, Task $task)
    {
        $this->authorize('update', $task->project);

        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'assignee_id' => 'nullable|exists:team_members,id',
            'due_date'    => 'nullable|date',
            'priority'    => 'required|in:high,medium,low',
            'status'      => 'required|in:not-started,in-progress,review,pending-approval,completed',
            'category'    => 'nullable|string|max:100',
        ]);

        $validated['assignee'] = $this->assigneeName($validated['assignee_id'] ?? null);

        $task->update($validated);
        $task->project->recalculateProgress();

        return back()->with('success', 'Task updated.');
    }

    public function updateStatus(Request $request, Task $task)
    {
        $request->validate([
            'status' => 'required|in:not-started,in-progress,review,pending-approval,completed',
        ]);

        $task->update(['status' => $request->status]);
        $task->project->recalculateProgress();

        return back()->with('success', 'Task status updated.');
    }

    public function destroy(Project $project, Task $task)
    {
        $this->authorize('update', $task->project);
        $task->delete();
        $project->recalculateProgress();
        return back()->with('success', 'Task deleted.');
    }

    private function assigneeName(?int $teamMemberId): ?string
    {
        return $teamMemberId ? TeamMember::find($teamMemberId)?->name : null;
    }
}
