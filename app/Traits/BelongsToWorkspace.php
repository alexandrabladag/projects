<?php

namespace App\Traits;

use App\Models\Workspace;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToWorkspace
{
    public static function bootBelongsToWorkspace(): void
    {
        // Auto-scope queries to current workspace
        static::addGlobalScope('workspace', function (Builder $query) {
            if ($workspace = static::currentWorkspace()) {
                $query->where($query->getModel()->getTable() . '.workspace_id', $workspace->id);
            }
        });

        // Auto-assign workspace_id on create
        static::creating(function ($model) {
            if (!$model->workspace_id && $workspace = static::currentWorkspace()) {
                $model->workspace_id = $workspace->id;
            }
        });
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    protected static function currentWorkspace(): ?Workspace
    {
        $user = auth()->user();
        if (!$user || !$user->workspace_id) {
            return null;
        }

        return $user->workspace;
    }
}
