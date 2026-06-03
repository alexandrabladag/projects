<?php

namespace App\Traits;

use App\Models\Activity;

trait RecordsActivity
{
    public static function bootRecordsActivity(): void
    {
        foreach (['created', 'updated', 'deleted'] as $event) {
            static::$event(function ($model) use ($event) {
                $model->recordActivity($event);
            });
        }
    }

    /**
     * Attributes that, when they are the *only* thing that changed, should not
     * produce an activity entry (housekeeping / derived fields).
     */
    protected function activityIgnored(): array
    {
        return ['updated_at', 'created_at', 'position', 'progress', 'spent'];
    }

    protected function recordActivity(string $event): void
    {
        $properties = null;

        if ($event === 'updated') {
            $changes = collect($this->getChanges())
                ->except($this->activityIgnored())
                ->keys()
                ->all();

            if (empty($changes)) {
                return; // nothing meaningful changed
            }
            $properties = ['changed' => $changes];
        }

        $user = auth()->user();

        Activity::create([
            'project_id'   => $this->activityProjectId(),
            'user_id'      => $user?->id,
            'causer_name'  => $user?->name,
            'subject_type' => $this->getMorphClass(),
            'subject_id'   => $this->getKey(),
            'event'        => $event,
            'description'  => ucfirst($event) . ' ' . $this->activityLabel(),
            'properties'   => $properties,
        ]);
    }

    protected function activityProjectId(): ?int
    {
        if ($this instanceof \App\Models\Project) {
            return $this->getKey();
        }

        return $this->project_id ?? null;
    }

    /**
     * Human label for the subject, e.g. `task "Design homepage"`.
     * Models may override for nicer wording.
     */
    protected function activityLabel(): string
    {
        $type = strtolower(class_basename($this));
        $name = $this->name ?? $this->title ?? ('#' . $this->getKey());

        return "{$type} \"{$name}\"";
    }
}
