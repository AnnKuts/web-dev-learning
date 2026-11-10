<div id="loginModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-5 sm:p-6 relative">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Авторизація</h2>
        @include('partials.modals.google-sign-in')
        <form id="loginForm" class="space-y-4">
            <div>
                <label for="loginEmail" class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" id="loginEmail" required placeholder="you@example.com" autocomplete="username" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
            </div>
            <div>
                <label for="loginPassword" class="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
                <input type="password" id="loginPassword" required autocomplete="current-password" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
            </div>
            <div class="flex flex-wrap justify-end gap-2 pt-2">
                <button type="button" data-modal-close="loginModal" class="min-h-11 px-4 py-2.5 border border-slate-300 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors">Скасувати</button>
                <button type="submit" class="min-h-11 flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 active:bg-indigo-800 active:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all">Увійти</button>
            </div>
        </form>
    </div>
</div>

<div id="registerModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-5 sm:p-6 relative">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Реєстрація</h2>
        @include('partials.modals.google-sign-in')
        <form id="registerForm" class="space-y-4">
            <div>
                <label for="regUsername" class="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input type="text" id="regUsername" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
            </div>
            <div>
                <label for="regEmail" class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" id="regEmail" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
            </div>
            <div>
                <label for="regPassword" class="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
                <input type="password" id="regPassword" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
            </div>
            <div>
                <label for="regPasswordConf" class="block text-sm font-medium text-slate-700 mb-1">Підтвердження паролю</label>
                <input type="password" id="regPasswordConf" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
            </div>
            <div>
                <label for="regBio" class="block text-sm font-medium text-slate-700 mb-1">Біографія (опціонально)</label>
                <textarea id="regBio" rows="2" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"></textarea>
            </div>
            <div class="flex flex-wrap justify-end gap-2 pt-2">
                <button type="button" data-modal-close="registerModal" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Скасувати</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm">Зареєструватися</button>
            </div>
        </form>
    </div>
</div>

<div id="googleLinkModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <h2 class="text-lg font-bold text-slate-900 mb-2">Підключити Google</h2>
        <p class="text-sm text-slate-600 mb-4">Підтвердьте пароль цього акаунту, а потім виберіть власний акаунт Google. Якщо ви вже входите через Google, повторне підключення не потрібне.</p>
        <form id="googleLinkForm" class="space-y-4">
            <div>
                <label for="googleLinkPassword" class="block text-sm font-medium text-slate-700 mb-1">Поточний пароль</label>
                <input id="googleLinkPassword" type="password" autocomplete="current-password" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
            </div>
            <div class="flex flex-wrap justify-end gap-2 pt-2">
                <button type="button" data-modal-close="googleLinkModal" class="min-h-11 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">Скасувати</button>
                <button type="submit" class="min-h-11 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all cursor-pointer">Підключити Google</button>
            </div>
        </form>
    </div>
</div>
