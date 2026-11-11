<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use App\Services\PostService;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PostPerformanceTest extends TestCase
{
    use DatabaseMigrations;

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

    public function test_database_cache_version_advances_after_commit_and_not_after_rollback(): void
    {
        config(['cache.default' => 'database']);
        Cache::purge('database');
        try {
            $user = User::factory()->create();
            $service = app(PostService::class);
            $this->assertCount(0, $service->listRecent(10));
            $this->assertCount(0, $service->listRecent(5));
            $this->assertSame(0, Cache::get('recent_posts:version', 0));

            try {
                DB::transaction(function () use ($service, $user): void {
                    $service->create(['user_id' => $user->id, 'header' => 'Rolled back', 'description' => 'Description long enough']);
                    throw new \RuntimeException('rollback');
                });
            } catch (\RuntimeException $exception) {
                $this->assertSame('rollback', $exception->getMessage());
            }
            $this->assertSame(0, Cache::get('recent_posts:version', 0));
            $this->assertCount(0, $service->listRecent(10));

            $post = $service->create(['user_id' => $user->id, 'header' => 'Committed post', 'description' => 'Description long enough']);
            $this->assertSame(1, Cache::get('recent_posts:version'));
            $this->assertCount(1, $service->listRecent(10));
            $this->assertCount(1, $service->listRecent(5));
            $service->update($post, ['header' => 'Updated post']);
            $this->assertSame(2, Cache::get('recent_posts:version'));
            $this->assertSame('Updated post', $service->listRecent(10)->first()->header);
            $service->delete($post);
            $this->assertSame(3, Cache::get('recent_posts:version'));
            $this->assertCount(0, $service->listRecent(10));
        } finally {
            config(['cache.default' => 'array']);
            Cache::purge('database');
        }
    }

    public function test_listing_eager_loads_authors_and_tags_with_bounded_queries(): void
    {
        $user = User::factory()->create();
        Post::factory()->count(15)->create(['user_id' => $user->id]);
        $queries = 0;
        DB::listen(function () use (&$queries): void {
            $queries++;
        });
        $this->actingAs($user)->getJson('/api/posts')->assertOk()->assertJsonCount(15, 'data');
        $this->assertLessThanOrEqual(5, $queries);
    }
}
