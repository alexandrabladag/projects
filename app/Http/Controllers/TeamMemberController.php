<?php

namespace App\Http\Controllers;

use App\Models\TeamMember;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeamMemberController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/TeamMembers', [
            'members' => TeamMember::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'nullable|email|max:255',
            'phone'      => 'nullable|string|max:50',
            'role'       => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'pay_type'      => 'nullable|in:hourly,monthly,fixed',
            'rate'          => 'nullable|numeric|min:0',
            'rate_currency' => 'nullable|string|max:10',
        ]);

        TeamMember::create($validated);

        return back()->with('success', 'Team member added.');
    }

    public function update(Request $request, TeamMember $teamMember)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'nullable|email|max:255',
            'phone'      => 'nullable|string|max:50',
            'role'       => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'pay_type'      => 'nullable|in:hourly,monthly,fixed',
            'rate'          => 'nullable|numeric|min:0',
            'rate_currency' => 'nullable|string|max:10',
            'is_active'  => 'boolean',
        ]);

        $teamMember->update($validated);

        return back()->with('success', 'Team member updated.');
    }

    public function destroy(TeamMember $teamMember)
    {
        $teamMember->delete();
        return back()->with('success', 'Team member removed.');
    }
}
