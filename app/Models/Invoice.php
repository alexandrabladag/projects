<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'number',
        'status',       // draft | sent | paid | overdue
        'date',
        'due_date',
        'description',
    ];

    protected $casts = [
        'date'     => 'date',
        'due_date' => 'date',
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
