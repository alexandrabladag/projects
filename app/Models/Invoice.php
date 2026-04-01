<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'number',
        'status',       // draft | sent | paid | overdue
        'date',
        'due_date',
        'description',
        'currency',
        'received_currency',
        'exchange_rate',
        'received_amount',
        'received_date',
        'received_notes',
        'payment_stage',
        'payment_notes',
        'signed_file_path',
        'signed_file_name',
    ];

    protected $casts = [
        'date'            => 'date',
        'due_date'        => 'date',
        'received_date'   => 'date',
        'exchange_rate'   => 'decimal:6',
        'received_amount' => 'decimal:2',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function getTotalAttribute(): float
    {
        return $this->items->sum(fn ($item) => $item->quantity * $item->rate);
    }
}
