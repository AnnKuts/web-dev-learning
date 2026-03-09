<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTagRequest;
use App\Http\Requests\UpdateTagRequest;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use App\Services\TagService;
use Illuminate\Http\JsonResponse;

class TagController extends Controller
{
    public function __construct(private readonly TagService $tagService) {}
    public function index()
    {
        $tags = Tag::with('posts')->paginate(15);
        return TagResource::collection($tags);
    }

    public function show(Tag $tag)
    {
        return new TagResource($tag->load('posts'));
    }

    public function store(StoreTagRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $tag = $this->tagService->create($validated);
        return (new TagResource($tag))->response()->setStatusCode(201);
    }

    public function update(UpdateTagRequest $request, Tag $tag): JsonResponse
    {
        $validated = $request->validated();
        $updatedTag = $this->tagService->update($tag, $validated);
        return (new TagResource($updatedTag))->response();
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $this->tagService->delete($tag);
        return response()->json(['message' => 'Tag deleted successfully'], 204);
    }
}
