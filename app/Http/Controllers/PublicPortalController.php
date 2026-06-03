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

        // 'proposals' is still loaded because the public portal derives the deliverables list from it.
        $project->load(['proposals', 'meetings', 'tasks.documents', 'documents.uploader', 'clientRecord', 'lead']);

        $company = Company::first();

        return Inertia::render('Portal/Public', [
            'project' => $project->toArray(),
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
