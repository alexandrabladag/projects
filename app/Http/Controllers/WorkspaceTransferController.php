<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Company;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WorkspaceTransferController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Transfer');
    }

    public function export(Request $request)
    {
        $strip = fn ($model) => collect($model->toArray())
            ->except(['id', 'workspace_id', 'created_at', 'updated_at'])
            ->toArray();

        $company = Company::first();

        $clients = Client::with('contacts')->get()->map(function ($client) use ($strip) {
            $data = $strip($client);
            $data['contacts'] = $client->contacts->map(fn ($c) => collect($c->toArray())
                ->except(['id', 'client_id', 'created_at', 'updated_at'])->toArray())->values()->toArray();
            return $data;
        })->values()->toArray();

        $projects = Project::with([
            'proposals', 'invoices.items', 'meetings', 'documents', 'tasks', 'members.client',
        ])->get()->map(function ($project) use ($strip) {
            $data = $strip($project);

            // Replace foreign keys with lookups
            $data['_client_name'] = $project->client;
            unset($data['client_id'], $data['manager_id'], $data['client_user_id']);

            $data['proposals'] = $project->proposals->map(fn ($p) => collect($p->toArray())
                ->except(['id', 'project_id', 'created_at', 'updated_at'])->toArray())->values()->toArray();

            $data['invoices'] = $project->invoices->map(function ($inv) {
                $invData = collect($inv->toArray())
                    ->except(['id', 'project_id', 'created_at', 'updated_at'])->toArray();
                $invData['items'] = collect($inv->items)->map(fn ($item) => collect($item->toArray())
                    ->except(['id', 'invoice_id', 'created_at', 'updated_at'])->toArray())->values()->toArray();
                return $invData;
            })->values()->toArray();

            $data['meetings'] = $project->meetings->map(fn ($m) => collect($m->toArray())
                ->except(['id', 'project_id', 'created_at', 'updated_at'])->toArray())->values()->toArray();

            $data['documents'] = $project->documents->map(fn ($d) => collect($d->toArray())
                ->except(['id', 'project_id', 'added_by', 'created_at', 'updated_at'])->toArray())->values()->toArray();

            $data['tasks'] = $project->tasks->map(fn ($t) => collect($t->toArray())
                ->except(['id', 'project_id', 'created_at', 'updated_at'])->toArray())->values()->toArray();

            $data['members'] = $project->members->map(fn ($m) => [
                'client_name' => $m->client?->name,
                'role' => $m->role,
                'notes' => $m->notes,
            ])->values()->toArray();

            return $data;
        })->values()->toArray();

        $export = [
            'version'     => 1,
            'exported_at' => now()->toISOString(),
            'company'     => $company ? $strip($company) : null,
            'clients'     => $clients,
            'projects'    => $projects,
        ];

        $filename = 'workspace-export-' . now()->format('Y-m-d-His') . '.json';

        return response()->streamDownload(function () use ($export) {
            echo json_encode($export, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }, $filename, ['Content-Type' => 'application/json']);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimetypes:application/json,text/plain|max:10240',
        ]);

        $data = json_decode($request->file('file')->get(), true);

        if (!$data || !isset($data['version'])) {
            return back()->with('error', 'Invalid export file format.');
        }

        $user = $request->user();
        $workspaceId = $user->workspace_id;
        $imported = ['clients' => 0, 'projects' => 0, 'proposals' => 0, 'invoices' => 0, 'meetings' => 0, 'tasks' => 0];

        DB::transaction(function () use ($data, $user, $workspaceId, &$imported) {
            // Company
            if (!empty($data['company'])) {
                $company = Company::first() ?? new Company();
                $company->fill(collect($data['company'])->except(['logo_path'])->toArray());
                $company->workspace_id = $workspaceId;
                $company->save();
            }

            // Clients
            $clientMap = []; // old name => new id
            foreach ($data['clients'] ?? [] as $clientData) {
                $contacts = $clientData['contacts'] ?? [];
                unset($clientData['contacts']);

                $client = Client::create(array_merge($clientData, ['workspace_id' => $workspaceId]));
                $clientMap[$client->name] = $client->id;
                $imported['clients']++;

                foreach ($contacts as $contact) {
                    $client->contacts()->create($contact);
                }
            }

            // Projects
            foreach ($data['projects'] ?? [] as $projData) {
                $proposals = $projData['proposals'] ?? [];
                $invoices  = $projData['invoices'] ?? [];
                $meetings  = $projData['meetings'] ?? [];
                $documents = $projData['documents'] ?? [];
                $tasks     = $projData['tasks'] ?? [];
                $members   = $projData['members'] ?? [];

                unset($projData['proposals'], $projData['invoices'], $projData['meetings'],
                    $projData['documents'], $projData['tasks'], $projData['members'], $projData['_client_name']);

                // Remap client
                $clientName = $data['projects'][array_search($projData, array_map(fn ($p) => collect($p)->except(['proposals', 'invoices', 'meetings', 'documents', 'tasks', 'members', '_client_name'])->toArray(), $data['projects']))]['_client_name'] ?? $projData['client'] ?? null;
                $projData['client_id'] = $clientMap[$clientName] ?? null;
                $projData['workspace_id'] = $workspaceId;
                $projData['manager_id'] = $user->id;

                $project = Project::create($projData);
                $imported['projects']++;

                foreach ($proposals as $prop) {
                    $project->proposals()->create($prop);
                    $imported['proposals']++;
                }

                foreach ($invoices as $invData) {
                    $items = $invData['items'] ?? [];
                    unset($invData['items']);
                    $invoice = $project->invoices()->create($invData);
                    foreach ($items as $item) {
                        $invoice->items()->create($item);
                    }
                    $imported['invoices']++;
                }

                foreach ($meetings as $meeting) {
                    $project->meetings()->create($meeting);
                    $imported['meetings']++;
                }

                foreach ($documents as $doc) {
                    $project->documents()->create(array_merge($doc, ['added_by' => $user->id]));
                }

                foreach ($tasks as $task) {
                    $project->tasks()->create($task);
                    $imported['tasks']++;
                }

                foreach ($members as $member) {
                    $clientId = $clientMap[$member['client_name']] ?? null;
                    if ($clientId) {
                        $project->members()->create([
                            'client_id' => $clientId,
                            'role' => $member['role'],
                            'notes' => $member['notes'],
                        ]);
                    }
                }
            }
        });

        $summary = collect($imported)->filter()->map(fn ($v, $k) => "{$v} {$k}")->values()->join(', ');

        return back()->with('success', "Import complete: {$summary}.");
    }
}
