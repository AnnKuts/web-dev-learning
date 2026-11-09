<header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 flex flex-wrap items-center justify-between gap-x-4">
        <a href="/" class="h-16 flex flex-1 min-w-0 items-center space-x-3 group">
            <img src="{{ asset('icon.png') }}" alt="Logo" class="w-10 h-10 shrink-0 rounded-xl object-contain shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
            <div class="min-w-0">
                <h1 class="text-lg font-bold text-slate-900 leading-tight truncate group-hover:text-indigo-600 transition-colors">Блог UA</h1>
                <div class="flex items-center space-x-2 text-xs">
                    @if(app()->isLocal() && config('auth.dev_bypass'))
                        <span class="inline-flex min-w-0 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <span class="w-1.5 h-1.5 mr-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span class="truncate">Dev Auth Bypass ({{ config('auth.dev_user_email') }})</span>
                        </span>
                    @endif
                </div>
            </div>
        </a>

        <button type="button" id="headerMenuToggle" aria-controls="headerMenu" aria-expanded="false" aria-label="Відкрити меню"
            class="lg:hidden shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors">
            <i class="fa-solid fa-bars text-lg" aria-hidden="true"></i>
        </button>

        <div id="headerMenu" class="hidden basis-full min-w-0 flex flex-col gap-3 border-t border-slate-200 py-3 lg:basis-auto lg:flex lg:flex-row lg:items-center lg:border-0 lg:py-0">
            <div id="userState" class="min-w-0 text-sm font-medium text-slate-600 flex items-center"></div>
            <button type="button" data-modal-open="newPostModal" class="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-indigo-200 flex items-center justify-center space-x-1.5 whitespace-nowrap">
                <i class="fa-solid fa-plus text-xs" aria-hidden="true"></i>
                <span>Створити статтю</span>
            </button>
        </div>
    </div>
</header>
