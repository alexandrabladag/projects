<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Project;
use App\Models\TimeEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TimeEntryController extends Controller
{
    // Turn the project's unbilled billable hours into a draft invoice. Hours are
    // grouped into one line item per task (untasked time falls under "General"),
    // each priced at the supplied hourly rate. The source entries are stamped with
    // the new invoice so the same time can't be billed twice.
    public function bill(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'rate'     => 'required|numeric|min:0.01',
            'date'     => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:date',
        ]);

        $rate    = round((float) $validated['rate'], 2);
        $entries = $project->timeEntries()->unbilled()->with('task:id,title')->get();

        if ($entries->isEmpty()) {
            return back()->with('error', 'No unbilled billable hours to invoice.');
        }

        // One line per task, preserving log order; untasked time grouped together.
        $lines = $entries
            ->groupBy(fn ($e) => $e->task?->title ?: 'General time')
            ->map(function ($group, $label) use ($rate) {
                $hours = round((float) $group->sum('hours'), 2);

                return [
                    'description' => "{$label} — {$hours} hrs @ " . number_format($rate, 2) . '/hr',
                    'quantity'    => 1,
                    'rate'        => round($hours * $rate, 2),
                ];
            })
            ->values();

        $company = Company::first();

        DB::transaction(function () use ($project, $validated, $lines, $entries, $company) {
            $invoice = $project->invoices()->create([
                'number'      => $company?->generateNumber('invoice') ?? 'INV-' . date('Y') . '-001',
                'date'        => $validated['date'],
                'due_date'    => $validated['due_date'] ?? null,
                'description' => 'Time billed for ' . $project->name,
                'currency'    => $project->currency,
                'status'      => 'draft',
            ]);

            $invoice->items()->createMany($lines->all());
            $entries->toQuery()->update(['invoice_id' => $invoice->id]);

            $company?->incrementNumber('invoice');
        });

        $totalHours = round((float) $entries->sum('hours'), 2);

        return back()->with('success', "Invoiced {$totalHours} hrs across {$lines->count()} line " . ($lines->count() === 1 ? 'item.' : 'items.'));
    }

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
