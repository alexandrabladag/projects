<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Invoice;
use App\Models\Meeting;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $projects = Project::forUser($user)
            ->with(['invoices.items', 'meetings', 'tasks'])
            ->get();

        $activeProjects = $projects->where('status', 'active');

        // All invoices across user-accessible projects
        $allInvoices = Invoice::whereIn('project_id', $projects->pluck('id'))
            ->with(['items', 'project'])
            ->latest()
            ->get();

        // Upcoming meetings
        $upcomingMeetings = Meeting::whereIn('project_id', $projects->pluck('id'))
            ->upcoming()
            ->with('project')
            ->limit(6)
            ->get();

        // Stats
        $company = Company::first();
        $baseCurrency = $company->base_currency ?? 'USD';

        $pendingInvoices = $allInvoices->whereIn('status', ['sent', 'overdue']);
        $paidInvoices    = $allInvoices->where('status', 'paid');

        // Group totals by currency
        $budgetByCurrency = $projects->groupBy(fn ($p) => $p->currency ?? 'USD')->map(fn ($g) => $g->sum('budget'));
        $billedByCurrency = $allInvoices->groupBy(fn ($i) => $i->currency ?? $i->project?->currency ?? 'USD')->map(fn ($g) => $g->sum('total'));
        $pendingByCurrency = $pendingInvoices->groupBy(fn ($i) => $i->currency ?? $i->project?->currency ?? 'USD')->map(fn ($g) => $g->sum('total'));

        // Received amounts (in the currency actually received)
        $receivedByCurrency = $paidInvoices
            ->filter(fn ($inv) => $inv->received_amount)
            ->groupBy(fn ($inv) => $inv->received_currency ?? $baseCurrency)
            ->map(fn ($g) => $g->sum('received_amount'));

        $openTasks = Task::whereIn('project_id', $projects->pluck('id'))
            ->whereNotIn('status', ['completed'])
            ->count();

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_projects'      => $projects->count(),
                'active_projects'     => $activeProjects->count(),
                'budget_by_currency'  => $budgetByCurrency,
                'billed_by_currency'  => $billedByCurrency,
                'pending_by_currency' => $pendingByCurrency,
                'received_by_currency'=> $receivedByCurrency,
                'pending_invoices'    => $pendingInvoices->count(),
                'open_tasks'          => $openTasks,
            ],
            'activeProjects'   => $activeProjects->take(5)->values(),
            'upcomingMeetings' => $upcomingMeetings,
            'recentInvoices'   => $allInvoices->take(6)->values()->map(fn ($inv) => array_merge($inv->toArray(), ['total' => $inv->total])),
        ]);
    }
}
