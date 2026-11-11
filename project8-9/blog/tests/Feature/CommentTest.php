<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_comment_crud_ownership_validation_and_pagination(): void
    {
        $author = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $author->id]);
        $url = "/api/posts/{$post->id}/comments";
        $this->postJson($url, ['content' => 'Hello'])->assertUnauthorized();
        $this->actingAs($author)->postJson($url, ['content' => ''])->assertUnprocessable();
        $this->actingAs($author)->postJson($url, ['content' => str_repeat('a', 2001)])->assertUnprocessable();
        $id = $this->actingAs($author)->postJson($url, ['content' => '<script>alert(1)</script>'])->assertCreated()->json('data.id');
        $this->actingAs($other)->putJson("{$url}/{$id}", ['content' => 'No'])->assertForbidden();
        $this->actingAs($other)->deleteJson("{$url}/{$id}")->assertForbidden();
        $this->actingAs($author)->putJson("{$url}/{$id}", ['content' => 'Updated'])->assertOk();
        for ($i = 0; $i < 20; $i++) {
            $post->comments()->create(['user_id' => $author->id, 'content' => "Comment $i"]);
        }
        $page = $this->actingAs($author)->getJson($url)->assertOk()->assertJsonCount(20, 'data');
        $this->assertSame(2, $page->json('meta.last_page'));
        $this->assertSame($id, $page->json('data.0.id'));
        $this->actingAs($author)->deleteJson("{$url}/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('comments', ['id' => $id]);
    }

    public function test_deleted_author_is_anonymized_and_deleted_article_is_unavailable(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user)->postJson("/api/posts/{$post->id}/comments", ['content' => 'Before'])->assertCreated();
        $user->delete();
        $viewer = User::factory()->create();
        $this->actingAs($viewer)->getJson("/api/posts/{$post->id}/comments")
            ->assertOk()->assertJsonPath('data.0.author.username', 'Видалений користувач');
        $post->delete();
        $this->actingAs($viewer)->getJson("/api/posts/{$post->id}/comments")->assertNotFound();
    }
}
