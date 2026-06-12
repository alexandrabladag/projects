<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PageCommenter extends Model
{
    use HasFactory;

    protected $fillable = ['project_id', 'name', 'email', 'password'];

    protected $hidden = ['password'];

    protected $casts = ['password' => 'hashed'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function tokens(): HasMany
    {
        return $this->hasMany(PageCommenterToken::class);
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(PageFeedback::class);
    }
}
