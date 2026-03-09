<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;


class TagFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tagName = fake()->unique()->word();

        return [
            'tag_name' => ucfirst($tagName),
            'tag_slug' => Str::slug($tagName),
        ];
    }
}
