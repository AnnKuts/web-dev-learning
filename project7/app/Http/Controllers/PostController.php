<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->session()->get('user'); // array|null
        $posts = $request->session()->get('posts', []); // array<Post>

        $limit = (int) $request->query('limit', 10);
        if ($limit <= 0) {
            $limit = 10;
        }
        if ($limit > 20) {
            $limit = 20;
        }

        if ($request->has('limit')) {
            Log::info('Limit from GET: ' . (int) $request->query('limit'));
        }

        $postsToShow = array_slice($posts, -$limit);

        if ($user) {
            Log::info('User visited index');
        }

        return view('index', [
            'user' => $user,
            'postsToShow' => $postsToShow,
            'limit' => $limit,
        ]);
    }

    public function create(Request $request)
    {
        if (!$request->session()->has('user')) {
            return redirect()->route('login.form');
        }

        return view('create', [
            'error' => session('error'),
        ]);
    }

    public function store(Request $request)
    {
        if (!$request->session()->has('user')) {
            return redirect()->route('login.form');
        }

        $content = (string) $request->input('content', '');

        if (trim($content) !== '' && mb_strlen(trim($content)) < 3) {
            return back()->with('error', 'Post content must be at least 3 characters (if not empty).');
        }

        $tagsRaw = (string) $request->input('tags', '');
        $tags = array_filter(array_map('trim', explode(',', $tagsRaw)), fn ($t) => $t !== '');

        $user = $request->session()->get('user'); // ['name' => ...]
        $authorName = $user['name'] ?? 'Unknown';

        $posts = $request->session()->get('posts', []);
        $posts[] = new Post($content, $authorName, $tags);

        $request->session()->put('posts', $posts);

        return redirect()->route('home');
    }
}
