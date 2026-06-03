<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TeamMember;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MyTasksController extends Controller
{
    public function index(Request $request)
    {
        $user        = $request->user();
        $canManage   = $user->canManageProjects();
        $linkedId    = $user->teamMember?->id;

        // Which team member's tasks to show. Managers/admins may pick anyone or
        // "all"; everyone else is locked to their own linked record.
        $requested = $request->query('member');
        if (! $canManage) {
            $filter = $linkedId ? (string) $linkedId : 'none';
        } else {
            $filter = $requested ?: ($linkedId ? (string) $linkedId : 'all');
        }

        $query = Task::query()
            ->whereHas('project')                       // scopes to the current workspace
            ->where('status', '!=', 'completed')
            ->with('project:id,name');

        if ($filter === 'none') {
            $query->whereRaw('1 = 0');                  // user has no linked member yet
        } elseif ($filter !== 'all') {
            $query->where('assignee_id', $filter);
        }

        $tasks = $query
            ->orderByRaw('due_date is null')            // dated tasks first
            ->orderBy('due_date')
            ->orderBy('priority')
            ->get(['id', 'title', 'status', 'priority', 'due_date', 'category', 'assignee', 'assignee_id', 'project_id'])
            ->map(fn ($t) => [
                'id'         => $t->id,
                'title'      => $t->title,
                'status'     => $t->status,
                'priority'   => $t->priority,
                'due_date'   => optional($t->due_date)->toDateString(),
                'category'   => $t->category,
                'assignee'   => $t->assignee,
                'project'    => $t->project ? ['id' => $t->project->id, 'name' => $t->project->name] : null,
            ]);

        return Inertia::render('MyTasks', [
            'tasks'         => $tasks,
            'filter'        => $filter,
            'linkedId'      => $linkedId,
            'canManage'     => $canManage,
            'members'       => $canManage
                ? TeamMember::where('is_active', true)->orderBy('name')->get(['id', 'name'])
                : [],
        ]);
    }
}
