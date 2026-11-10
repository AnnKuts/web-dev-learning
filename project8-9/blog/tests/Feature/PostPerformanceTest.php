<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use App\Services\PostService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PostPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_recent_cache_is_invalidated_after_create_update_and_delete(): void
    {
        $user = User::factory()->create();
        $service = app(PostService::class);
        $this->assertCount(0, $service->listRecent(10));
        $post = $service->create(['user_id' => $user->id, 'header' => 'First title', 'description' => 'First description long enough']);
        $this->assertCount(1, $service->listRecent(10));
        $service->update($post, ['header' => 'Changed title']);
        $this->assertSame('Changed title', $service->listRecent(10)->first()->header);
        $service->delete($post);
        $this->assertCount(0, $service->listRecent(10));
    }

    public function test_listing_eager_loads_authors_and_tags_with_bounded_queries(): void
    {
        $user = User::factory()->create();
        Post::factory()->count(15)->create(['user_id' => $user->id]);
        $queries = 0;
        DB::listen(function () use (&$queries): void { $queries++; });
        $this->actingAs($user)->getJson('/api/posts')->assertOk()->assertJsonCount(15, 'data');
        $this->assertLessThanOrEqual(5, $queries);
    }
}
