<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Inertia\Inertia;

class PublicPortalController extends Controller
{
    public function show(string $code)
    {
        $project = Project::where('portal_code', $code)
            ->where('portal_enabled', true)
            ->firstOrFail();

        $project->load(['proposals', 'invoices.items', 'meetings']);

        $projectData = array_merge($project->toArray(), [
            'total_billed' => $project->total_billed,
            'total_paid'   => $project->total_paid,
        ]);

        $projectData['invoices'] = $project->invoices->map(fn ($inv) => array_merge(
            $inv->toArray(),
            ['total' => $inv->total]
        ));

        return Inertia::render('Portal/Public', [
            'project' => $projectData,
            'code'    => $code,
        ]);
    }
}
