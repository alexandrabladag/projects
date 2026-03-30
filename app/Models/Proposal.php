<?php
// ─────────────────────────────────────────────────────────────────────────────
// Proposal Model
// ─────────────────────────────────────────────────────────────────────────────
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proposal extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'status',           // draft | sent | approved | rejected
        'amount',
        'date',
        'valid_until',
        'summary',
        'scope',
        'deliverables',     // JSON array
        'notes',
    ];

    protected $casts = [
        'date'        => 'date',
        'valid_until' => 'date',
        'amount'      => 'decimal:2',
        'deliverables' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
