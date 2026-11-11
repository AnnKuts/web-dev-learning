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

    <div id="deleteCommentModal" role="dialog" aria-modal="true" aria-labelledby="deleteCommentModalTitle" class="modal-backdrop fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl relative">
            <div class="flex items-start gap-3.5">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <i class="fa-solid fa-trash-can text-sm" aria-hidden="true"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <h3 id="deleteCommentModalTitle" class="text-base font-bold text-slate-900">Видалити коментар?</h3>
                    <p class="mt-1 text-xs leading-relaxed text-slate-500">Ви дійсно хочете видалити цей коментар? Цю дію неможливо скасувати.</p>
                </div>
            </div>
            <div class="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" data-comment-delete-cancel class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer">
                    Скасувати
                </button>
                <button type="button" id="confirmDeleteCommentBtn" data-comment-delete-confirm class="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-rose-700 active:bg-rose-800 transition cursor-pointer disabled:opacity-50">
                    Видалити
                </button>
            </div>
        </div>
    </div>

    <section id="publishedPosts" class="hidden mt-8" aria-label="Список статей">
        @include('partials.posts.list')
    </section>
</div>
@endsection
