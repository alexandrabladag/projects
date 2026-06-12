<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageCommenterToken extends Model
{
    protected $fillable = ['page_commenter_id', 'token'];

    // The stored value is a SHA-256 hash; the raw token never leaves the issuing response.
    protected $hidden = ['token'];

    public function commenter(): BelongsTo
    {
        return $this->belongsTo(PageCommenter::class, 'page_commenter_id');
    }
}
