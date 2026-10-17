<header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" class="flex items-center space-x-3 group">
            <img src="{{ asset('icon.png') }}" alt="Logo" class="w-10 h-10 rounded-xl object-contain shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
            <div>
                <h1 class="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">Блог UA</h1>
                <div class="flex items-center space-x-2 text-xs">
                    @if(app()->isLocal() && config('auth.dev_bypass'))
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Dev Auth Bypass ({{ config('auth.dev_user_email') }})
                        </span>
                    @else
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Sanctum Required
                        </span>
                    @endif
                </div>
            </div>
        </a>

        <div class="flex items-center space-x-3">
            <div id="userState" class="text-sm font-medium text-slate-600 flex items-center space-x-2"></div>
            <button type="button" data-modal-open="newPostModal" class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-indigo-200 flex items-center space-x-1.5">
                <i class="fa-solid fa-plus text-xs"></i>
                <span>Створити статтю</span>
            </button>
        </div>
    </div>
</header>
