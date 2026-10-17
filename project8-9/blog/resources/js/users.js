import { fetchUsers, readResponse } from './api.js';
import { escapeHtml } from './ui.js';

let currentUserPage = 1;

export async function loadUsers(page = currentUserPage) {
    currentUserPage = page;
    const container = document.getElementById('usersList');
    const pagination = document.getElementById('usersPagination');
    if (!container) return;
    if (pagination) pagination.innerHTML = '';
    container.innerHTML = '<div class="p-8 text-center text-slate-400 col-span-full">Завантаження...</div>';

    try {
        const res = await fetchUsers(page);
        if (res.status === 401) {
            container.innerHTML = `<div class="p-6 text-center text-amber-700 bg-amber-50 rounded-2xl col-span-full">Потрібна авторизація для перегляду користувачів.</div>`;
            if (pagination) pagination.innerHTML = '';
            return;
        }
        const json = await readResponse(res);
        const users = json.data || [];

        if (users.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-slate-400 col-span-full bg-white border border-slate-200 rounded-2xl">Користувачів не знайдено.</div>';
            if (pagination) pagination.innerHTML = '';
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div class="flex items-center space-x-3 mb-3">
                    <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-indigo-600">
                        ${escapeHtml((user.username || 'U')[0].toUpperCase())}
                    </div>
                    <div class="overflow-hidden">
                        <h4 class="font-bold text-slate-900 text-sm truncate">${escapeHtml(user.username)}</h4>
                        <p class="text-xs text-slate-400 truncate">${escapeHtml(user.email)}</p>
                    </div>
                </div>
                <p class="text-xs text-slate-600 line-clamp-2 min-h-8">${escapeHtml(user.user_bio || 'Біографія відсутня.')}</p>
            </div>
        `).join('');

        const meta = json.meta || {};
        if (pagination) {
            pagination.innerHTML = `
                <div class="text-xs text-slate-500 font-medium">Сторінка ${meta.current_page || 1} з ${meta.last_page || 1} (Всього: ${meta.total || users.length})</div>
                <div class="flex space-x-2">
                    <button type="button" data-action="page-users" data-page="${currentUserPage - 1}" ${currentUserPage <= 1 ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Попередня</button>
                    <button type="button" data-action="page-users" data-page="${currentUserPage + 1}" ${currentUserPage >= (meta.last_page || 1) ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Наступна</button>
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = `<div class="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl col-span-full">Помилка: ${escapeHtml(err.message)}</div>`;
    }
}

export function initUsers() {
    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="page-users"]');
        if (button && !button.disabled) loadUsers(Number(button.dataset.page));
    });
}
