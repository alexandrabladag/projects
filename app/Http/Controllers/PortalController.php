<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PortalController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        $projects = Project::where('client_user_id', $user->id)
            ->withCount(['proposals', 'invoices'])
            ->latest()
            ->get();

        return Inertia::render('Portal/Dashboard', [
            'projects' => $projects,
        ]);
    }

    public function project(Request $request, Project $project)
    {
        // Ensure client can only see their own projects
        if ($project->client_user_id !== $request->user()->id) {
            abort(403);
        }

        $project->load([
            'proposals',
            'invoices.items',
            'meetings',
            'documents.uploader',
        ]);

        $projectData = array_merge($project->toArray(), [
            'total_billed' => $project->total_billed,
            'total_paid'   => $project->total_paid,
        ]);

        $projectData['invoices'] = $project->invoices->map(fn ($inv) => array_merge(
            $inv->toArray(),
            ['total' => $inv->total]
        ));

        return Inertia::render('Portal/Project', [
            'project' => $projectData,
        ]);
    }
}
