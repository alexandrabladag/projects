<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'description',
        'quantity',
        'rate',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'rate'     => 'decimal:2',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function getAmountAttribute(): float
    {
        return $this->quantity * $this->rate;
    }
}
