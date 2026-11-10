<div id="avatarModal" class="modal-backdrop fixed inset-0 z-50 hidden items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
    <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="mb-4 text-lg font-bold text-slate-900">Фото профілю</h2>
        <form id="avatarForm" class="space-y-4">
            <label for="avatarFile" class="block text-sm font-medium text-slate-700">JPEG, PNG або WebP до 2 МБ</label>
            <input id="avatarFile" type="file" accept="image/jpeg,image/png,image/webp" required class="block w-full text-sm">
            <img id="avatarPreview" alt="Попередній перегляд аватара" class="hidden h-32 w-32 rounded-full object-cover">
            <div class="flex flex-wrap gap-2">
                <button type="submit" class="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Зберегти</button>
                <button type="button" id="avatarDelete" class="rounded-xl border px-4 py-2 text-sm text-rose-700">Видалити фото</button>
                <button type="button" data-modal-close="avatarModal" class="rounded-xl border px-4 py-2 text-sm">Скасувати</button>
            </div>
        </form>
    </div>
</div>
