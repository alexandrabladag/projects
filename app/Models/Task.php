<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'assignee',
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

    public function scopePending($query)
    {
        return $query->whereNotIn('status', ['completed']);
    }
}
