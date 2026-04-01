<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Project;
use Inertia\Inertia;

class PublicPortalController extends Controller
{
    public function show(string $code)
    {
        $project = Project::where('portal_code', $code)
            ->where('portal_enabled', true)
            ->firstOrFail();

        $project->load(['proposals', 'invoices.items', 'meetings', 'tasks', 'clientRecord']);

        $projectData = array_merge($project->toArray(), [
            'total_billed' => $project->total_billed,
            'total_paid'   => $project->total_paid,
        ]);

        $projectData['invoices'] = $project->invoices->map(fn ($inv) => array_merge(
            $inv->toArray(),
            ['total' => $inv->total]
        ));

        $company = Company::first();

        return Inertia::render('Portal/Public', [
            'project' => $projectData,
            'company' => $company ? [
                'name'      => $company->name,
                'logo_path' => $company->logo_path,
                'email'     => $company->email,
                'phone'     => $company->phone,
                'website'   => $company->website,
            ] : null,
            'code'    => $code,
        ]);
    }
}
