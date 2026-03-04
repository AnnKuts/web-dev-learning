<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::factory()->create([
            'username' => 'admin',
            'email'    => 'admin@example.com',
            'user_bio' => 'Administrator of the blog.',
        ]);

        $testUser = User::factory()->create([
            'username' => 'testuser',
            'email'    => 'test@example.com',
            'user_bio' => 'Test user for development purposes.',
        ]);

        $regularUsers = User::factory(8)->create();

        $tagNames = [
            'Laravel', 'PHP', 'JavaScript', 'Vue.js', 'React',
            'Web Development', 'Backend', 'Frontend', 'API',
            'Database', 'Tutorial', 'Tips', 'Best Practices',
            'Performance', 'Security',
        ];

        $tags = collect($tagNames)->map(fn ($name) => Tag::create([
            'tag_name' => $name,
            'tag_slug' => Str::slug($name),
        ]));

        $tags = $tags->concat(Tag::factory(5)->create());

        $createPost = function (User $user, string $header = null, string $description = null) use ($tags): Post {
            $post = Post::create([
                'user_id'     => $user->id,
                'header'      => $header ?? fake()->sentence(rand(4, 8)),
                'description' => $description ?? fake()->paragraphs(rand(2, 5), true),
            ]);

            $post->tags()->attach($tags->random(rand(1, 4))->pluck('id'));

            return $post;
        };

        $createPost($admin, 'Getting Started with Laravel: A Complete Guide');
        $createPost($admin, 'React vs Vue.js: Which Frontend Framework Should You Choose?');
        $createPost($testUser, 'Building RESTful APIs with Laravel: Best Practices');

        foreach (range(1, 3) as $_) {
            $createPost($admin);
        }
        foreach (range(1, 2) as $_) {
            $createPost($testUser);
        }

        foreach ($regularUsers as $user) {
            foreach (range(1, rand(2, 4)) as $_) {
                $createPost($user);
            }
        }

        $this->command->info('Seeding completed!');
        $this->command->info(sprintf(
            'Created: %d users, %d tags, %d posts',
            User::count(), Tag::count(), Post::count()
        ));
    }
}
