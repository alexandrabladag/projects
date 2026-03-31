<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use BelongsToWorkspace;
    protected $fillable = [
        'name', 'email', 'phone',
        'address_line_1', 'address_line_2', 'city', 'state', 'postal_code', 'country',
        'tax_id', 'website', 'logo_path', 'base_currency',
        'invoice_prefix', 'invoice_format', 'proposal_prefix', 'proposal_format',
        'next_invoice_number', 'next_proposal_number', 'number_padding',
    ];

    public function generateNumber(string $type): string
    {
        $prefix = $type === 'invoice' ? ($this->invoice_prefix ?? 'INV') : ($this->proposal_prefix ?? 'PROP');
        $format = $type === 'invoice' ? ($this->invoice_format ?? '{PREFIX}-{YEAR}-{NUMBER}') : ($this->proposal_format ?? '{PREFIX}-{YEAR}-{NUMBER}');
        $next = $type === 'invoice' ? ($this->next_invoice_number ?? 1) : ($this->next_proposal_number ?? 1);
        $padding = $this->number_padding ?? 3;

        $number = str_replace(
            ['{PREFIX}', '{YEAR}', '{MONTH}', '{NUMBER}'],
            [$prefix, date('Y'), date('m'), str_pad($next, $padding, '0', STR_PAD_LEFT)],
            $format
        );

        return $number;
    }

    public function incrementNumber(string $type): void
    {
        if ($type === 'invoice') {
            $this->increment('next_invoice_number');
        } else {
            $this->increment('next_proposal_number');
        }
    }
}
