<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bill extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id', 'client_id', 'number', 'status',
        'amount', 'currency', 'date', 'due_date', 'description', 'category',
        'paid_amount', 'paid_currency', 'paid_date', 'notes',
        'file_path', 'file_name',
    ];

    protected $casts = [
        'date'        => 'date',
        'due_date'    => 'date',
        'paid_date'   => 'date',
        'amount'      => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }
}
