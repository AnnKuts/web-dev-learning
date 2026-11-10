@extends('layouts.app')

@section('title', 'Стаття — Блог UA')

@section('content')
<div class="max-w-3xl mx-auto">
    <a href="/" class="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 mb-6">
        <i class="fa-solid fa-arrow-left-long" aria-hidden="true"></i>
        До всіх статей
    </a>
    <article id="postDetail" data-post-id="{{ $postId }}" class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xs">
        <h1 id="viewPostHeader" class="text-2xl font-bold text-slate-900 break-words mb-3">Завантаження статті…</h1>
        <p id="viewPostMeta" class="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-3"></p>
        <p id="viewPostTags" class="text-xs font-medium text-indigo-700 break-words mb-5"></p>
        <div id="viewPostDescription" class="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed break-words"></div>
        <div id="viewPostImages" class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"></div>
    </article>
    <section id="commentsSection" class="mt-8" aria-label="Коментарі">
        <h2 class="mb-4 text-xl font-bold text-slate-900">Коментарі</h2>
        <form id="commentForm" class="mb-5 space-y-2">
            <label for="commentContent" class="block text-sm font-medium text-slate-700">Ваш коментар</label>
            <textarea id="commentContent" required maxlength="2000" rows="3" class="w-full rounded-xl border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-indigo-500"></textarea>
            <button type="submit" class="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Опублікувати коментар</button>
        </form>
        <div id="commentsList" class="space-y-3" aria-live="polite"></div>
        <button id="commentsMore" type="button" class="mt-4 hidden text-sm font-semibold text-indigo-700 hover:underline">Наступні коментарі</button>
    </section>
    <section id="publishedPosts" class="hidden mt-8" aria-label="Список статей">
        @include('partials.posts.list')
    </section>
</div>
@endsection
