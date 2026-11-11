<div id="avatarModal" role="dialog" aria-modal="true" aria-labelledby="avatarModalTitle" class="modal-backdrop fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
    <div class="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white p-6 shadow-xl relative">
        <div class="flex items-center justify-between mb-5">
            <div>
                <h2 id="avatarModalTitle" class="text-lg font-bold text-slate-900">Фото профілю</h2>
                <p class="text-xs text-slate-500 mt-0.5">Оновіть або змініть зображення вашого облікового запису</p>
            </div>
            <button type="button" data-modal-close="avatarModal" aria-label="Закрити" class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
        </div>

        <form id="avatarForm" class="space-y-5">
            <div class="flex flex-col items-center justify-center gap-4 py-2">
                <div class="relative flex items-center justify-center">
                    <img id="avatarPreview" alt="Попередній перегляд аватара" class="hidden h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-indigo-50 shadow-md">
                    <div id="avatarPlaceholder" class="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-3xl sm:text-4xl uppercase ring-4 ring-indigo-50 shadow-inner select-none">
                        U
                    </div>
                </div>

                <div class="flex flex-col items-center gap-2 w-full">
                    <input id="avatarFile" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only">
                    <label for="avatarFile" id="avatarSelectBtn" class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-2xs transition-all hover:bg-indigo-100 hover:border-indigo-300 active:scale-95 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600">
                        <i class="fa-solid fa-camera text-xs" aria-hidden="true"></i>
                        <span>Обрати фото</span>
                    </label>
                    <p id="avatarFileName" class="hidden text-xs font-medium text-indigo-600 truncate max-w-full px-2"></p>
                    <p class="text-xs text-slate-500 text-center">JPEG, PNG або WebP до 2 МБ</p>
                </div>
            </div>

            <p id="avatarError" role="alert" class="hidden rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600 text-center"></p>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button type="button" id="avatarDelete" class="hidden min-h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 active:bg-rose-200/70 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fa-solid fa-trash-can text-xs" aria-hidden="true"></i>
                    <span>Видалити фото</span>
                </button>
                <div class="flex flex-wrap items-center justify-end gap-2 ml-auto">
                    <button type="button" data-modal-close="avatarModal" class="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer">
                        Скасувати
                    </button>
                    <button type="submit" id="avatarSaveBtn" disabled class="min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:bg-indigo-800 transition-all cursor-pointer disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed">
                        <span>Зберегти</span>
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>
