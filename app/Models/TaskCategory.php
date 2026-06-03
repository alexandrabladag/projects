<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskCategory extends Model
{
    use HasFactory, BelongsToWorkspace;

    protected $fillable = [
        'name',
        'color',
        'position',
    ];

    protected $casts = [
        'position' => 'integer',
    ];
}
