<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskCategory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TaskCategoryController extends Controller
{
    public function index()
    {
        $categories = TaskCategory::orderBy('position')->orderBy('name')->get();

        // Count how many tasks (in the current workspace) use each category name.
        $counts = Task::whereHas('project')
            ->selectRaw('category, COUNT(*) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        return Inertia::render('Settings/TaskCategories', [
            'categories' => $categories->map(fn ($c) => array_merge($c->toArray(), [
                'task_count' => (int) ($counts[$c->name] ?? 0),
            ])),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:100', $this->uniqueName()],
            'color' => 'nullable|string|max:20',
        ]);

        TaskCategory::create([
            'name'     => $validated['name'],
            'color'    => $validated['color'] ?? '#6b7280',
            'position' => (TaskCategory::max('position') ?? 0) + 1,
        ]);

        return back()->with('success', 'Category added.');
    }

    public function update(Request $request, TaskCategory $taskCategory)
    {
        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:100', $this->uniqueName($taskCategory->id)],
            'color' => 'nullable|string|max:20',
        ]);

        $oldName = $taskCategory->name;

        $taskCategory->update([
            'name'  => $validated['name'],
            'color' => $validated['color'] ?? $taskCategory->color,
        ]);

        // Cascade the rename to every task in this workspace using the old name.
        if ($oldName !== $validated['name']) {
            Task::whereHas('project')
                ->where('category', $oldName)
                ->update(['category' => $validated['name']]);
        }

        return back()->with('success', 'Category updated.');
    }

    public function destroy(TaskCategory $taskCategory)
    {
        // Keep task data valid: move affected tasks back to "General".
        Task::whereHas('project')
            ->where('category', $taskCategory->name)
            ->update(['category' => 'General']);

        $taskCategory->delete();

        return back()->with('success', 'Category deleted.');
    }

    private function uniqueName(?int $ignoreId = null): Rule
    {
        $rule = Rule::unique('task_categories', 'name')
            ->where(fn ($q) => $q->where('workspace_id', auth()->user()?->workspace_id));

        return $ignoreId ? $rule->ignore($ignoreId) : $rule;
    }
}
