<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'name' => fake()->sentence(3),
            'type' => fake()->randomElement(['contract', 'brief', 'report', 'asset', 'other']),
            'file_path' => null,
            'file_size' => null,
            'added_by' => User::factory(),
        ];
    }
}
