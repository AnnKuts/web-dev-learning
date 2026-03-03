<?php

namespace App\Services;

use App\Models\Post;

use Illuminate\Support\Facades\DB;

class PostService
{
    public function create(array $data, array $tagIds = []): Post
    {
        return DB::transaction(function () use ($data, $tagIds) {

            $post = Post::create($data);

            if (!empty($tagIds)) {
                $post->tags()->sync($tagIds);
            }

            return $post->load('tags');
        });
    }

    public function update(Post $post, array $data, array $tagIds = []): Post
    {
        return DB::transaction(function () use ($post, $data, $tagIds) {

            $post->update($data);

            if (!empty($tagIds)) {
                $post->tags()->sync($tagIds);
            }

            return $post->load('tags');
        });
    }

    public function delete(Post $post): void
    {
        $post->delete();
    }
}
