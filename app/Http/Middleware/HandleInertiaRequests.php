<?php

namespace App\Http\Middleware;

use App\Models\Client;
use App\Models\Company;
use App\Models\Project;
use App\Support\AttentionFeed;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default — available on every page
     * via usePage().props in React.
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames()->toArray(),
                ] : null,
                'workspace' => $user?->workspace ? [
                    'id'   => $user->workspace->id,
                    'name' => $user->workspace->name,
                    'slug' => $user->workspace->slug,
                ] : null,
            ],

            // Laravel named routes available in React via route() helper (Ziggy)
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],

            // Team members for dropdowns
            'teamMembers' => fn () => $user
                ? \App\Models\TeamMember::where('is_active', true)->orderBy('name')->get(['id', 'name', 'role'])
                : [],

            // Base currency from company settings
            'baseCurrency' => fn () => $user
                ? (Company::first()?->base_currency ?? 'USD')
                : 'USD',

            // Clients list for dropdowns
            'clients' => fn () => $user
                ? Client::orderBy('name')->get(['id', 'name', 'type', 'contact_name', 'contact_email', 'contact_phone'])
                : [],

            // Cross-project "needs attention" feed for the topbar bell.
            // Managers/admins only — derived live from existing records.
            'attention' => fn () => $user && $user->canManageProjects()
                ? AttentionFeed::for($user)
                : null,

            // Flash messages from controllers
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
