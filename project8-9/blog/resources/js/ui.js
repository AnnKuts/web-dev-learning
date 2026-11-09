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

export function openModal(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('hidden');
    }
}

export function closeModal(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('hidden');
    }
}

export function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function renderUserState(currentUser, authToken) {
    const stateDiv = document.getElementById('userState');
    if (!stateDiv) return;

    if (authToken && currentUser) {
        stateDiv.innerHTML = `
            <div class="flex w-full min-w-0 lg:w-auto items-center space-x-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 shadow-2xs">
                <div class="w-6 h-6 shrink-0 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                    ${escapeHtml((currentUser.username || 'U')[0])}
                </div>
                <span class="min-w-0 flex-1 text-xs font-semibold text-slate-800 lg:max-w-[120px] truncate">${escapeHtml(currentUser.username)}</span>
                <button id="logoutBtn" type="button" title="Вийти з акаунту" class="shrink-0 inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-all active:scale-95 cursor-pointer">
                    <i class="fa-solid fa-right-from-bracket text-[11px]"></i>
                    <span>Вийти</span>
                </button>
            </div>
        `;
    } else if (authToken) {
        stateDiv.innerHTML = `
            <div class="flex w-full min-w-0 lg:w-auto items-center space-x-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 shadow-2xs">
                <div class="w-6 h-6 shrink-0 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    <i class="fa-solid fa-key text-[10px]"></i>
                </div>
                <span class="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">Токен активний</span>
                <button id="logoutBtn" type="button" title="Вийти" class="shrink-0 inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition-all active:scale-95 cursor-pointer">
                    <i class="fa-solid fa-right-from-bracket text-[11px]"></i>
                    <span>Вийти</span>
                </button>
            </div>
        `;
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
    }
}

export function initHeaderMenu() {
    const toggle = document.getElementById('headerMenuToggle');
    const menu = document.getElementById('headerMenu');
    if (!toggle || !menu) return;
    const header = toggle.closest('header');
    const icon = toggle.querySelector('i');

    function setOpen(open) {
        menu.classList.toggle('hidden', !open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
        icon.classList.toggle('fa-bars', !open);
        icon.classList.toggle('fa-xmark', open);
    }

    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('click', (event) => {
        if (!header.contains(event.target) || event.target.closest('[data-modal-open], #logoutBtn')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            setOpen(false);
            toggle.focus();
        }
    });
    window.matchMedia('(min-width: 64rem)').addEventListener('change', () => setOpen(false));
}

export function initModals() {
    document.addEventListener('click', (event) => {
        const openButton = event.target.closest('[data-modal-open]');
        const closeButton = event.target.closest('[data-modal-close]');
        if (openButton) openModal(openButton.dataset.modalOpen);
        if (closeButton) closeModal(closeButton.dataset.modalClose);
        if (event.target.classList.contains('modal-backdrop')) event.target.classList.add('hidden');
    });
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
