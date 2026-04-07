<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3),
            'client' => fake()->company(),
            'status' => 'active',
            'start_date' => now()->subMonth(),
            'end_date' => now()->addMonths(3),
            'budget' => fake()->numberBetween(10000, 100000),
            'spent' => 0,
            'progress' => 0,
            'phase' => 'Discovery',
            'manager_id' => User::factory(),
        ];
    }
}
