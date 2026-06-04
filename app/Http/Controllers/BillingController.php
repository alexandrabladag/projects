<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\Proposal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    // A workspace-wide hub for the proposal → invoice revenue pipeline.
    // Proposals and invoices aren't workspace-scoped themselves; they scope
    // through their project, so we gather them via the user's accessible projects.
    public function index(Request $request): Response
    {
        $user       = $request->user();
        $projectIds = Project::forUser($user)->pluck('id');

        $proposals = Proposal::whereIn('project_id', $projectIds)
            ->with('project:id,name,client,currency')
            ->latest('date')
            ->get()
            ->map(fn ($p) => [
                'id'          => $p->id,
                'title'       => $p->title,
                'status'      => $p->status,
                'amount'      => (float) $p->amount,
                'currency'    => $p->currency ?? $p->project?->currency ?? 'USD',
                'date'        => optional($p->date)->toDateString(),
                'valid_until' => optional($p->valid_until)->toDateString(),
                'project'     => $p->project ? ['id' => $p->project->id, 'name' => $p->project->name, 'client' => $p->project->client] : null,
            ]);

        $invoices = Invoice::whereIn('project_id', $projectIds)
            ->with(['items', 'project:id,name,client,currency'])
            ->latest('date')
            ->get()
            ->map(fn ($i) => [
                'id'                => $i->id,
                'number'            => $i->number,
                'status'            => $i->status,
                'amount'            => (float) $i->total,
                'currency'          => $i->currency ?? $i->project?->currency ?? 'USD',
                'date'              => optional($i->date)->toDateString(),
                'due_date'          => optional($i->due_date)->toDateString(),
                'received_amount'   => $i->received_amount ? (float) $i->received_amount : null,
                'received_currency' => $i->received_currency,
                'project'           => $i->project ? ['id' => $i->project->id, 'name' => $i->project->name, 'client' => $i->project->client] : null,
            ]);

        // Pipeline totals grouped by currency — the app never converts across currencies.
        $byCurrency = fn ($collection) => $collection
            ->groupBy('currency')
            ->map(fn ($group) => round($group->sum('amount'), 2))
            ->filter(fn ($total) => $total != 0);

        $pipeline = [
            'proposed'  => $byCurrency($proposals->whereNotIn('status', ['rejected'])),
            'approved'  => $byCurrency($proposals->where('status', 'approved')),
            'invoiced'  => $byCurrency($invoices),
            'collected' => $byCurrency($invoices->where('status', 'paid')),
        ];

        $company = Company::first();

        return Inertia::render('Billing/Index', [
            'proposals'    => $proposals->values(),
            'invoices'     => $invoices->values(),
            'pipeline'     => $pipeline,
            'baseCurrency' => $company?->base_currency ?? 'USD',
            'canManage'    => $user->canManageProjects(),
            // For the create-from-hub modals: selectable projects + a suggested invoice number.
            'projectOptions'    => Project::forUser($user)->orderBy('name')->get(['id', 'name', 'client', 'currency']),
            'nextInvoiceNumber' => $company?->generateNumber('invoice') ?? 'INV-' . date('Y') . '-001',
        ]);
    }
}
