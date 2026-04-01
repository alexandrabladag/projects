<?php
// ─────────────────────────────────────────────────────────────────────────────
// Proposal Model
// ─────────────────────────────────────────────────────────────────────────────
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Proposal extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'title',
        'status',
        'amount',
        'currency',
        'date',
        'valid_until',
        'sent_date',
        'signed_date',
        'summary',
        'scope',
        'deliverables',
        'notes',
        'content',
        'sections',
        'exclusions',
        'timeline',
        'payment_schedule',
        'prepared_by',
        'prepared_by_title',
        'approved_by',
        'approved_by_title',
        'signed_file_path',
        'signed_file_name',
    ];

    protected $casts = [
        'date'             => 'date',
        'valid_until'      => 'date',
        'sent_date'        => 'date',
        'signed_date'      => 'date',
        'amount'           => 'decimal:2',
        'deliverables'     => 'array',
        'sections'         => 'array',
        'timeline'         => 'array',
        'payment_schedule' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
