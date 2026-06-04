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

        // ── Needs Attention — things a PM must act on ─────────────────────────
        $today = now()->startOfDay();

        $overdueInvoiceCount = $allInvoices->filter(fn ($i) =>
            ! in_array($i->status, ['paid', 'draft']) && $i->due_date && $i->due_date->lt($today)
        )->count();

        $pastDeadlineCount = $activeProjects->filter(fn ($p) =>
            $p->end_date && $p->end_date->lt($today) && $p->progress < 100
        )->count();

        $overdueTaskCount = Task::whereIn('project_id', $projects->pluck('id'))
            ->whereNotIn('status', ['completed'])
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today)
            ->count();

        // ── My tasks (current user's linked team member) ──────────────────────
        $linkedId = $user->teamMember?->id;
        $myTasks  = collect();
        if ($linkedId) {
            $myTasks = Task::whereIn('project_id', $projects->pluck('id'))
                ->where('assignee_id', $linkedId)
                ->where('status', '!=', 'completed')
                ->with('project:id,name')
                ->orderByRaw('due_date is null')
                ->orderBy('due_date')
                ->orderBy('priority')
                ->limit(6)
                ->get(['id', 'title', 'status', 'priority', 'due_date', 'project_id'])
                ->map(fn ($t) => [
                    'id'       => $t->id,
                    'title'    => $t->title,
                    'status'   => $t->status,
                    'priority' => $t->priority,
                    'due_date' => optional($t->due_date)->toDateString(),
                    'project'  => $t->project ? ['id' => $t->project->id, 'name' => $t->project->name] : null,
                ]);
        }

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
            'attention' => [
                'overdue_invoices' => $overdueInvoiceCount,
                'past_deadline'    => $pastDeadlineCount,
                'overdue_tasks'    => $overdueTaskCount,
            ],
            'collection' => [
                'currency' => $baseCurrency,
                'billed'   => $billedByCurrency[$baseCurrency] ?? 0,
                'received' => $receivedByCurrency[$baseCurrency] ?? 0,
            ],
            'myTasks'          => $myTasks->values(),
            'hasLinkedMember'  => (bool) $linkedId,
            'activeProjects'   => $activeProjects->take(5)->values(),
            'upcomingMeetings' => $upcomingMeetings,
            'recentInvoices'   => $allInvoices->take(6)->values()->map(fn ($inv) => array_merge($inv->toArray(), ['total' => $inv->total])),
        ]);
    }
}
