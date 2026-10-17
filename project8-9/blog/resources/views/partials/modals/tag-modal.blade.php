<div id="newTagModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Додати новий тег</h2>
        <form id="newTagForm" class="space-y-4">
            <div>
                <label for="tagName" class="block text-sm font-medium text-slate-700 mb-1">Назва тегу</label>
                <input type="text" id="tagName" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden" placeholder="Наприклад: React">
            </div>
            <div>
                <label for="tagSlug" class="block text-sm font-medium text-slate-700 mb-1">Slug (слаг)</label>
                <input type="text" id="tagSlug" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden" placeholder="наприклад: react">
            </div>
            <div class="flex justify-end space-x-2 pt-2">
                <button type="button" data-modal-close="newTagModal" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Скасувати</button>
                <button type="submit" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm">Створити</button>
            </div>
        </form>
    </div>
</div>
