<?php
// ── ProposalController ────────────────────────────────────────────────────────
namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Project;
use App\Models\Proposal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProposalController extends Controller
{
    public function show(Proposal $proposal)
    {
        $proposal->load(['project.clientRecord']);

        return Inertia::render('Proposals/View', [
            'proposal' => $proposal,
            'company'  => Company::first(),
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title'              => 'required|string|max:255',
            'amount'             => 'required|numeric|min:0',
            'date'               => 'required|date',
            'valid_until'        => 'nullable|date',
            'sent_date'          => 'nullable|date',
            'signed_date'        => 'nullable|date',
            'summary'            => 'nullable|string',
            'scope'              => 'nullable|string',
            'deliverables'       => 'nullable|array',
            'notes'              => 'nullable|string',
            'content'            => 'nullable|string',
            'sections'           => 'nullable|array',
            'exclusions'         => 'nullable|string',
            'timeline'           => 'nullable|array',
            'payment_schedule'   => 'nullable|array',
            'prepared_by'        => 'nullable|string|max:255',
            'prepared_by_title'  => 'nullable|string|max:255',
            'approved_by'        => 'nullable|string|max:255',
            'approved_by_title'  => 'nullable|string|max:255',
        ]);

        $project->proposals()->create($validated);

        $company = Company::first();
        $company?->incrementNumber('proposal');

        return back()->with('success', 'Proposal created.');
    }

    public function update(Request $request, Project $project, Proposal $proposal)
    {
        $this->authorize('update', $proposal->project);

        $validated = $request->validate([
            'title'              => 'required|string|max:255',
            'amount'             => 'required|numeric|min:0',
            'date'               => 'nullable|date',
            'valid_until'        => 'nullable|date',
            'sent_date'          => 'nullable|date',
            'signed_date'        => 'nullable|date',
            'summary'            => 'nullable|string',
            'scope'              => 'nullable|string',
            'deliverables'       => 'nullable|array',
            'notes'              => 'nullable|string',
            'content'            => 'nullable|string',
            'sections'           => 'nullable|array',
            'exclusions'         => 'nullable|string',
            'timeline'           => 'nullable|array',
            'payment_schedule'   => 'nullable|array',
            'prepared_by'        => 'nullable|string|max:255',
            'prepared_by_title'  => 'nullable|string|max:255',
            'approved_by'        => 'nullable|string|max:255',
            'approved_by_title'  => 'nullable|string|max:255',
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

    public function destroy(Project $project, Proposal $proposal)
    {
        $this->authorize('update', $proposal->project);
        $proposal->delete();
        return back()->with('success', 'Proposal deleted.');
    }
}
