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
    </article>
</div>
@endsection
