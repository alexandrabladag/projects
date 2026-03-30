<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'client',
        'contact_name',
        'contact_email',
        'contact_phone',
        'status',           // active | completed | on-hold
        'start_date',
        'end_date',
        'budget',
        'spent',
        'progress',         // 0-100
        'phase',
        'description',
        'tags',             // JSON array
        'manager_id',
        'client_user_id',
    ];

    protected $casts = [
        'start_date'  => 'date',
        'end_date'    => 'date',
        'budget'      => 'decimal:2',
        'spent'       => 'decimal:2',
        'progress'    => 'integer',
        'tags'        => 'array',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function clientUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_user_id');
    }

    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->orderBy('date', 'desc');
    }

    public function meetings(): HasMany
    {
        return $this->hasMany(Meeting::class)->orderBy('date', 'desc');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class)->latest();
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForUser($query, User $user)
    {
        if ($user->isClient()) {
            return $query->where('client_user_id', $user->id);
        }
        return $query;
    }

    // ── Computed ──────────────────────────────────────────────────────────────

    public function getBudgetRemainingAttribute(): float
    {
        return $this->budget - $this->spent;
    }

    public function getBudgetPercentAttribute(): int
    {
        if ($this->budget <= 0) return 0;
        return min(100, (int) round(($this->spent / $this->budget) * 100));
    }

    public function getTotalBilledAttribute(): float
    {
        return $this->invoices->sum(fn ($inv) => $inv->total);
    }

    public function getTotalPaidAttribute(): float
    {
        return $this->invoices
            ->where('status', 'paid')
            ->sum(fn ($inv) => $inv->total);
    }
}
