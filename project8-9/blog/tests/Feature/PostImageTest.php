<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostImageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('images');
    }

    private function data(array $extra = []): array
    {
        return array_merge(['header' => 'Photo article', 'description' => str_repeat('Article body ', 4)], $extra);
    }

    public function test_create_multiple_remove_and_existing_article(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->post('/api/posts', $this->data(['images' => [UploadedFile::fake()->image('one.png'), UploadedFile::fake()->image('two.jpg')]]), ['Accept' => 'application/json']);
        $response->assertCreated()->assertJsonCount(2, 'data.images');
        $post = Post::findOrFail($response->json('data.id'));
        $paths = $post->images->pluck('path')->all();
        foreach ($paths as $path) {
            Storage::disk('images')->assertExists($path);
        }
        $this->actingAs($user)->post("/api/posts/{$post->id}", $this->data(['_method' => 'PUT', 'remove_images' => [$post->images->first()->id], 'images' => [UploadedFile::fake()->image('three.webp')]]), ['Accept' => 'application/json'])->assertOk()->assertJsonCount(2, 'data.images');
        Storage::disk('images')->assertMissing($paths[0]);
        $old = Post::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user)->getJson("/api/posts/{$old->id}")->assertOk()->assertJsonCount(0, 'data.images');
    }

    public function test_max_count_type_and_ownership(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $owner->id]);
        $url = "/api/posts/{$post->id}";
        $this->actingAs($other)->post($url, $this->data(['_method' => 'PUT', 'images' => [UploadedFile::fake()->image('x.png')]]), ['Accept' => 'application/json'])->assertForbidden();
        $this->actingAs($owner)->post($url, $this->data(['_method' => 'PUT', 'images' => [UploadedFile::fake()->create('evil.svg', 1, 'image/svg+xml')]]), ['Accept' => 'application/json'])->assertUnprocessable();
        $this->actingAs($owner)->post($url, $this->data(['_method' => 'PUT', 'images' => array_fill(0, 6, UploadedFile::fake()->image('x.png'))]), ['Accept' => 'application/json'])->assertUnprocessable();
        $this->assertDatabaseCount('post_images', 0);

        $another = Post::factory()->create(['user_id' => $owner->id]);
        $image = $another->images()->create(['path' => 'posts/other.webp', 'display_order' => 1]);
        $this->actingAs($owner)->putJson($url, $this->data(['remove_images' => [$image->id]]))->assertUnprocessable();
        $this->assertDatabaseHas('post_images', ['id' => $image->id, 'post_id' => $another->id]);
    }
}
