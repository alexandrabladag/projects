<?php

namespace App\Support;

use App\Models\Invoice;
use App\Models\PageFeedback;
use App\Models\Project;
use App\Models\Proposal;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

// Builds the cross-project "needs attention" feed that powers the topbar
// notification bell. Everything is derived live from existing records — there
// is no notifications table — so the feed is always current without a scheduler.
class AttentionFeed
{
    const PER_GROUP = 8;     // cap items shown per group
    const SOON_DAYS = 7;     // "due soon" / "expiring" window

    public static function for(User $user): array
    {
        $today      = Carbon::today();
        $soon       = $today->copy()->addDays(self::SOON_DAYS);
        $projectIds = Project::forUser($user)->pluck('id');

        $groups = array_values(array_filter([
            self::clientFeedback($projectIds),
            self::overdueInvoices($projectIds, $today),
            self::dueSoonInvoices($projectIds, $today, $soon),
            self::overdueTasks($projectIds, $today),
            self::pastDeadlineProjects($user, $today),
            self::expiringProposals($projectIds, $today, $soon),
        ]));

        return [
            'count'  => array_sum(array_column($groups, 'total')),
            'groups' => $groups,
        ];
    }

    private static function group(string $key, string $label, string $severity, $items): ?array
    {
        $total = $items->count();
        if ($total === 0) {
            return null;
        }

        return [
            'key'      => $key,
            'label'    => $label,
            'severity' => $severity, // danger | warn
            'total'    => $total,
            'items'    => $items->take(self::PER_GROUP)->values()->all(),
            'overflow' => max(0, $total - self::PER_GROUP),
        ];
    }

    private static function days(Carbon $today, $date): int
    {
        return (int) $today->diffInDays($date, false);
    }

    // Unresolved comments left by clients on shared pages. They clear from the feed once a
    // team member resolves the thread (resolve cascades to the whole branch). Client root
    // comments store is_admin = null and client replies store false; only team replies are true.
    private static function clientFeedback($projectIds): ?array
    {
        $items = PageFeedback::whereNull('resolved_at')
            ->where(fn ($q) => $q->whereNull('is_admin')->orWhere('is_admin', false))
            ->whereHas('page', fn ($q) => $q->whereIn('project_id', $projectIds))
            ->with('page:id,title,project_id')
            ->latest()
            ->get()
            ->map(fn ($f) => [
                'id'    => $f->id,
                'title' => Str::limit(trim(strip_tags($f->body)), 60) ?: 'New comment',
                'meta'  => ($f->author_name ?: 'Client') . ' · ' . ($f->page?->title ?? 'Page'),
                'href'  => $f->page?->project_id ? route('projects.show', $f->page->project_id) . '?tab=pages' : null,
            ]);

        return self::group('client_feedback', 'Client feedback', 'info', $items);
    }

    private static function overdueInvoices($projectIds, Carbon $today): ?array
    {
        $items = Invoice::whereIn('project_id', $projectIds)
            ->whereIn('status', ['sent', 'overdue'])
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today)
            ->with(['items', 'project:id,name,currency'])
            ->orderBy('due_date')
            ->get()
            ->map(fn ($i) => [
                'id'       => $i->id,
                'title'    => ($i->number ? "#{$i->number}" : 'Invoice') . ' · ' . ($i->project?->name ?? '—'),
                'meta'     => abs(self::days($today, $i->due_date)) . 'd overdue',
                'href'     => $i->project ? route('projects.show', $i->project_id) . '?tab=invoices' : null,
            ]);

        return self::group('overdue_invoices', 'Overdue invoices', 'danger', $items);
    }

    private static function dueSoonInvoices($projectIds, Carbon $today, Carbon $soon): ?array
    {
        $items = Invoice::whereIn('project_id', $projectIds)
            ->where('status', 'sent')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '>=', $today)
            ->whereDate('due_date', '<=', $soon)
            ->with('project:id,name')
            ->orderBy('due_date')
            ->get()
            ->map(fn ($i) => [
                'id'    => $i->id,
                'title' => ($i->number ? "#{$i->number}" : 'Invoice') . ' · ' . ($i->project?->name ?? '—'),
                'meta'  => self::dueLabel(self::days($today, $i->due_date)),
                'href'  => $i->project ? route('projects.show', $i->project_id) . '?tab=invoices' : null,
            ]);

        return self::group('due_soon_invoices', 'Invoices due soon', 'warn', $items);
    }

    private static function overdueTasks($projectIds, Carbon $today): ?array
    {
        $items = Task::whereIn('project_id', $projectIds)
            ->whereNotIn('status', ['completed'])
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today)
            ->with('project:id,name')
            ->orderBy('due_date')
            ->get()
            ->map(fn ($t) => [
                'id'    => $t->id,
                'title' => $t->title,
                'meta'  => ($t->project?->name ? $t->project->name . ' · ' : '') . abs(self::days($today, $t->due_date)) . 'd overdue',
                'href'  => $t->project ? route('projects.show', $t->project_id) . '?tab=tasks' : null,
            ]);

        return self::group('overdue_tasks', 'Overdue tasks', 'danger', $items);
    }

    private static function pastDeadlineProjects(User $user, Carbon $today): ?array
    {
        $items = Project::forUser($user)
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', $today)
            ->where('progress', '<', 100)
            ->orderBy('end_date')
            ->get(['id', 'name', 'end_date', 'progress'])
            ->map(fn ($p) => [
                'id'    => $p->id,
                'title' => $p->name,
                'meta'  => abs(self::days($today, $p->end_date)) . 'd past deadline · ' . $p->progress . '% done',
                'href'  => route('projects.show', $p->id),
            ]);

        return self::group('past_deadline', 'Projects past deadline', 'warn', $items);
    }

    private static function expiringProposals($projectIds, Carbon $today, Carbon $soon): ?array
    {
        $items = Proposal::whereIn('project_id', $projectIds)
            ->whereIn('status', ['draft', 'sent'])
            ->whereNotNull('valid_until')
            ->whereDate('valid_until', '<=', $soon)
            ->with('project:id,name')
            ->orderBy('valid_until')
            ->get()
            ->map(function ($p) use ($today) {
                $d = self::days($today, $p->valid_until);

                return [
                    'id'    => $p->id,
                    'title' => ($p->title ?: 'Proposal') . ' · ' . ($p->project?->name ?? '—'),
                    'meta'  => $d < 0 ? abs($d) . 'd expired' : self::dueLabel($d, 'expires'),
                    'href'  => $p->project ? route('projects.show', $p->project_id) . '?tab=proposal' : null,
                ];
            });

        return self::group('expiring_proposals', 'Proposals expiring', 'warn', $items);
    }

    private static function dueLabel(int $days, string $verb = 'due'): string
    {
        if ($days <= 0) return "$verb today";
        if ($days === 1) return "$verb tomorrow";

        return "$verb in {$days}d";
    }
}
