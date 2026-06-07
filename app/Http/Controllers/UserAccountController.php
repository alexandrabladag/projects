<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Admin-only creation of login accounts. Public registration is disabled
 * (see routes/auth.php), so new staff/client logins are added here instead.
 */
class UserAccountController extends Controller
{
    /** Roles an admin may assign when creating an account. */
    private const ASSIGNABLE_ROLES = ['admin', 'manager', 'client'];

    public function index(Request $request)
    {
        $workspaceId = $request->user()?->workspace_id;
        $currentId   = $request->user()->id;

        $accounts = User::when($workspaceId, fn ($q) => $q->where('workspace_id', $workspaceId))
            ->with('roles:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'username', 'phone', 'created_at'])
            ->map(fn ($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'username'   => $u->username,
                'phone'      => $u->phone,
                'roles'      => $u->roles->pluck('name')->all(),
                'created_at' => $u->created_at?->toDateString(),
                'is_self'    => $u->id === $currentId,
            ])
            ->values();

        return Inertia::render('Admin/Accounts', [
            'accounts'     => $accounts,
            'roleOptions'  => self::ASSIGNABLE_ROLES,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|string|lowercase|email|max:255|unique:users,email',
            'username'   => 'nullable|string|max:255|alpha_dash|unique:users,username',
            'phone'      => 'nullable|string|max:50',
            'role'       => 'required|in:' . implode(',', self::ASSIGNABLE_ROLES),
            'password'   => 'required|string|min:8',
        ]);

        $user = User::create([
            'name'         => $validated['first_name'] . ' ' . $validated['last_name'],
            'first_name'   => $validated['first_name'],
            'last_name'    => $validated['last_name'],
            'username'     => $validated['username'] ?: $this->uniqueUsername($validated['email']),
            'email'        => $validated['email'],
            'password'     => Hash::make($validated['password']),
            'phone'        => $validated['phone'] ?? null,
            // New accounts join the creating admin's workspace.
            'workspace_id' => $request->user()->workspace_id,
        ]);

        $user->assignRole($validated['role']);

        return back()->with('success', "Account created for {$user->name}.");
    }

    /** Derive a unique username from the email's local part. */
    private function uniqueUsername(string $email): string
    {
        $base = Str::slug(Str::before($email, '@'), '') ?: 'user';
        $username = $base;
        $i = 1;

        while (User::where('username', $username)->exists()) {
            $username = $base . (++$i);
        }

        return $username;
    }
}
