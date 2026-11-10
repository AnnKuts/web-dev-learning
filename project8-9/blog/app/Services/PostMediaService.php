<?php

namespace App\Services;

use App\Models\Post;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PostMediaService
{
    public function __construct(private readonly PostService $posts, private readonly ImageService $images) {}

    public function create(array $data, array $tags, array $files): Post
    {
        $stored = [];
        try {
            return DB::transaction(function () use ($data, $tags, $files, &$stored) {
                $post = $this->posts->create($data, $tags);
                $this->attach($post, $files, 0, $stored);

                return $post;
            });
        } catch (\Throwable $e) {
            foreach ($stored as $path) {
                $this->images->delete($path);
            }
            throw $e;
        }
    }

    public function update(Post $post, array $data, ?array $tags, array $files, array $removeIds): Post
    {
        $stored = [];
        $removed = [];
        try {
            $updated = DB::transaction(function () use ($post, $data, $tags, $files, $removeIds, &$stored, &$removed) {
                $post = Post::whereKey($post->id)->lockForUpdate()->firstOrFail();
                $removed = $post->images()->whereIn('id', $removeIds)->get();
                if ($removed->count() !== count($removeIds)) {
                    throw ValidationException::withMessages(['remove_images' => 'Зображення не належить цій статті.']);
                }
                if ($post->images()->count() - $removed->count() + count($files) > 5) {
                    throw ValidationException::withMessages(['images' => 'Не більше п’яти зображень на статтю.']);
                }
                $post = $this->posts->update($post, $data, $tags);
                $post->images()->whereIn('id', $removeIds)->delete();
                $this->attach($post, $files, (int) ($post->images()->max('display_order') ?? 0), $stored);

                return $post;
            });
        } catch (\Throwable $e) {
            foreach ($stored as $path) {
                $this->images->delete($path);
            }
            throw $e;
        }
        foreach ($removed as $image) {
            try {
                $this->images->delete($image->path);
            } catch (\Throwable $e) {
                Log::warning('Post image cleanup failed', ['image_id' => $image->id]);
            }
        }

        return $updated;
    }

    private function attach(Post $post, array $files, int $order, array &$stored): void
    {
        foreach ($files as $file) {
            $path = $this->images->store($file, 'posts', 1600);
            $stored[] = $path;
            $post->images()->create(['path' => $path, 'display_order' => ++$order]);
        }
    }
}
