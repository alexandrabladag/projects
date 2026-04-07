<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Project;
use Illuminate\Http\Request;

class BillController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'client_id'   => 'nullable|exists:clients,id',
            'number'      => 'nullable|string|max:100',
            'amount'      => 'required|numeric|min:0',
            'currency'    => 'nullable|string|max:10',
            'date'        => 'required|date',
            'due_date'    => 'nullable|date',
            'description' => 'nullable|string|max:500',
            'category'    => 'nullable|string|max:100',
            'notes'       => 'nullable|string',
            'file'        => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        if ($request->hasFile('file')) {
            $validated['file_path'] = $request->file('file')->store('bills', 'public');
            $validated['file_name'] = $request->file('file')->getClientOriginalName();
        }
        unset($validated['file']);

        $validated['status'] = 'pending';
        $project->bills()->create($validated);

        return back()->with('success', 'Bill added.');
    }

    public function update(Request $request, Project $project, Bill $bill)
    {
        $this->authorize('update', $project);

        // Status-only update (from action buttons)
        if ($request->has('status') && count($request->all()) === 1) {
            $validated = $request->validate([
                'status' => 'required|in:pending,approved,paid',
            ]);

            $updateData = ['status' => $validated['status']];

            if ($validated['status'] === 'paid' && $bill->status !== 'paid') {
                $updateData['paid_date'] = now();
                $updateData['paid_amount'] = $bill->amount;
                $updateData['paid_currency'] = $bill->currency;
                $project->increment('spent', $bill->amount);
            }

            if ($bill->status === 'paid' && $validated['status'] !== 'paid') {
                $project->decrement('spent', $bill->amount);
                $updateData['paid_date'] = null;
                $updateData['paid_amount'] = null;
            }

            $bill->update($updateData);
            return back()->with('success', 'Bill status updated.');
        }

        // Full edit
        $validated = $request->validate([
            'client_id'   => 'nullable|exists:clients,id',
            'number'      => 'nullable|string|max:100',
            'amount'      => 'required|numeric|min:0',
            'currency'    => 'nullable|string|max:10',
            'date'        => 'required|date',
            'due_date'    => 'nullable|date',
            'description' => 'nullable|string|max:500',
            'category'    => 'nullable|string|max:100',
            'notes'       => 'nullable|string',
            'file'        => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        // If bill was paid and amount changed, adjust project spent
        if ($bill->status === 'paid' && (float) $validated['amount'] !== (float) $bill->amount) {
            $project->decrement('spent', $bill->amount);
            $project->increment('spent', $validated['amount']);
            $validated['paid_amount'] = $validated['amount'];
        }

        if ($request->hasFile('file')) {
            $validated['file_path'] = $request->file('file')->store('bills', 'public');
            $validated['file_name'] = $request->file('file')->getClientOriginalName();
        }
        unset($validated['file']);

        $bill->update($validated);

        return back()->with('success', 'Bill updated.');
    }

    public function destroy(Project $project, Bill $bill)
    {
        $this->authorize('update', $project);

        // If bill was paid, reverse the spent amount
        if ($bill->status === 'paid') {
            $project->decrement('spent', $bill->amount);
        }

        $bill->delete();

        return back()->with('success', 'Bill deleted.');
    }
}
