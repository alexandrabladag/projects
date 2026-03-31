<?php

namespace App\Http\Middleware;

use App\Models\Workspace;
use Closure;
use Illuminate\Http\Request;

class ResolveWorkspace
{
    public function handle(Request $request, Closure $next)
    {
        $host = $request->getHost();
        $appDomain = parse_url(config('app.url'), PHP_URL_HOST);

        // Check for subdomain
        if ($appDomain && str_ends_with($host, '.' . $appDomain)) {
            $slug = str_replace('.' . $appDomain, '', $host);

            if ($slug && $slug !== 'www') {
                $workspace = Workspace::where('slug', $slug)->first();

                if (!$workspace) {
                    abort(404, 'Workspace not found.');
                }

                // Store workspace in request for use elsewhere
                $request->attributes->set('workspace', $workspace);
            }
        }

        return $next($request);
    }
}
