<?php

namespace App\Http\Controllers;

use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Post $post)
    {
        return CommentResource::collection($post->comments()->with('user')
            ->orderBy('created_at')->orderBy('id')->paginate(20));
    }

    public function store(Request $request, Post $post)
    {
        $data = $request->validate(['content' => ['required', 'string', 'min:1', 'max:2000']]);
        $comment = $post->comments()->create(['user_id' => $request->user()->id, 'content' => $data['content']]);

        return (new CommentResource($comment->load('user')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Post $post, Comment $comment)
    {
        abort_unless($comment->post_id === $post->id, 404);
        $this->authorize('update', $comment);
        $data = $request->validate(['content' => ['required', 'string', 'min:1', 'max:2000']]);
        $comment->update($data);

        return new CommentResource($comment->load('user'));
    }

    public function destroy(Post $post, Comment $comment)
    {
        abort_unless($comment->post_id === $post->id, 404);
        $this->authorize('delete', $comment);
        $comment->delete();

        return response()->noContent();
    }
}
