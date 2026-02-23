@if($error)
<p style="color:red;">{{ $error }}</p>
@endif

<form method="POST" action="{{ route('posts.store') }}">
    @csrf

    <textarea name="content"></textarea>

    <input type="text" name="tags" placeholder="Tags">

    <button type="submit">Publish</button>
</form>