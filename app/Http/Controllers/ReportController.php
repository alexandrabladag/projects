<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    // Workspace-wide profitability: for every accessible project, revenue (billed)
    // against true costs (vendor bills + payroll) to surface real margin. Like the
    // rest of the app, amounts are shown at face value and never converted across
    // currencies — cross-project totals are grouped by currency instead.
    public function profitability(Request $request): Response
    {
        $user = $request->user();

        // Costs (bills, payroll) are sensitive — only project managers/admins.
        abort_unless($user->canManageProjects(), 403);

        $projects = Project::forUser($user)
            ->with(['invoices.items', 'bills', 'payroll'])
            ->get();

        $rows = $projects->map(function ($p) {
            $revenue   = round($p->total_billed, 2);
            $collected = round($p->total_paid, 2);
            $bills     = round($p->total_bills, 2);
            $payroll   = round($p->total_payroll, 2);
            $costs     = round($bills + $payroll, 2);
            $margin    = round($revenue - $costs, 2);

            return [
                'id'         => $p->id,
                'name'       => $p->name,
                'client'     => $p->client,
                'status'     => $p->status,
                'currency'   => $p->currency ?? 'USD',
                'revenue'    => $revenue,
                'collected'  => $collected,
                'bills'      => $bills,
                'payroll'    => $payroll,
                'costs'      => $costs,
                'margin'     => $margin,
                'margin_pct' => $revenue > 0 ? round($margin / $revenue * 100, 1) : null,
            ];
        })->sortByDesc('margin')->values();

        // Cross-project rollup, grouped by currency (no FX conversion).
        $summary = $rows
            ->groupBy('currency')
            ->map(fn ($group, $currency) => [
                'currency'  => $currency,
                'revenue'   => round($group->sum('revenue'), 2),
                'collected' => round($group->sum('collected'), 2),
                'costs'     => round($group->sum('costs'), 2),
                'margin'    => round($group->sum('margin'), 2),
                'projects'  => $group->count(),
            ])
            ->filter(fn ($s) => $s['revenue'] != 0 || $s['costs'] != 0)
            ->sortByDesc('revenue')
            ->values();

        return Inertia::render('Reports/Profitability', [
            'rows'         => $rows,
            'summary'      => $summary,
            'baseCurrency' => Company::first()?->base_currency ?? 'USD',
        ]);
    }
}
