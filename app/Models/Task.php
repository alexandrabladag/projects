<?php

namespace App\Models;

use App\Traits\RecordsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use HasFactory, RecordsActivity;

    protected $fillable = [
        'project_id',
        'title',
        'assignee',
        'assignee_id',
        'due_date',
        'priority',     // high | medium | low
        'status',       // not-started | in-progress | review | completed
        'category',
        'position',
    ];

    protected $casts = [
        'due_date' => 'date',
        'position' => 'integer',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function assignedMember(): BelongsTo
    {
        return $this->belongsTo(TeamMember::class, 'assignee_id');
    }

    public function scopePending($query)
    {
        return $query->whereNotIn('status', ['completed']);
    }
}
