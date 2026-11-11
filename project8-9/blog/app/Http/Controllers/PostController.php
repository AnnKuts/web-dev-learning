<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Http\Resources\TagResource;
use App\Models\Post;
use App\Models\Tag;
use App\Services\PostMediaService;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function __construct(private readonly PostService $postService, private readonly PostMediaService $media) {}

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
            ->when($query !== '', fn ($posts) => $posts->where('header', 'like', '%'.$query.'%'))
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

        return new PostResource($post->load(['user', 'tags', 'images']));
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $this->authorize('create', Post::class);
        $validated = $request->validated();
        $post = $this->media->create(
            array_merge(collect($validated)->except(['images'])->all(), ['user_id' => auth()->id()]),
            $validated['tags'] ?? [],
            $request->file('images', [])
        );

        return (new PostResource($post->load(['user', 'tags', 'images'])))->response()->setStatusCode(201);
    }

    public function update(UpdatePostRequest $request, Post $post): JsonResponse
    {
        $this->authorize('update', $post);
        $validated = $request->validated();
        $updatedPost = $this->media->update(
            $post,
            collect($validated)->except(['images', 'remove_images', 'clear_tags'])->all(),
            ($validated['clear_tags'] ?? false) ? [] : ($validated['tags'] ?? null),
            $request->file('images', []),
            $validated['remove_images'] ?? []
        );

        return (new PostResource($updatedPost->load(['user', 'tags', 'images'])))->response();
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);
        $this->postService->delete($post);

        return response()->json(['message' => 'Post deleted successfully'], 204);
    }
}
