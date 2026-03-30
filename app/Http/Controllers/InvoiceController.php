<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Project;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'number'      => 'required|string|unique:invoices,number',
            'date'        => 'required|date',
            'due_date'    => 'nullable|date',
            'description' => 'nullable|string|max:255',
            'items'       => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity'    => 'required|integer|min:1',
            'items.*.rate'        => 'required|numeric|min:0',
        ]);

        $invoice = $project->invoices()->create([
            'number'      => $validated['number'],
            'date'        => $validated['date'],
            'due_date'    => $validated['due_date'] ?? null,
            'description' => $validated['description'] ?? null,
            'status'      => 'draft',
        ]);

        foreach ($validated['items'] as $item) {
            $invoice->items()->create($item);
        }

        return back()->with('success', 'Invoice created.');
    }

    public function update(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice->project);

        $validated = $request->validate([
            'due_date'    => 'nullable|date',
            'description' => 'nullable|string|max:255',
            'items'       => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity'    => 'required|integer|min:1',
            'items.*.rate'        => 'required|numeric|min:0',
        ]);

        $invoice->update([
            'due_date'    => $validated['due_date'],
            'description' => $validated['description'],
        ]);

        $invoice->items()->delete();
        foreach ($validated['items'] as $item) {
            $invoice->items()->create($item);
        }

        return back()->with('success', 'Invoice updated.');
    }

    public function updateStatus(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice->project);

        $request->validate([
            'status' => 'required|in:draft,sent,paid,overdue',
        ]);

        $invoice->update(['status' => $request->status]);

        return back()->with('success', 'Invoice status updated.');
    }

    public function destroy(Invoice $invoice)
    {
        $this->authorize('update', $invoice->project);
        $invoice->delete();
        return back()->with('success', 'Invoice deleted.');
    }
}
