<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use BelongsToWorkspace;
    protected $fillable = [
        'type', 'name', 'email', 'phone',
        'address_line_1', 'address_line_2', 'city', 'state', 'postal_code', 'country',
        'tax_id', 'website',
        'contact_name', 'contact_email', 'contact_phone',
        'notes',
    ];

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class);
    }
}
