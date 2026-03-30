<?php

namespace App\Http\Controllers;

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
        $totalBudget    = $projects->sum('budget');
        $pendingInvoices = $allInvoices->whereIn('status', ['sent', 'overdue']);
        $pendingAmount  = $pendingInvoices->sum('total');
        $openTasks      = Task::whereIn('project_id', $projects->pluck('id'))
            ->whereNotIn('status', ['completed'])
            ->count();

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_projects'   => $projects->count(),
                'active_projects'  => $activeProjects->count(),
                'total_budget'     => $totalBudget,
                'pending_invoices' => $pendingInvoices->count(),
                'pending_amount'   => $pendingAmount,
                'open_tasks'       => $openTasks,
            ],
            'activeProjects'   => $activeProjects->take(5)->values(),
            'upcomingMeetings' => $upcomingMeetings,
            'recentInvoices'   => $allInvoices->take(6)->values(),
        ]);
    }
}
