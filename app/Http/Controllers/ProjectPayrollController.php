<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectPayroll;
use Illuminate\Http\Request;

class ProjectPayrollController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'team_member_id' => 'required|exists:team_members,id',
            'period'         => 'required|string|max:100',
            'pay_type'       => 'required|in:hourly,monthly,fixed',
            'rate'           => 'required|numeric|min:0',
            'hours'          => 'nullable|numeric|min:0',
            'amount'         => 'required|numeric|min:0',
            'currency'       => 'nullable|string|max:10',
            'exchange_rate'  => 'nullable|numeric|min:0',
            'notes'          => 'nullable|string',
        ]);

        $validated['status'] = 'pending';
        $project->payroll()->create($validated);

        return back()->with('success', 'Payroll entry added.');
    }

    public function update(Request $request, Project $project, ProjectPayroll $payroll)
    {
        $this->authorize('update', $project);

        // Status-only update (from action buttons)
        if ($request->has('status') && count($request->all()) === 1) {
            $validated = $request->validate([
                'status' => 'required|in:pending,paid',
            ]);

            if ($validated['status'] === 'paid' && $payroll->status !== 'paid') {
                $validated['paid_date'] = now();
                $project->increment('spent', $payroll->converted_amount);
            }

            if ($payroll->status === 'paid' && $validated['status'] !== 'paid') {
                $validated['paid_date'] = null;
                $project->decrement('spent', $payroll->converted_amount);
            }

            $payroll->update($validated);
            return back()->with('success', 'Payroll status updated.');
        }

        // Full edit
        $validated = $request->validate([
            'team_member_id' => 'required|exists:team_members,id',
            'period'         => 'required|string|max:100',
            'pay_type'       => 'required|in:hourly,monthly,fixed',
            'rate'           => 'required|numeric|min:0',
            'hours'          => 'nullable|numeric|min:0',
            'amount'         => 'required|numeric|min:0',
            'currency'       => 'nullable|string|max:10',
            'exchange_rate'  => 'nullable|numeric|min:0',
            'notes'          => 'nullable|string',
        ]);

        // Adjust project spent if paid and the converted amount changed.
        if ($payroll->status === 'paid') {
            $oldConverted = $payroll->converted_amount;
            $newRate = $validated['exchange_rate'] ?? $payroll->exchange_rate ?? 1;
            $newConverted = (float) $validated['amount'] * (float) $newRate;
            if ($oldConverted !== $newConverted) {
                $project->decrement('spent', $oldConverted);
                $project->increment('spent', $newConverted);
            }
        }

        $payroll->update($validated);

        return back()->with('success', 'Payroll entry updated.');
    }

    public function destroy(Project $project, ProjectPayroll $payroll)
    {
        $this->authorize('update', $project);

        if ($payroll->status === 'paid') {
            $project->decrement('spent', $payroll->converted_amount);
        }

        $payroll->delete();

        return back()->with('success', 'Payroll entry removed.');
    }
}
