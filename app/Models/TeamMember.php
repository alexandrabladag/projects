<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeamMember extends Model
{
    protected $fillable = ['name', 'email', 'phone', 'role', 'department', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];
}
