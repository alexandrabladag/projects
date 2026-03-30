<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /**
     * Admins bypass all policy checks.
     */
    public function before(User $user): ?bool
    {
        if ($user->isAdmin()) return true;
        return null;
    }

    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can list projects (filtered by scope)
    }

    public function view(User $user, Project $project): bool
    {
        // Managers see all projects; clients see only their assigned project
        if ($user->isManager()) return true;
        return $project->client_user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->canManageProjects();
    }

    public function update(User $user, Project $project): bool
    {
        return $user->canManageProjects();
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->isAdmin() || $project->manager_id === $user->id;
    }
}
