<?php

namespace App\Services;

use App\Models\Post;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PostService
{
    public function create(array $data, array $tagIds = []): Post
    {
        return DB::transaction(function () use ($data, $tagIds) {

            $post = Post::create($data);

            if (! empty($tagIds)) {
                $post->tags()->sync($tagIds);
            }

            $this->invalidateRecent();

            return $post->load('tags');
        });
    }

    public function update(Post $post, array $data, ?array $tagIds = null): Post
    {
        return DB::transaction(function () use ($post, $data, $tagIds) {

            $post->update($data);

            if ($tagIds !== null) {
                $post->tags()->sync($tagIds);
            }

            $this->invalidateRecent();

            return $post->load('tags');
        });
    }

    public function delete(Post $post): void
    {
        $post->delete();
        $this->invalidateRecent();
    }

    public function listRecent(int $limit): Collection
    {
        if ($limit < 1 || $limit > 100) {
            throw new \InvalidArgumentException('Limit must be between 1 and 100.');
        }

        return Cache::remember("recent_posts:{$limit}", 45, fn () => Post::with(['user', 'tags'])->latest()->orderByDesc('id')->limit($limit)->get()
        );
    }

    private function invalidateRecent(): void
    {
        for ($limit = 1; $limit <= 100; $limit++) {
            Cache::forget("recent_posts:{$limit}");
        }
    }
}
