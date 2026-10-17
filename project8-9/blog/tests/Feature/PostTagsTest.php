<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostTagsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['auth.dev_bypass' => false]);
        Sanctum::actingAs(User::factory()->create());
    }

    public function test_empty_tags_detach_all_tags(): void
    {
        $post = $this->createTaggedPost();

        $this->putJson("/api/posts/{$post->id}", ['tags' => []])
            ->assertOk()
            ->assertJsonCount(0, 'data.tags');

        $this->assertCount(0, $post->fresh()->tags);
    }

    public function test_omitted_tags_preserve_existing_tags(): void
    {
        $post = $this->createTaggedPost();
        $tagIds = $post->tags->modelKeys();

        $this->putJson("/api/posts/{$post->id}", ['header' => 'Updated header'])
            ->assertOk()
            ->assertJsonPath('data.header', 'Updated header');

        $this->assertEquals($tagIds, $post->fresh()->tags->modelKeys());
    }

    public function test_supplied_tags_replace_existing_tags(): void
    {
        $post = $this->createTaggedPost();
        $tag = Tag::factory()->create();

        $this->putJson("/api/posts/{$post->id}", ['tags' => [$tag->id]])
            ->assertOk()
            ->assertJsonCount(1, 'data.tags')
            ->assertJsonPath('data.tags.0.id', $tag->id);

        $this->assertEquals([$tag->id], $post->fresh()->tags->modelKeys());
    }

    public function test_invalid_tag_returns_field_errors_without_changing_post(): void
    {
        $post = $this->createTaggedPost();
        $tagIds = $post->tags->modelKeys();

        $this->putJson("/api/posts/{$post->id}", [
            'header' => 'Changed header',
            'tags' => [999999],
        ])->assertUnprocessable()->assertJsonValidationErrors(['tags.0']);

        $this->assertEquals($post->header, $post->fresh()->header);
        $this->assertEquals($tagIds, $post->fresh()->tags->modelKeys());

        $this->postJson('/api/posts', [
            'header' => 'Valid header',
            'description' => 'A description with at least twenty characters.',
            'tags' => [999999],
        ])->assertUnprocessable()->assertJsonValidationErrors(['tags.0']);
    }

    public function test_all_tags_are_available_through_existing_pagination_contract(): void
    {
        Tag::factory()->count(18)->create();

        $first = $this->getJson('/api/tags')->assertOk()
            ->assertJsonCount(15, 'data')->assertJsonPath('meta.last_page', 2);
        $second = $this->getJson('/api/tags?page=2')->assertOk()->assertJsonCount(3, 'data');

        $ids = array_merge(array_column($first->json('data'), 'id'), array_column($second->json('data'), 'id'));
        $this->assertCount(18, array_unique($ids));
    }

    private function createTaggedPost(): Post
    {
        $post = Post::create([
            'user_id' => auth()->id(),
            'header' => 'Original header',
            'description' => 'A description with at least twenty characters.',
        ]);
        $post->tags()->sync(Tag::factory()->count(2)->create()->modelKeys());

        return $post;
    }
}
