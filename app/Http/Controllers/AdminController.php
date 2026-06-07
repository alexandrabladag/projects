<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Landing page for the admin-only panel. Groups account management and other
 * admin tools behind the `role:admin` middleware (see routes/web.php).
 */
class AdminController extends Controller
{
    public function index(Request $request)
    {
        $workspaceId = $request->user()?->workspace_id;

        $scoped = fn () => User::when($workspaceId, fn ($q) => $q->where('workspace_id', $workspaceId));

        $countByRole = fn (string $role) => $scoped()
            ->whereHas('roles', fn ($q) => $q->where('name', $role))
            ->count();

        $recent = $scoped()
            ->with('roles:id,name')
            ->latest()
            ->take(5)
            ->get(['id', 'name', 'email', 'created_at'])
            ->map(fn ($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'roles'      => $u->roles->pluck('name')->all(),
                'created_at' => $u->created_at?->diffForHumans(),
            ])
            ->values();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total'    => $scoped()->count(),
                'admins'   => $countByRole('admin'),
                'managers' => $countByRole('manager'),
                'clients'  => $countByRole('client'),
            ],
            'recent' => $recent,
        ]);
    }
}
