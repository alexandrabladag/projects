<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TeamMember extends Model
{
    protected $fillable = ['name', 'email', 'phone', 'role', 'department', 'pay_type', 'rate', 'rate_currency', 'is_active'];

    protected $casts = ['is_active' => 'boolean', 'rate' => 'decimal:2'];

    public function payroll(): HasMany
    {
        return $this->hasMany(ProjectPayroll::class);
    }
}
