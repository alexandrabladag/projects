<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title'    => 'required|string|max:255',
            'assignee' => 'nullable|string|max:100',
            'due_date' => 'nullable|date',
            'priority' => 'required|in:high,medium,low',
            'status'   => 'required|in:not-started,in-progress,review,completed',
            'category' => 'nullable|string|max:100',
        ]);

        $project->tasks()->create($validated);

        return back()->with('success', 'Task added.');
    }

    public function update(Request $request, Task $task)
    {
        $this->authorize('update', $task->project);

        $validated = $request->validate([
            'title'    => 'required|string|max:255',
            'assignee' => 'nullable|string|max:100',
            'due_date' => 'nullable|date',
            'priority' => 'required|in:high,medium,low',
            'status'   => 'required|in:not-started,in-progress,review,completed',
            'category' => 'nullable|string|max:100',
        ]);

        $task->update($validated);

        return back()->with('success', 'Task updated.');
    }

    public function updateStatus(Request $request, Task $task)
    {
        $request->validate([
            'status' => 'required|in:not-started,in-progress,review,completed',
        ]);

        $task->update(['status' => $request->status]);

        return back()->with('success', 'Task status updated.');
    }

    public function destroy(Task $task)
    {
        $this->authorize('update', $task->project);
        $task->delete();
        return back()->with('success', 'Task deleted.');
    }
}
