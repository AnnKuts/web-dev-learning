<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Http\Resources\TagResource;
use App\Models\Post;
use App\Models\Tag;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function __construct(private readonly PostService $postService) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Post::class);
        $validated = $request->validate([
            'q' => 'nullable|string',
            'tag' => 'nullable|integer|min:1',
        ]);
        $query = trim($validated['q'] ?? '');
        $tag = isset($validated['tag']) ? Tag::findOrFail($validated['tag']) : null;
        $posts = Post::with(['user', 'tags'])
            ->when($query !== '', fn ($posts) => $posts->where('header', 'like', '%' . $query . '%'))
            ->when($tag, fn ($posts) => $posts->whereHas('tags', fn ($tags) => $tags->whereKey($tag->id)))
            ->latest()->orderByDesc('id')
            ->paginate(15)->withQueryString();
        return PostResource::collection($posts)->additional([
            'filter_tag' => $tag ? new TagResource($tag) : null,
        ]);
    }

    public function recent(Request $request)
    {
        $this->authorize('viewAny', Post::class);
        $limit = $request->validate(['limit' => 'nullable|integer|between:1,100'])['limit'] ?? 10;
        return PostResource::collection($this->postService->listRecent((int) $limit));
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
            array_merge($validated, ['user_id' => auth()->id()]),
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
            $validated['tags'] ?? null
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
