<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TeamMember extends Model
{
    protected $fillable = ['user_id', 'name', 'email', 'phone', 'role', 'department', 'pay_type', 'rate', 'rate_currency', 'is_active'];

    protected $casts = ['is_active' => 'boolean', 'rate' => 'decimal:2'];

    public function payroll(): HasMany
    {
        return $this->hasMany(ProjectPayroll::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assignee_id');
    }
}
