<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Mini Blog</title>
</head>
<body>
<h1>Mini Blog</h1>

@if(!$user)
<a href="{{ route('login.form') }}">Login</a>
@else
<p>Welcome, {{ $user['name'] }}</p>
<a href="{{ route('posts.create') }}">Create Post</a> |

<form action="{{ route('logout') }}" method="POST" style="display:inline;">
    @csrf
    <button type="submit" style="padding:0;border:0;background:none;color:#00f;cursor:pointer;text-decoration:underline;">
        Logout
    </button>
</form>

<h3>Posts:</h3>

@foreach($postsToShow as $post)
<p>
    <b>{{ $post->authorName }}</b>: {{ $post->content }}
    <small>({{ $post->time }})</small>

    @if(!empty($post->tags))
    <small># {{ implode(', ', $post->tags) }}</small>
    @endif
</p>
@endforeach

<p>
    Posts:
    <a href="{{ route('home', ['limit' => 5]) }}">5</a> |
    <a href="{{ route('home', ['limit' => 10]) }}">10</a> |
    <a href="{{ route('home', ['limit' => 20]) }}">20</a>
</p>
@endif

</body>
</html>