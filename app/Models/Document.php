<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'task_id',
        'page_id',
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

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function page()
    {
        return $this->belongsTo(ProjectPage::class, 'page_id');
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
