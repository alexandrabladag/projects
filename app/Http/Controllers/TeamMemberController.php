<?php

namespace App\Http\Controllers;

use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TeamMemberController extends Controller
{
    public function index(Request $request)
    {
        $workspaceId = $request->user()?->workspace_id;

        $members = TeamMember::with('user:id,name,email')->orderBy('name')->get();
        $linkedUserIds = $members->pluck('user_id')->filter()->all();

        // Staff accounts (admin/manager) with access that aren't already linked to a
        // team member, surfaced so everyone with access counts as a team member.
        $accounts = User::when($workspaceId, fn ($q) => $q->where('workspace_id', $workspaceId))
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['admin', 'manager']))
            ->whereNotIn('id', $linkedUserIds)
            ->with('roles:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn ($u) => [
                'id'    => $u->id,
                'name'  => $u->name,
                'email' => $u->email,
                'role'  => $u->roles->pluck('name')->map(fn ($r) => ucfirst($r))->join(', '),
            ])
            ->values();

        return Inertia::render('Settings/TeamMembers', [
            'members'  => $members,
            'accounts' => $accounts,
            // Login accounts that can be linked to a team member.
            'users'    => User::when($workspaceId, fn ($q) => $q->where('workspace_id', $workspaceId))
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->withPayDefaults($request->validate($this->rules()));

        TeamMember::create($validated);

        return back()->with('success', 'Team member added.');
    }

    public function update(Request $request, TeamMember $teamMember)
    {
        $validated = $this->withPayDefaults($request->validate($this->rules($teamMember->id) + [
            'is_active' => 'boolean',
        ]));

        $teamMember->update($validated);

        return back()->with('success', 'Team member updated.');
    }

    /** Pay columns are NOT NULL; fall back to their defaults when left blank. */
    private function withPayDefaults(array $validated): array
    {
        $validated['rate']          = $validated['rate'] ?? 0;
        $validated['pay_type']      = $validated['pay_type'] ?? 'monthly';
        $validated['rate_currency'] = $validated['rate_currency'] ?? 'PHP';

        return $validated;
    }

    public function destroy(TeamMember $teamMember)
    {
        $teamMember->delete();
        return back()->with('success', 'Team member removed.');
    }

    private function rules(?int $ignoreId = null): array
    {
        return [
            'name'          => 'required|string|max:255',
            'email'         => 'nullable|email|max:255',
            'phone'         => 'nullable|string|max:50',
            'role'          => 'nullable|string|max:255',
            'department'    => 'nullable|string|max:255',
            'pay_type'      => 'nullable|in:hourly,monthly,fixed',
            'rate'          => 'nullable|numeric|min:0',
            'rate_currency' => 'nullable|string|max:10',
            // One login account links to at most one team member.
            'user_id'       => ['nullable', 'exists:users,id', Rule::unique('team_members', 'user_id')->ignore($ignoreId)],
        ];
    }
}
