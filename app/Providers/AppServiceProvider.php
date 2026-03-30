<?php

namespace App\Providers;

use App\Models\Project;
use App\Policies\ProjectPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings.
     */
    protected $policies = [
        Project::class => ProjectPolicy::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Implicit role-based gate for admin
        Gate::before(function ($user, $ability) {
            if ($user->hasRole('admin')) {
                return true;
            }
        });
    }
}
