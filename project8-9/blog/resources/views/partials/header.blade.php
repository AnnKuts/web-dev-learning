<header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <a href="/" class="order-1 h-16 flex flex-1 min-w-0 items-center space-x-3 group">
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
            class="order-2 lg:hidden shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors">
            <i class="fa-solid fa-bars text-lg" aria-hidden="true"></i>
        </button>

        <button type="button" data-modal-open="newPostModal" data-auth-required hidden class="order-4 lg:order-2 w-full lg:w-auto mb-3 lg:mb-0 min-h-11 shrink-0 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-200 active:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center justify-center space-x-2 whitespace-nowrap">
            <i class="fa-solid fa-plus text-xs" aria-hidden="true"></i>
            <span>Створити статтю</span>
        </button>

        <div id="headerMenu" class="order-3 lg:order-3 hidden basis-full min-w-0 flex flex-col gap-3 border-t border-slate-200 py-3 lg:basis-auto lg:flex lg:flex-row lg:items-center lg:border-0 lg:py-0">
            <div id="userState" class="min-w-0 text-sm font-medium text-slate-600 flex items-center"></div>
        </div>
    </div>
</header>
