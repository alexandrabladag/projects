<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'username',
        'email',
        'password',
        'phone',
        'company',
        'job_title',
        'workspace_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────────────

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function ownedWorkspace()
    {
        return $this->hasOne(Workspace::class, 'owner_id');
    }

    /**
     * Projects where this user is the client contact.
     */
    public function clientProjects()
    {
        return $this->hasMany(Project::class, 'client_user_id');
    }

    /**
     * Projects created/managed by this user.
     */
    public function managedProjects()
    {
        return $this->hasMany(Project::class, 'manager_id');
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isManager(): bool
    {
        return $this->hasRole('manager');
    }

    public function isClient(): bool
    {
        return $this->hasRole('client');
    }

    public function canManageProjects(): bool
    {
        return $this->hasAnyRole(['admin', 'manager']);
    }
}
