<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageFeedback extends Model
{
    use HasFactory;

    protected $table = 'page_feedback';

    protected $fillable = ['project_page_id', 'page_commenter_id', 'parent_id', 'author_name', 'is_admin', 'edit_token', 'title', 'body', 'page_path', 'resolved_at'];

    protected $casts = ['resolved_at' => 'datetime', 'is_admin' => 'boolean'];

    // The edit token (a hash of the author's browser secret) must never leak in responses.
    protected $hidden = ['edit_token'];

    public function page(): BelongsTo
    {
        return $this->belongsTo(ProjectPage::class, 'project_page_id');
    }

    public function commenter(): BelongsTo
    {
        return $this->belongsTo(PageCommenter::class, 'page_commenter_id');
    }
}
