<form method="POST" action="{{ route('login') }}">
    @csrf

    <input
        type="text"
        name="name"
        placeholder="Your name"
        value="{{ $lastName }}"
    >
    <button type="submit">Login</button>
</form>