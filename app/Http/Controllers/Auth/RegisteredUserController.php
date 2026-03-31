<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'username'   => 'required|string|max:255|unique:users,username',
            'email'      => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password'   => ['required', 'confirmed', Rules\Password::defaults()],
            'phone'      => 'nullable|string|max:50',
            'company'    => 'nullable|string|max:255',
            'job_title'  => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name'       => $request->first_name . ' ' . $request->last_name,
            'first_name' => $request->first_name,
            'last_name'  => $request->last_name,
            'username'   => $request->username,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'phone'      => $request->phone,
            'company'    => $request->company,
            'job_title'  => $request->job_title,
        ]);

        // Create workspace from company name or username
        $workspaceName = $request->company ?: $request->username;
        $workspace = Workspace::create([
            'name'     => $workspaceName,
            'slug'     => Workspace::generateUniqueSlug($workspaceName),
            'owner_id' => $user->id,
        ]);

        $user->update(['workspace_id' => $workspace->id]);

        // New users get 'manager' role by default — admins can change it
        $user->assignRole('manager');

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
