@if(config('services.google.client_id') && config('services.google.client_secret') && config('services.google.redirect'))
    <button type="button" data-google-login
        class="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60">
        <svg class="h-5 w-5 shrink-0" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.909c1.702-1.567 2.684-3.875 2.684-6.614Z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.468-.806 5.956-2.181l-2.909-2.258c-.806.54-1.836.859-3.047.859-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A9 9 0 0 0 9 18Z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A9 9 0 0 0 0 9c0 1.452.347 2.827.957 4.042l3.007-2.332Z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.507.454 3.44 1.346l2.581-2.581C13.464.892 11.426 0 9 0A9 9 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
        </svg>
        <span>Продовжити через Google</span>
    </button>
    <div class="my-5 flex items-center gap-3 text-xs text-slate-500">
        <span class="h-px flex-1 bg-slate-200" aria-hidden="true"></span>
        <span class="shrink-0">або через email</span>
        <span class="h-px flex-1 bg-slate-200" aria-hidden="true"></span>
    </div>
@endif
