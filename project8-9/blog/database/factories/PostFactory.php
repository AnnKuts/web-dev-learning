<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'header' => fake()->sentence(rand(3, 8)),
            'description' => fake()->paragraphs(rand(3, 6), true),
            'user_id' => User::factory(),
        ];
    }
}
