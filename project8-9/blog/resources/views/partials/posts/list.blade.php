<div class="mb-6">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
        <label for="postSearch" class="text-sm font-medium text-slate-700">Пошук за заголовком</label>
        <div id="postTagFilter" class="hidden flex min-w-0 max-w-full items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 pl-3 pr-1 py-1 text-indigo-700">
            <span class="sr-only">Активний тег:</span>
            <span id="postTagLabel" class="min-w-0 truncate text-xs font-semibold"></span>
            <a href="/" data-action="filter-tag" aria-label="Скинути фільтр за тегом і показати всі статті" title="Показати всі статті"
                class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors">
                <i class="fa-solid fa-xmark text-sm" aria-hidden="true"></i>
            </a>
        </div>
    </div>
    <input type="search" id="postSearch" placeholder="Введіть заголовок статті…"
        class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200">
</div>
<div id="postsList" class="space-y-4" aria-live="polite"></div>
<nav id="postsPagination" aria-label="Сторінки статей" class="pagination"></nav>
