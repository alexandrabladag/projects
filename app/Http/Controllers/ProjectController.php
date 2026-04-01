<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Company;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        $user     = $request->user();
        $projects = Project::forUser($user)
            ->with(['manager', 'invoices.items', 'tasks'])
            ->latest()
            ->get()
            ->map(fn ($p) => array_merge($p->toArray(), [
                'budget_percent' => $p->budget_percent,
                'total_billed'   => $p->total_billed,
            ]));

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Project::class);

        return Inertia::render('Projects/Create', [
            'clients' => Client::orderBy('name')->get(['id', 'name', 'type', 'contact_name', 'contact_email', 'contact_phone']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Project::class);

        // Convert comma-separated tags string to array
        if (is_string($request->tags)) {
            $request->merge([
                'tags' => array_values(array_filter(array_map('trim', explode(',', $request->tags)))),
            ]);
        }

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'client_id'     => 'nullable|exists:clients,id',
            'new_client_name' => 'required_without:client_id|nullable|string|max:255',
            'client'        => 'nullable|string|max:255',
            'contact_name'  => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'status'        => 'required|in:active,completed,on-hold',
            'start_date'    => 'nullable|date',
            'end_date'      => 'nullable|date|after_or_equal:start_date',
            'budget'        => 'nullable|numeric|min:0',
            'currency'      => 'nullable|string|max:10',
            'description'   => 'nullable|string',
            'tags'          => 'nullable|array',
            'tags.*'        => 'string|max:50',
            'phase'         => 'nullable|string|max:100',
        ]);

        // Handle inline client creation + project creation in a transaction
        [$project, $isNewClient] = DB::transaction(function () use ($validated, $request) {
            $clientId = $validated['client_id'] ?? null;
            $clientName = $validated['client'] ?? '';
            $isNewClient = false;

            if (!$clientId && !empty($validated['new_client_name'])) {
                $newClient = Client::create([
                    'name'          => $validated['new_client_name'],
                    'contact_name'  => $validated['contact_name'] ?? null,
                    'contact_email' => $validated['contact_email'] ?? null,
                    'contact_phone' => $validated['contact_phone'] ?? null,
                    'type'          => 'client',
                ]);
                $clientId = $newClient->id;
                $clientName = $newClient->name;
                $isNewClient = true;
            } elseif ($clientId && !$clientName) {
                $clientName = Client::find($clientId)?->name ?? '';
            }

            unset($validated['client_id'], $validated['new_client_name']);

            $validated['budget'] = $validated['budget'] ?? 0;

            $project = Project::create(array_merge($validated, [
                'client'     => $clientName,
                'client_id'  => $clientId,
                'manager_id' => $request->user()->id,
                'progress'   => 0,
                'spent'      => 0,
            ]));

            return [$project, $isNewClient];
        });

        $message = 'Project created successfully.';
        if ($isNewClient) {
            $message .= ' A new client record was created — please complete their details in Clients & Vendors.';
        }

        return redirect()->route('projects.show', $project)
            ->with('success', $message);
    }

    public function show(Request $request, Project $project): Response
    {
        $this->authorize('view', $project);

        $project->load([
            'manager',
            'clientUser:id,name,email',
            'proposals',
            'invoices.items',
            'meetings',
            'documents.uploader',
            'tasks',
            'bills.vendor',
            'members.client',
            'pages.creator',
        ]);

        // Append computed attributes
        $projectData = array_merge($project->toArray(), [
            'budget_percent'     => $project->budget_percent,
            'total_billed'       => $project->total_billed,
            'total_paid'         => $project->total_paid,
            'budget_remaining'   => $project->budget_remaining,
            'total_bills'        => $project->total_bills,
            'total_bills_paid'   => $project->total_bills_paid,
        ]);

        // Append invoice totals
        $projectData['invoices'] = $project->invoices->map(fn ($inv) => array_merge(
            $inv->toArray(),
            ['total' => $inv->total]
        ));

        $company = Company::first();

        return Inertia::render('Projects/Show', [
            'project'            => $projectData,
            'canManage'          => $request->user()->canManageProjects(),
            'nextInvoiceNumber'  => $company?->generateNumber('invoice') ?? 'INV-' . date('Y') . '-001',
            'nextProposalNumber' => $company?->generateNumber('proposal') ?? 'PROP-' . date('Y') . '-001',
        ]);
    }

    public function edit(Project $project): Response
    {
        $this->authorize('update', $project);

        return Inertia::render('Projects/Edit', [
            'project' => $project,
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        if (is_string($request->tags)) {
            $request->merge([
                'tags' => array_values(array_filter(array_map('trim', explode(',', $request->tags)))),
            ]);
        }

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'client'        => 'required|string|max:255',
            'contact_name'  => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'status'        => 'required|in:active,completed,on-hold',
            'start_date'    => 'nullable|date',
            'end_date'      => 'nullable|date|after_or_equal:start_date',
            'budget'        => 'nullable|numeric|min:0',
            'currency'      => 'nullable|string|max:10',
            'spent'         => 'nullable|numeric|min:0',
            'description'   => 'nullable|string',
            'tags'          => 'nullable|array',
            'phase'         => 'nullable|string|max:100',
        ]);

        $project->update($validated);

        return back()->with('success', 'Project updated.');
    }

    public function destroy(Project $project)
    {
        $this->authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects.index')
            ->with('success', 'Project deleted.');
    }

    public function togglePortal(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        if ($project->portal_enabled) {
            $project->update(['portal_enabled' => false, 'portal_code' => null]);
            return back()->with('success', 'Client portal disabled.');
        }

        $code = Str::random(20);
        $project->update(['portal_enabled' => true, 'portal_code' => $code]);
        return back()->with('success', 'Client portal enabled.');
    }

    public function updateProgress(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $request->validate([
            'progress' => 'required|integer|min:0|max:100',
            'phase'    => 'nullable|string|max:100',
        ]);

        $project->update([
            'progress' => $request->progress,
            'phase'    => $request->phase ?? $project->phase,
        ]);

        return back()->with('success', 'Progress updated.');
    }
}
