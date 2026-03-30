<?php
// ── ProposalController ────────────────────────────────────────────────────────
namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Proposal;
use Illuminate\Http\Request;

class ProposalController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'amount'       => 'required|numeric|min:0',
            'date'         => 'required|date',
            'valid_until'  => 'nullable|date',
            'summary'      => 'nullable|string',
            'scope'        => 'nullable|string',
            'deliverables' => 'nullable|array',
            'notes'        => 'nullable|string',
        ]);

        $project->proposals()->create($validated);

        return back()->with('success', 'Proposal created.');
    }

    public function update(Request $request, Proposal $proposal)
    {
        $this->authorize('update', $proposal->project);

        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'amount'       => 'required|numeric|min:0',
            'valid_until'  => 'nullable|date',
            'summary'      => 'nullable|string',
            'scope'        => 'nullable|string',
            'deliverables' => 'nullable|array',
            'notes'        => 'nullable|string',
        ]);

        $proposal->update($validated);

        return back()->with('success', 'Proposal updated.');
    }

    public function updateStatus(Request $request, Proposal $proposal)
    {
        $this->authorize('update', $proposal->project);

        $request->validate(['status' => 'required|in:draft,sent,approved,rejected']);

        $proposal->update(['status' => $request->status]);

        return back()->with('success', 'Proposal status updated.');
    }

    public function destroy(Proposal $proposal)
    {
        $this->authorize('update', $proposal->project);
        $proposal->delete();
        return back()->with('success', 'Proposal deleted.');
    }
}
