<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'type',         // contract | brief | report | asset | other
        'file_path',
        'file_size',
        'added_by',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    public function getDownloadUrlAttribute(): string
    {
        return route('documents.download', $this->id);
    }
}
