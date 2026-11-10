import { getAuthToken, getCurrentUser, setAuth, updateUserProfile, readResponse } from './api.js';

let globalUiListenersBound = false;
let matchMediaBound = false;

export function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const message = document.getElementById('toastMessage');

    if (!toast || !icon || !message) return;

    icon.innerHTML = isError
        ? '<i class="fa-solid fa-circle-xmark text-rose-500"></i>'
        : '<i class="fa-solid fa-circle-check text-emerald-500"></i>';
    message.innerText = msg;
    toast.classList.remove('translate-y-[-100px]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.add('translate-y-[-100px]', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
    }, 3000);
}

export function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function getUserInitial(user) {
    const source = (user?.username || user?.email || 'U').trim();
    return (source[0] || 'U').toUpperCase();
}

export function isGoogleConnected(user) {
    return Boolean(user?.google_connected ?? user?.google_linked);
}

function setFieldError(id, message = '') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('hidden', !message);
}

function clearProfileErrors() {
    setFieldError('profileUsernameError', '');
    setFieldError('profileBioError', '');
    setFieldError('profileFormError', '');
}

export function syncAvatarModal(user = getCurrentUser(), resetInput = false) {
    const preview = document.getElementById('avatarPreview');
    const placeholder = document.getElementById('avatarPlaceholder');
    const deleteBtn = document.getElementById('avatarDelete');
    const fileInput = document.getElementById('avatarFile');
    const fileNameEl = document.getElementById('avatarFileName');
    const errorEl = document.getElementById('avatarError');
    const form = document.getElementById('avatarForm');
    const saveBtn = document.getElementById('avatarSaveBtn') || form?.querySelector('[type="submit"]');

    if (resetInput) {
        if (fileInput) fileInput.value = '';
        if (fileNameEl) {
            fileNameEl.textContent = '';
            fileNameEl.classList.add('hidden');
        }
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
        }
    }

    const hasPendingFile = Boolean(!resetInput && fileInput?.files?.length);

    if (!hasPendingFile) {
        if (user?.avatar_url) {
            if (preview) {
                preview.src = user.avatar_url;
                preview.classList.remove('hidden');
            }
            placeholder?.classList.add('hidden');
        } else {
            if (preview) {
                preview.removeAttribute('src');
                preview.classList.add('hidden');
            }
            if (placeholder) {
                placeholder.textContent = getUserInitial(user);
                placeholder.classList.remove('hidden');
            }
        }
        if (saveBtn) saveBtn.disabled = true;
    }

    if (deleteBtn) {
        deleteBtn.classList.toggle('hidden', !user?.avatar_url);
    }
}

export function syncProfileSettingsModal(user = getCurrentUser(), resetErrors = false) {
    const usernameInput = document.getElementById('profileUsername');
    const emailInput = document.getElementById('profileEmail');
    const bioInput = document.getElementById('profileBio');
    const googleBadge = document.getElementById('profileSettingsGoogleBadge');
    const googleUnlinked = document.getElementById('profileSettingsGoogleUnlinked');
    const avatarImg = document.getElementById('profileSettingsAvatar');
    const avatarFallback = document.getElementById('profileSettingsAvatarFallback');

    if (usernameInput) usernameInput.value = user?.username || '';
    if (emailInput) emailInput.value = user?.email || '';
    if (bioInput) bioInput.value = user?.user_bio || '';

    if (user?.avatar_url) {
        if (avatarImg) {
            avatarImg.src = user.avatar_url;
            avatarImg.alt = user.username || 'Фото профілю';
            avatarImg.classList.remove('hidden');
        }
        avatarFallback?.classList.add('hidden');
    } else {
        if (avatarImg) {
            avatarImg.removeAttribute('src');
            avatarImg.classList.add('hidden');
        }
        if (avatarFallback) {
            avatarFallback.textContent = getUserInitial(user);
            avatarFallback.classList.remove('hidden');
        }
    }

    if (resetErrors) {
        clearProfileErrors();
    }

    const googleConnected = isGoogleConnected(user);
    googleBadge?.classList.toggle('hidden', !googleConnected);
    googleUnlinked?.classList.toggle('hidden', googleConnected);
}

export function setUserDropdownOpen(open) {
    const button = document.getElementById('userMenuBtn');
    const menu = document.getElementById('userDropdownMenu');
    if (!button || !menu) return;

    menu.classList.toggle('hidden', !open);
    button.setAttribute('aria-expanded', String(open));
    const chevron = button.querySelector('[data-dropdown-chevron]');
    chevron?.classList.toggle('rotate-180', open);
}

export function closeUserDropdown() {
    setUserDropdownOpen(false);
}

function setHeaderMobileMenuOpen(open) {
    const toggle = document.getElementById('headerMenuToggle');
    const menu = document.getElementById('headerMenu');
    if (!toggle || !menu) return;
    if (toggle.classList.contains('hidden')) return;

    const icon = toggle.querySelector('i');
    menu.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    icon?.classList.toggle('fa-bars', !open);
    icon?.classList.toggle('fa-xmark', open);
}

export function openModal(id) {
    if (id === 'avatarModal') {
        syncAvatarModal(getCurrentUser(), true);
    } else if (id === 'profileSettingsModal') {
        syncProfileSettingsModal(getCurrentUser(), true);
    }
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('hidden');
        if (el.classList.contains('modal-backdrop')) {
            el.classList.add('flex');
        }
    }
}

export function closeModal(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('hidden');
    }
    if (id === 'avatarModal') {
        syncAvatarModal(getCurrentUser(), true);
    } else if (id === 'profileSettingsModal') {
        syncProfileSettingsModal(getCurrentUser(), true);
    }
}

function setProfileSaveButtonLoading(button, loading) {
    if (!button) return;
    button.disabled = loading;
    const span = button.querySelector('span');
    if (span) {
        span.textContent = loading ? 'Збереження...' : 'Зберегти зміни';
    } else {
        button.textContent = loading ? 'Збереження...' : 'Зберегти зміни';
    }
}

async function handleProfileFormSubmit(event) {
    event.preventDefault();
    clearProfileErrors();

    const usernameInput = document.getElementById('profileUsername');
    const bioInput = document.getElementById('profileBio');
    const saveBtn = document.getElementById('profileSaveBtn') || event.target.querySelector('[type="submit"]');

    const username = usernameInput ? usernameInput.value.trim() : '';
    const user_bio = bioInput ? bioInput.value.trim() : '';

    if (username.length < 2 || username.length > 255) {
        setFieldError('profileUsernameError', 'Ім’я користувача має містити від 2 до 255 символів.');
        return;
    }

    if (user_bio.length > 1000) {
        setFieldError('profileBioError', 'Біографія не може перевищувати 1000 символів.');
        return;
    }

    setProfileSaveButtonLoading(saveBtn, true);

    try {
        const current = getCurrentUser();
        const response = await updateUserProfile(current?.id, { username, user_bio });
        const payload = await readResponse(response);
        const updatedUser = payload.data || payload.user || payload;

        setAuth(getAuthToken(), { ...current, ...updatedUser });
        renderUserState(getCurrentUser(), getAuthToken());
        closeModal('profileSettingsModal');
        showToast('Профіль оновлено');
    } catch (error) {
        const usernameErr = error.errors?.username?.[0];
        const bioErr = error.errors?.user_bio?.[0];
        if (usernameErr) setFieldError('profileUsernameError', usernameErr);
        if (bioErr) setFieldError('profileBioError', bioErr);
        if (!usernameErr && !bioErr) {
            setFieldError('profileFormError', error.message);
        }
        showToast(usernameErr || bioErr || error.message, true);
    } finally {
        setProfileSaveButtonLoading(saveBtn, false);
    }
}

function bindGlobalUiListeners() {
    if (globalUiListenersBound) return;
    globalUiListenersBound = true;

    document.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;

        // Profile dropdown toggle & actions
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdownMenu = document.getElementById('userDropdownMenu');
        const userDropdownContainer = document.getElementById('userDropdownContainer');

        if (userMenuBtn && target.closest('#userMenuBtn')) {
            const isExpanded = userMenuBtn.getAttribute('aria-expanded') === 'true';
            setUserDropdownOpen(!isExpanded);
            return;
        }

        if (userDropdownMenu && !userDropdownMenu.classList.contains('hidden')) {
            if (!userDropdownContainer?.contains(target) || target.closest('[role="menuitem"], [data-modal-open], #logoutBtn')) {
                setUserDropdownOpen(false);
            }
        }

        // Mobile guest header menu toggle
        const headerToggle = document.getElementById('headerMenuToggle');
        if (headerToggle && !headerToggle.classList.contains('hidden')) {
            if (target.closest('#headerMenuToggle')) {
                const isOpen = headerToggle.getAttribute('aria-expanded') === 'true';
                setHeaderMobileMenuOpen(!isOpen);
            } else {
                const header = headerToggle.closest('header');
                if ((header && !header.contains(target)) || target.closest('[data-modal-open], #logoutBtn')) {
                    setHeaderMobileMenuOpen(false);
                }
            }
        }

        // Modals open / close / backdrop click
        const closeButton = target.closest('[data-modal-close]');
        const openButton = target.closest('[data-modal-open]');
        if (closeButton) closeModal(closeButton.dataset.modalClose);
        if (openButton) openModal(openButton.dataset.modalOpen);
        if (target.classList.contains('modal-backdrop')) {
            if (target.id) {
                closeModal(target.id);
            } else {
                target.classList.add('hidden');
            }
        }
    });

    document.addEventListener('input', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        if (target.id === 'profileUsername') {
            setFieldError('profileUsernameError', '');
            setFieldError('profileFormError', '');
        } else if (target.id === 'profileBio') {
            setFieldError('profileBioError', '');
            setFieldError('profileFormError', '');
        }
    });

    document.addEventListener('submit', (event) => {
        const form = event.target instanceof HTMLFormElement ? event.target : null;
        if (form?.id === 'profileSettingsForm') {
            handleProfileFormSubmit(event);
        }
    });

    document.addEventListener('keydown', (event) => {
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdownMenu = document.getElementById('userDropdownMenu');
        const isDropdownOpen = userMenuBtn?.getAttribute('aria-expanded') === 'true' && userDropdownMenu && !userDropdownMenu.classList.contains('hidden');

        if (event.key === 'Escape') {
            if (isDropdownOpen) {
                event.preventDefault();
                setUserDropdownOpen(false);
                userMenuBtn.focus();
                return;
            }

            const headerToggle = document.getElementById('headerMenuToggle');
            if (headerToggle && !headerToggle.classList.contains('hidden') && headerToggle.getAttribute('aria-expanded') === 'true') {
                setHeaderMobileMenuOpen(false);
                headerToggle.focus();
            }
            return;
        }

        if (!userMenuBtn || !userDropdownMenu) return;

        const items = Array.from(userDropdownMenu.querySelectorAll('[role="menuitem"]:not([disabled])'));
        if (!items.length) return;

        if (document.activeElement === userMenuBtn && (event.key === 'ArrowDown' || event.key === ' Down')) {
            event.preventDefault();
            setUserDropdownOpen(true);
            items[0].focus();
            return;
        }

        if (isDropdownOpen && userDropdownMenu.contains(document.activeElement)) {
            const currentIndex = items.indexOf(document.activeElement);
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                items[nextIndex].focus();
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                items[prevIndex].focus();
            } else if (event.key === 'Home') {
                event.preventDefault();
                items[0].focus();
            } else if (event.key === 'End') {
                event.preventDefault();
                items[items.length - 1].focus();
            }
        }
    });
}

function syncHeaderLayoutForAuth(authenticated) {
    const toggle = document.getElementById('headerMenuToggle');
    const menu = document.getElementById('headerMenu');

    if (authenticated) {
        if (toggle) {
            toggle.classList.add('hidden');
            toggle.classList.remove('inline-flex');
            toggle.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        }
        if (menu) {
            menu.classList.remove('hidden', 'basis-full', 'border-t', 'border-slate-200', 'py-3', 'order-3');
            menu.classList.add('order-2', 'flex', 'items-center', 'shrink-0');
        }
    } else {
        if (toggle) {
            toggle.classList.remove('hidden');
            toggle.classList.add('inline-flex');
            toggle.hidden = false;
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Відкрити меню');
            const icon = toggle.querySelector('i');
            icon?.classList.add('fa-bars');
            icon?.classList.remove('fa-xmark');
        }
        if (menu) {
            menu.classList.remove('order-2', 'shrink-0');
            menu.classList.add('order-3', 'hidden', 'basis-full', 'border-t', 'border-slate-200', 'py-3');
        }
    }
}

export function renderUserState(currentUser, authToken) {
    bindGlobalUiListeners();

    const stateDiv = document.getElementById('userState');
    const authenticated = Boolean(authToken);

    syncHeaderLayoutForAuth(authenticated);

    if (!stateDiv) return;

    if (authenticated) {
        const user = currentUser || { username: 'Користувач', email: '' };
        const username = user.username || 'Користувач';
        const email = user.email || 'Авторизований акаунт';
        const initial = getUserInitial(user);
        const googleConnected = isGoogleConnected(user);
        const showGoogleLink = !googleConnected && user.google_linking_supported !== false;

        const triggerAvatarMarkup = user.avatar_url
            ? `<img id="headerUserAvatar" src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(username)}" class="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-indigo-100 shadow-2xs">`
            : `<span id="headerUserAvatarFallback" data-avatar-fallback class="h-9 w-9 shrink-0 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase ring-2 ring-indigo-50 shadow-inner select-none">${escapeHtml(initial)}</span>`;

        const menuHeaderAvatarMarkup = user.avatar_url
            ? `<img src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(username)}" class="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100">`
            : `<span class="h-10 w-10 shrink-0 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase ring-2 ring-slate-100 select-none">${escapeHtml(initial)}</span>`;

        stateDiv.innerHTML = `
            <div id="userDropdownContainer" class="relative inline-flex items-center">
                <button
                    id="userMenuBtn"
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded="false"
                    aria-controls="userDropdownMenu"
                    aria-label="Меню профілю ${escapeHtml(username)}"
                    class="group inline-flex items-center gap-1.5 rounded-full p-1 pr-2 text-sm font-medium text-slate-700 hover:bg-slate-100 active:bg-slate-200/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors cursor-pointer"
                >
                    ${triggerAvatarMarkup}
                    <i data-dropdown-chevron class="fa-solid fa-chevron-down text-[10px] text-slate-400 group-hover:text-slate-600 transition-transform duration-200" aria-hidden="true"></i>
                </button>

                <div
                    id="userDropdownMenu"
                    role="menu"
                    aria-labelledby="userMenuBtn"
                    aria-label="Меню облікового запису"
                    class="hidden absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-72 origin-top-right rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200/90 z-50"
                >
                    <div class="flex items-center gap-3 px-3 py-3 border-b border-slate-100 mb-1">
                        ${menuHeaderAvatarMarkup}
                        <div class="min-w-0 flex-1">
                            <p id="userDropdownName" class="text-sm font-semibold text-slate-900 truncate">${escapeHtml(username)}</p>
                            <p id="userDropdownEmail" class="text-xs text-slate-500 truncate">${escapeHtml(email)}</p>
                        </div>
                    </div>

                    <div class="space-y-0.5 py-1" role="none">
                        <button
                            type="button"
                            id="profileSettingsMenuBtn"
                            role="menuitem"
                            data-modal-open="profileSettingsModal"
                            class="w-full min-h-11 flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-600 focus-visible:bg-indigo-50/70 focus-visible:text-indigo-600 focus-visible:outline-hidden rounded-xl transition-colors cursor-pointer text-left"
                        >
                            <i class="fa-solid fa-user-gear w-4 text-center text-slate-400" aria-hidden="true"></i>
                            <span>Налаштування профілю</span>
                        </button>

                        <button
                            type="button"
                            id="changeAvatarMenuBtn"
                            role="menuitem"
                            data-modal-open="avatarModal"
                            class="w-full min-h-11 flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-600 focus-visible:bg-indigo-50/70 focus-visible:text-indigo-600 focus-visible:outline-hidden rounded-xl transition-colors cursor-pointer text-left"
                        >
                            <i class="fa-solid fa-camera w-4 text-center text-slate-400" aria-hidden="true"></i>
                            <span>Змінити фотографію</span>
                        </button>

                        ${showGoogleLink ? `
                        <button
                            type="button"
                            id="googleLinkMenuBtn"
                            role="menuitem"
                            data-modal-open="googleLinkModal"
                            class="w-full min-h-11 flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-600 focus-visible:bg-indigo-50/70 focus-visible:text-indigo-600 focus-visible:outline-hidden rounded-xl transition-colors cursor-pointer text-left"
                        >
                            <i class="fa-brands fa-google w-4 text-center text-slate-400" aria-hidden="true"></i>
                            <span>Підключити Google</span>
                        </button>
                        ` : ''}
                    </div>

                    <div class="my-1 border-t border-slate-100" role="separator"></div>

                    <div class="pt-1" role="none">
                        <button
                            id="logoutBtn"
                            type="button"
                            role="menuitem"
                            title="Вийти з акаунту"
                            class="w-full min-h-11 flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus-visible:bg-rose-50 focus-visible:text-rose-700 focus-visible:outline-hidden rounded-xl transition-colors cursor-pointer text-left"
                        >
                            <i class="fa-solid fa-right-from-bracket w-4 text-center text-rose-500" aria-hidden="true"></i>
                            <span>Вийти</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        syncAvatarModal(user, false);
        syncProfileSettingsModal(user, false);
    } else {
        stateDiv.innerHTML = `
            <div class="flex flex-wrap items-center gap-2">
                <button type="button" data-modal-open="loginModal" class="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer">
                    <i class="fa-solid fa-right-to-bracket text-slate-400"></i>
                    <span>Увійти</span>
                </button>
                <button type="button" data-modal-open="registerModal" class="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-lg transition-colors cursor-pointer">
                    <i class="fa-solid fa-user-plus text-[11px]"></i>
                    <span>Реєстрація</span>
                </button>
            </div>
        `;

        syncAvatarModal(null, true);
        syncProfileSettingsModal(null, true);
    }
}

export function initHeaderMenu() {
    bindGlobalUiListeners();
    if (!matchMediaBound) {
        matchMediaBound = true;
        window.matchMedia?.('(min-width: 64rem)')?.addEventListener?.('change', () => setHeaderMobileMenuOpen(false));
    }
}

export function initModals() {
    bindGlobalUiListeners();
}

export function renderGuestState(container) {
    if (!container) return;
    container.innerHTML = `
        <div class="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-2xs col-span-full">
            <h2 class="text-lg font-semibold text-slate-900 mb-2">Ласкаво просимо до Блогу UA</h2>
            <p class="text-sm text-slate-600 mb-5">Увійдіть або зареєструйтеся, щоб переглядати статті.</p>
            <div class="flex flex-wrap justify-center gap-3">
                <button type="button" data-modal-open="loginModal" class="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Увійти</button>
                <button type="button" data-modal-open="registerModal" class="rounded-xl border border-indigo-200 px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Зареєструватися</button>
            </div>
        </div>
    `;
}

export function renderListError(container, error) {
    if (error.status === 401) {
        container.innerHTML = `
            <div class="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center col-span-full">
                <h3 class="font-bold text-base mb-1">Потрібна авторизація</h3>
                <p class="text-sm mb-4">Для перегляду даних увійдіть у систему.</p>
                <button type="button" data-modal-open="loginModal" class="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg">Увійти</button>
            </div>
        `;
        return;
    }
    container.innerHTML = `<div class="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl col-span-full">Помилка завантаження: ${escapeHtml(error.message)}</div>`;
}
