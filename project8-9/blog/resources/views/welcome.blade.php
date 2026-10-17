@extends('layouts.app')

@section('title', 'Blog API Dashboard')

@section('content')
<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
    <nav class="flex space-x-2 bg-slate-200/70 p-1 rounded-xl w-fit">
        <button type="button" data-tab="posts" id="tabBtn-posts" class="tab-btn px-4 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-900 shadow-sm transition">
            Статті
        </button>
        <button type="button" data-tab="tags" id="tabBtn-tags" class="tab-btn px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Теги
        </button>
        <button type="button" data-tab="users" id="tabBtn-users" class="tab-btn px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Користувачі
        </button>
    </nav>

    <div class="flex items-center space-x-2">
        <button type="button" data-modal-open="newTagModal" class="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg transition shadow-2xs">
            <i class="fa-solid fa-plus mr-1" aria-hidden="true"></i> Новий тег
        </button>
        <button type="button" id="refreshBtn" class="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg transition shadow-2xs">
            <i class="fa-solid fa-arrows-rotate mr-1"></i> Оновити
        </button>
    </div>
</div>

<section id="tab-posts" class="tab-content">
    <div id="postsList" class="space-y-4">
        <div class="p-8 text-center text-slate-400">Завантаження статей...</div>
    </div>
    <div id="postsPagination" class="mt-6 flex items-center justify-between"></div>
</section>

<section id="tab-tags" class="tab-content hidden">
    <div id="tagsList" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div class="p-8 text-center text-slate-400 col-span-full">Завантаження тегів...</div>
    </div>
</section>

<section id="tab-users" class="tab-content hidden">
    <div id="usersList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="p-8 text-center text-slate-400 col-span-full">Завантаження користувачів...</div>
    </div>
    <div id="usersPagination" class="mt-6 flex items-center justify-between"></div>
</section>
@endsection
