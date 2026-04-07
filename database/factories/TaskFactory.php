<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'title' => fake()->sentence(4),
            'assignee' => fake()->name(),
            'due_date' => now()->addWeeks(2),
            'priority' => 'medium',
            'status' => 'not-started',
            'category' => 'Deliverable',
        ];
    }
}
