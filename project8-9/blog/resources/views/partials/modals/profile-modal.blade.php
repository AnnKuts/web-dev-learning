<div id="profileSettingsModal" role="dialog" aria-modal="true" aria-labelledby="profileSettingsTitle" class="modal-backdrop fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
    <div class="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white p-5 sm:p-6 shadow-xl relative">
        <div class="flex items-start justify-between gap-3 mb-5">
            <div class="flex items-center gap-3 min-w-0">
                <div class="relative shrink-0">
                    <img id="profileSettingsAvatar" alt="Фото профілю" class="hidden h-12 w-12 rounded-full object-cover ring-2 ring-indigo-100 shadow-2xs">
                    <div id="profileSettingsAvatarFallback" class="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base uppercase ring-2 ring-indigo-50 shadow-inner select-none">
                        U
                    </div>
                </div>
                <div class="min-w-0">
                    <h2 id="profileSettingsTitle" class="text-lg font-bold text-slate-900">Налаштування профілю</h2>
                    <p class="text-xs text-slate-500 mt-0.5">Керування вашим обліковим записом</p>
                </div>
            </div>
            <button type="button" data-modal-close="profileSettingsModal" aria-label="Закрити" class="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors cursor-pointer">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
        </div>

        <form id="profileSettingsForm" class="space-y-4" novalidate>
            <div>
                <label for="profileUsername" class="block text-sm font-medium text-slate-700 mb-1">
                    Ім'я користувача <span class="text-rose-500">*</span>
                </label>
                <input
                    type="text"
                    id="profileUsername"
                    name="username"
                    required
                    minlength="2"
                    maxlength="255"
                    autocomplete="username"
                    placeholder="Введіть ім'я користувача"
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden transition"
                >
                <p id="profileUsernameError" class="hidden text-xs font-medium text-rose-600 mt-1"></p>
            </div>

            <div>
                <label for="profileEmail" class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                    type="email"
                    id="profileEmail"
                    name="email"
                    readonly
                    aria-readonly="true"
                    tabindex="-1"
                    class="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-500 cursor-not-allowed select-all focus:outline-hidden"
                >
                <p class="text-xs text-slate-400 mt-1">Email-адреса використовується для входу та не підлягає зміні.</p>
            </div>

            <div>
                <label for="profileBio" class="block text-sm font-medium text-slate-700 mb-1">Біографія</label>
                <textarea
                    id="profileBio"
                    name="user_bio"
                    rows="3"
                    maxlength="1000"
                    placeholder="Розкажіть коротко про себе..."
                    class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden transition"
                ></textarea>
                <p id="profileBioError" class="hidden text-xs font-medium text-rose-600 mt-1"></p>
            </div>

            <div class="flex items-center justify-between gap-3 py-2.5 px-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div class="flex items-center gap-2 min-w-0">
                    <i class="fa-brands fa-google text-slate-500 text-sm shrink-0" aria-hidden="true"></i>
                    <span class="text-xs font-medium text-slate-700 truncate">Обліковий запис Google</span>
                </div>
                <div class="shrink-0">
                    <span id="profileSettingsGoogleBadge" class="hidden inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <i class="fa-solid fa-circle-check text-[11px]" aria-hidden="true"></i>
                        <span>Підключено</span>
                    </span>
                    <span id="profileSettingsGoogleUnlinked" class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        <span>Не підключено</span>
                    </span>
                </div>
            </div>

            <p id="profileFormError" role="alert" class="hidden rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600"></p>

            <div class="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                    type="button"
                    data-modal-close="profileSettingsModal"
                    class="min-h-11 px-4 py-2 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors cursor-pointer"
                >
                    Скасувати
                </button>
                <button
                    type="submit"
                    id="profileSaveBtn"
                    class="min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all cursor-pointer disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                >
                    <span>Зберегти зміни</span>
                </button>
            </div>
        </form>
    </div>
</div>
