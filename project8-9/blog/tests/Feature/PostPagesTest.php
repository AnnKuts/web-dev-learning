<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_post_page_can_be_opened_directly_and_loads_content_through_api(): void
    {
        $this->get('/posts/7')->assertOk()
            ->assertViewIs('posts.show')
            ->assertViewHas('postId', '7')
            ->assertSee('data-post-id="7"', false)
            ->assertSee('До всіх статей');

        $this->get('/posts/invalid')->assertNotFound();
    }

    public function test_post_detail_api_returns_the_requested_article_with_author_and_tags(): void
    {
        config(['auth.dev_bypass' => false]);
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $post = Post::create([
            'user_id' => $user->id,
            'header' => 'Article header',
            'description' => 'The complete article description with more than twenty characters.',
        ]);
        $tag = Tag::factory()->create();
        $post->tags()->attach($tag);

        $this->getJson("/api/posts/{$post->id}")->assertOk()
            ->assertJsonPath('data.id', $post->id)
            ->assertJsonPath('data.header', $post->header)
            ->assertJsonPath('data.description', $post->description)
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.tags.0.id', $tag->id);

        $this->getJson('/api/posts/999999')->assertNotFound();
    }

    public function test_post_detail_api_requires_authentication(): void
    {
        config(['auth.dev_bypass' => false]);

        $post = Post::create([
            'user_id' => User::factory()->create()->id,
            'header' => 'Article header',
            'description' => 'A complete description with at least twenty characters.',
        ]);

        $this->getJson("/api/posts/{$post->id}")->assertUnauthorized();
        $this->getJson('/api/posts/999999')->assertUnauthorized();
    }
}
