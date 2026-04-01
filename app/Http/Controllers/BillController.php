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

        $validated = $request->validate([
            'status' => 'required|in:pending,approved,paid',
        ]);

        $updateData = ['status' => $validated['status']];

        // When marking as paid, update project spent
        if ($validated['status'] === 'paid' && $bill->status !== 'paid') {
            $updateData['paid_date'] = now();
            $updateData['paid_amount'] = $bill->amount;
            $updateData['paid_currency'] = $bill->currency;

            // Increase project spent
            $project->increment('spent', $bill->amount);
        }

        // If un-paying (reverting from paid), decrease spent
        if ($bill->status === 'paid' && $validated['status'] !== 'paid') {
            $project->decrement('spent', $bill->amount);
            $updateData['paid_date'] = null;
            $updateData['paid_amount'] = null;
        }

        $bill->update($updateData);

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
