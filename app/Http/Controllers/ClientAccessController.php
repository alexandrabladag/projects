<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ClientAccessController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|max:255',
        ]);

        // Check if user already exists
        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            // Create new client user
            $tempPassword = Str::random(10);

            $user = User::create([
                'name'     => $validated['name'],
                'email'    => $validated['email'],
                'username' => Str::slug($validated['name']) . '-' . rand(100, 999),
                'password' => Hash::make($tempPassword),
            ]);

            // Create workspace for client
            $workspace = Workspace::create([
                'name'     => $validated['name'],
                'slug'     => Workspace::generateUniqueSlug($validated['name']),
                'owner_id' => $user->id,
            ]);
            $user->update(['workspace_id' => $workspace->id]);
            $user->assignRole('client');

            $message = "Client account created for {$validated['email']}. Temporary password: {$tempPassword}";
        } else {
            if (!$user->isClient()) {
                return back()->withErrors(['email' => 'This user exists but is not a client account.']);
            }
            $message = "Existing client {$user->name} linked to this project.";
        }

        // Link to project
        $project->update(['client_user_id' => $user->id]);

        return back()->with('success', $message);
    }

    public function destroy(Project $project)
    {
        $this->authorize('update', $project);

        $project->update(['client_user_id' => null]);

        return back()->with('success', 'Client access removed from this project.');
    }
}
