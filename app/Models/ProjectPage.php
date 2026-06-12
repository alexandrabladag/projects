<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectPage extends Model
{
    use HasFactory;
    protected $fillable = ['project_id', 'title', 'content', 'mockup_path', 'entry_file', 'share_code', 'is_shared', 'password', 'created_by'];

    protected $casts = ['is_shared' => 'boolean'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'page_id');
    }

    public function feedback()
    {
        return $this->hasMany(PageFeedback::class)->latest();
    }
}
