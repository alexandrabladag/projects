<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeEntry extends Model
{
    use BelongsToWorkspace;

    protected $fillable = [
        'project_id', 'task_id', 'team_member_id', 'invoice_id',
        'date', 'hours', 'description', 'billable',
    ];

    protected $casts = [
        'date'     => 'date',
        'hours'    => 'decimal:2',
        'billable' => 'boolean',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function teamMember(): BelongsTo
    {
        return $this->belongsTo(TeamMember::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    // Billable hours not yet attached to an invoice.
    public function scopeUnbilled($query)
    {
        return $query->where('billable', true)->whereNull('invoice_id');
    }
}
