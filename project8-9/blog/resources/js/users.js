import { fetchUsers, readResponse, getAuthToken } from './api.js';
import { renderListError, renderGuestState, escapeHtml } from './ui.js';
import { renderPagination } from './pagination.js';

let currentUserPage = 1;

export async function loadUsers(page = currentUserPage) {
    currentUserPage = page;
    const container = document.getElementById('usersList');
    const pagination = document.getElementById('usersPagination');
    if (!container) return;
    if (!getAuthToken()) {
        if (pagination) pagination.replaceChildren();
        renderGuestState(container);
        return;
    }
    if (pagination) pagination.innerHTML = '';
    container.innerHTML = '<div class="p-8 text-center text-slate-400 col-span-full">Завантаження...</div>';

    try {
        const res = await fetchUsers(page);
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

        renderPagination(pagination, json.meta || {}, 'page-users', users.length);
    } catch (err) {
        if (err.status === 401 && !getAuthToken()) return;
        renderListError(container, err);
    }
}

export function initUsers() {
    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="page-users"]');
        if (button && !button.disabled) loadUsers(Number(button.dataset.page));
    });
}
