<div id="loginModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Авторизація</h2>
        <form id="loginForm" class="space-y-4">
            <div>
                <label for="loginEmail" class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" id="loginEmail" required value="admin@example.com" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
            </div>
            <div>
                <label for="loginPassword" class="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
                <input type="password" id="loginPassword" required value="password" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
            </div>
            <div class="flex justify-end space-x-2 pt-2">
                <button type="button" data-modal-close="loginModal" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Скасувати</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm">Увійти</button>
            </div>
        </form>
    </div>
</div>

<div id="registerModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Реєстрація</h2>
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
            <div class="flex justify-end space-x-2 pt-2">
                <button type="button" data-modal-close="registerModal" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Скасувати</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm">Зареєструватися</button>
            </div>
        </form>
    </div>
</div>
