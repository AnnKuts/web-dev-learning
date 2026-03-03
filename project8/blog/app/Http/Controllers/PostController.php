<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;

class PostController extends Controller
{
    public function __construct(private readonly PostService $postService) {}

    public function index()
    {
        $this->authorize('viewAny', Post::class);
        $posts = Post::with(['user', 'tags'])->paginate(15);
        return PostResource::collection($posts);
    }

    public function show(Post $post)
    {
        $this->authorize('view', $post);
        return new PostResource($post->load(['user', 'tags']));
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $this->authorize('create', Post::class);
        $validated = $request->validated();

        $post = $this->postService->create(
            $validated,
            $validated['tags'] ?? []
        );

        return (new PostResource($post->load(['user', 'tags'])))->response()->setStatusCode(201);
    }

    public function update(UpdatePostRequest $request, Post $post): JsonResponse
    {
        $this->authorize('update', $post);
        $validated = $request->validated();

        $updatedPost = $this->postService->update(
            $post,
            $validated,
            $validated['tags'] ?? []
        );

        return (new PostResource($updatedPost->load(['user', 'tags'])))->response();
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);
        $this->postService->delete($post);

        return response()->json(['message' => 'Post deleted successfully'], 204);
    }
}
