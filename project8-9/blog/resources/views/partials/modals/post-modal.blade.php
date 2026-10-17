<div id="newPostModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h2 class="text-lg font-bold text-slate-900">Нова стаття</h2>
            </div>
            <div id="draftStatus" class="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 hidden">
                <i class="fa-solid fa-floppy-disk mr-1"></i> Чернетка збережена
            </div>
        </div>

        <form id="newPostForm" class="space-y-4" novalidate>
            @include('partials.posts.form-fields', ['prefix' => 'post'])

            <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                <button type="button" id="clearDraftBtn" class="text-xs text-slate-500 hover:text-rose-600 hover:underline inline-flex items-center">
                    <i class="fa-solid fa-trash-can mr-1"></i> Очистити чернетку
                </button>
                <div class="flex space-x-2">
                    <button type="button" data-modal-close="newPostModal" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Скасувати</button>
                    <button type="submit" id="submitPostBtn" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition">Опублікувати</button>
                </div>
            </div>
        </form>
    </div>
</div>

<div id="editPostModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
        <h2 class="text-lg font-bold text-slate-900 mb-4">Редагувати статтю</h2>
        <form id="editPostForm" class="space-y-4" novalidate>
            <input type="hidden" id="editPostId">
            @include('partials.posts.form-fields', ['prefix' => 'editPost'])

            <div class="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button type="button" data-modal-close="editPostModal" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Скасувати</button>
                <button type="submit" id="submitEditPostBtn" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition">Зберегти зміни</button>
            </div>
        </form>
    </div>
</div>
