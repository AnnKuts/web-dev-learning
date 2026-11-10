<div id="profileSettingsModal" role="dialog" aria-modal="true" aria-labelledby="profileSettingsTitle" class="modal-backdrop fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
    <div class="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white p-6 shadow-xl relative">
        <div class="flex items-center justify-between mb-5">
            <div>
                <h2 id="profileSettingsTitle" class="text-lg font-bold text-slate-900">Налаштування профілю</h2>
                <p class="text-xs text-slate-500 mt-0.5">Керування вашим обліковим записом</p>
            </div>
            <button type="button" data-modal-close="profileSettingsModal" aria-label="Закрити" class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
        </div>

        <div class="space-y-4">
            <div class="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                <div class="shrink-0">
                    <img id="profileSettingsAvatarImg" alt="Аватар профілю" class="hidden h-16 w-16 rounded-full object-cover ring-2 ring-white shadow-sm">
                    <div id="profileSettingsAvatarFallback" class="h-16 w-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl uppercase ring-2 ring-white shadow-inner select-none">
                        U
                    </div>
                </div>
                <div class="min-w-0 flex-1">
                    <p id="profileSettingsUsername" class="text-base font-bold text-slate-900 truncate">—</p>
                    <p id="profileSettingsEmail" class="text-xs font-medium text-slate-500 truncate mt-0.5">—</p>
                    <p id="profileSettingsBio" class="hidden text-xs text-slate-600 mt-1.5 line-clamp-2"></p>
                </div>
            </div>

            <div class="rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                    <h3 class="text-sm font-semibold text-slate-900">Фото профілю</h3>
                    <p id="profileSettingsAvatarStatus" class="text-xs text-slate-500 mt-0.5">JPEG, PNG або WebP до 2 МБ</p>
                </div>
                <button type="button" id="profileOpenAvatarBtn" data-modal-close="profileSettingsModal" data-modal-open="avatarModal" class="shrink-0 min-h-10 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer">
                    <i class="fa-solid fa-camera" aria-hidden="true"></i>
                    <span>Змінити фотографію</span>
                </button>
            </div>

            <div class="rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                        <i class="fa-brands fa-google text-slate-600 text-sm" aria-hidden="true"></i>
                        <h3 class="text-sm font-semibold text-slate-900">Обліковий запис Google</h3>
                    </div>
                    <p id="profileSettingsGoogleText" class="text-xs text-slate-500 mt-0.5">Швидкий вхід через Google</p>
                </div>
                <div class="shrink-0 flex items-center gap-2">
                    <span id="profileSettingsGoogleBadge" class="hidden inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <i class="fa-solid fa-circle-check text-[11px]" aria-hidden="true"></i>
                        <span>Підключено</span>
                    </span>
                    <button type="button" id="profileSettingsGoogleLinkBtn" data-modal-close="profileSettingsModal" data-modal-open="googleLinkModal" class="min-h-10 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer">
                        <span>Підключити Google</span>
                    </button>
                </div>
            </div>

            <div class="flex justify-end pt-2 border-t border-slate-100">
                <button type="button" data-modal-close="profileSettingsModal" class="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer">
                    Закрити
                </button>
            </div>
        </div>
    </div>
</div>
