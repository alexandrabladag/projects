<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, BelongsToWorkspace, SoftDeletes;

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
        'currency',
        'tax_type',
        'tax_rate',
        'spent',
        'progress',         // 0-100
        'phase',
        'description',
        'tags',             // JSON array
        'client_id',
        'portal_code',
        'portal_enabled',
        'launch_date',
        'manager_id',
        'lead_id',
        'client_user_id',
    ];

    protected $casts = [
        'start_date'  => 'date',
        'end_date'    => 'date',
        'launch_date' => 'date',
        'budget'      => 'decimal:2',
        'tax_rate'    => 'decimal:2',
        'spent'       => 'decimal:2',
        'progress'    => 'integer',
        'tags'        => 'array',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function clientRecord(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(TeamMember::class, 'lead_id');
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

    public function members(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class)->orderBy('date', 'desc');
    }

    public function payroll(): HasMany
    {
        return $this->hasMany(ProjectPayroll::class)->orderBy('created_at', 'desc');
    }

    public function getTotalPayrollAttribute(): float
    {
        return $this->payroll->sum('amount');
    }

    public function getTotalPayrollPaidAttribute(): float
    {
        return $this->payroll->where('status', 'paid')->sum('amount');
    }

    public function pages(): HasMany
    {
        return $this->hasMany(ProjectPage::class);
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
        if ($user->isAdmin()) {
            return $query;
        }
        if ($user->isClient()) {
            return $query->where('client_user_id', $user->id);
        }
        // Managers only see projects they manage
        return $query->where('manager_id', $user->id);
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

    public function getTotalBillsAttribute(): float
    {
        return $this->bills->sum('amount');
    }

    public function getTotalBillsPaidAttribute(): float
    {
        return $this->bills->where('status', 'paid')->sum('amount');
    }
}
