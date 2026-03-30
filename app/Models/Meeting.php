<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'type',         // kickoff | review | checkin | presentation | discovery | other
        'title',
        'date',
        'time',
        'duration',
        'location',
        'status',       // scheduled | completed | cancelled
        'attendees',    // JSON array of names
        'notes',
    ];

    protected $casts = [
        'date'      => 'date',
        'attendees' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('status', 'scheduled')
                     ->where('date', '>=', now()->toDateString())
                     ->orderBy('date');
    }
}
