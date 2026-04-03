<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectPayroll extends Model
{
    protected $table = 'project_payroll';

    protected $fillable = [
        'project_id', 'team_member_id', 'period', 'pay_type',
        'rate', 'hours', 'amount', 'currency', 'status', 'paid_date', 'notes',
    ];

    protected $casts = [
        'rate'      => 'decimal:2',
        'hours'     => 'decimal:2',
        'amount'    => 'decimal:2',
        'paid_date' => 'date',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function teamMember(): BelongsTo
    {
        return $this->belongsTo(TeamMember::class);
    }
}
