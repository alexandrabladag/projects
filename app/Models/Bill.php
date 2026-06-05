<?php

namespace App\Models;

use App\Traits\RecordsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bill extends Model
{
    use SoftDeletes, RecordsActivity;

    protected $fillable = [
        'project_id', 'client_id', 'number', 'status',
        'amount', 'currency', 'exchange_rate', 'date', 'due_date', 'description', 'category',
        'paid_amount', 'paid_currency', 'paid_date', 'notes',
        'file_path', 'file_name',
    ];

    protected $casts = [
        'date'          => 'date',
        'due_date'      => 'date',
        'paid_date'     => 'date',
        'amount'        => 'decimal:2',
        'paid_amount'   => 'decimal:2',
        'exchange_rate' => 'decimal:6',
    ];

    /** Amount converted into the project's currency. */
    public function getConvertedAmountAttribute(): float
    {
        return (float) $this->amount * (float) ($this->exchange_rate ?? 1);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    protected function activityLabel(): string
    {
        return 'bill ' . ($this->number ?: $this->description ?: ('#' . $this->getKey()));
    }
}
