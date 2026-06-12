<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
    )
    ->withSchedule(function (Schedule $schedule) {
        $schedule->command('invoices:mark-overdue')->dailyAt('00:30');
    })
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\ResolveWorkspace::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role'       => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
        ]);

        // Public client-feedback endpoint on shared mockups — the raw mockup HTML carries
        // no CSRF token, so exempt it (the unguessable share code is the only credential).
        $middleware->validateCsrfTokens(except: ['page/*/feedback', 'page/*/feedback/*', 'page/*/auth/*']);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
