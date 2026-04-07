<?php

namespace Database\Factories;

use App\Models\ProjectPage;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectPageFactory extends Factory
{
    protected $model = ProjectPage::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'title' => fake()->sentence(3),
            'content' => fake()->paragraphs(2, true),
            'is_shared' => false,
            'created_by' => User::factory(),
        ];
    }
}
