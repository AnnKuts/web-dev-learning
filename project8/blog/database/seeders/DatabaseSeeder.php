<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use App\Services\PostService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create users first
        $adminUser = User::factory()->create([
            'username' => 'admin',
            'email' => 'admin@example.com',
            'user_bio' => 'Administrator of the blog. Passionate about web development and sharing knowledge.',
        ]);

        $testUser = User::factory()->create([
            'username' => 'testuser',
            'email' => 'test@example.com',
            'user_bio' => 'Test user for development purposes.',
        ]);

        $regularUsers = User::factory(8)->create();
        $allUsers = collect([$adminUser, $testUser])->concat($regularUsers);

        // Create tags
        $predefinedTags = [
            'Laravel', 'PHP', 'JavaScript', 'Vue.js', 'React',
            'Web Development', 'Backend', 'Frontend', 'API',
            'Database', 'Tutorial', 'Tips', 'Best Practices',
            'Performance', 'Security'
        ];

        $tags = collect();
        foreach ($predefinedTags as $tagName) {
            $tags->push(Tag::factory()->create(['tag_name' => $tagName]));
        }
        $tags = $tags->concat(Tag::factory(10)->create());

        // Use PostService directly instead of controller
        $postService = app(PostService::class);

        // Create posts for admin (5 posts)
        for ($i = 0; $i < 5; $i++) {
            $postData = [
                'user_id' => $adminUser->id,
                'header' => fake()->sentence(rand(3, 8)),
                'description' => fake()->paragraphs(rand(3, 6), true)
            ];

            $post = Post::create($postData);
            $post->tags()->attach($tags->random(rand(1, 5))->pluck('id'));
        }

        // Create posts for test user (3 posts)
        for ($i = 0; $i < 3; $i++) {
            $postData = [
                'user_id' => $testUser->id,
                'header' => fake()->sentence(rand(3, 8)),
                'description' => fake()->paragraphs(rand(3, 6), true)
            ];

            $post = Post::create($postData);
            $post->tags()->attach($tags->random(rand(1, 5))->pluck('id'));
        }

        // Create posts for regular users
        foreach ($regularUsers as $user) {
            $postCount = rand(2, 4);
            for ($i = 0; $i < $postCount; $i++) {
                $postData = [
                    'user_id' => $user->id,
                    'header' => fake()->sentence(rand(3, 8)),
                    'description' => fake()->paragraphs(rand(3, 6), true)
                ];

                $post = Post::create($postData);
                $post->tags()->attach($tags->random(rand(1, 5))->pluck('id'));
            }
        }

        // Create demo posts with specific content
        $demoPosts = [
            [
                'user_id' => $adminUser->id,
                'header' => 'Getting Started with Laravel 11: A Complete Guide',
                'description' => 'Laravel 11 brings exciting new features and improvements...',
            ],
            [
                'user_id' => $testUser->id,
                'header' => 'Building RESTful APIs with Laravel: Best Practices',
                'description' => 'Creating robust and scalable APIs is crucial for modern web development...',
            ],
            [
                'user_id' => $adminUser->id,
                'header' => 'React vs Vue.js: Which Frontend Framework Should You Choose?',
                'description' => 'The frontend development landscape offers many choices...',
            ]
        ];

        foreach ($demoPosts as $demoPostData) {
            $post = Post::create($demoPostData);
            $post->tags()->attach($tags->random(rand(2, 4))->pluck('id'));
        }

        $this->command->info('Database seeding completed successfully!');
        $this->command->info('Created: ' . User::count() . ' users, ' . Tag::count() . ' tags, ' . Post::count() . ' posts');
    }
}
