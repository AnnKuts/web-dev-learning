import { fetchPosts, deletePost, readResponse } from './api.js';
import { escapeHtml, showToast } from './ui.js';

let currentPostPage = 1;
const currentPostsMap = new Map();

export async function loadPosts(page = currentPostPage) {
    currentPostPage = page;
    const container = document.getElementById('postsList');
    const pagination = document.getElementById('postsPagination');
    if (!container) return;

    currentPostsMap.clear();
    if (pagination) pagination.innerHTML = '';
    container.innerHTML = '<div class="p-8 text-center text-slate-400">Завантаження статей...</div>';

    try {
        const res = await fetchPosts(page);
        if (res.status === 401) {
            container.innerHTML = `
                <div class="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center">
                    <h3 class="font-bold text-base mb-1">Потрібна авторизація</h3>
                    <p class="text-sm mb-4">Для перегляду та взаємодії зі статтями потрібен Bearer токен або включений DEV_AUTH_BYPASS.</p>
                    <button type="button" data-modal-open="loginModal" class="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg">Увійти</button>
                </div>
            `;
            if (pagination) pagination.innerHTML = '';
            return;
        }

        const json = await readResponse(res);
        const posts = json.data || [];
        currentPostsMap.clear();
        posts.forEach(p => currentPostsMap.set(p.id, p));

        if (posts.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">Статей поки немає. Створіть першу!</div>';
            if (pagination) pagination.innerHTML = '';
            return;
        }

        container.innerHTML = posts.map(post => `
            <article class="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:shadow-md transition">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-slate-900 mb-2">${escapeHtml(post.header)}</h3>
                        <p class="text-sm text-slate-600 whitespace-pre-line leading-relaxed mb-4">${escapeHtml(post.description)}</p>
                        
                        <div class="flex flex-wrap items-center gap-2 mb-4">
                            ${(post.tags || []).map(t => `
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    #${escapeHtml(t.tag_name)}
                                </span>
                            `).join('')}
                        </div>

                        <div class="flex items-center space-x-3 text-xs text-slate-400">
                            <span class="font-medium text-slate-600"><i class="fa-solid fa-user mr-1 text-slate-500"></i>${escapeHtml(post.user?.username || 'Невідомий')}</span>
                            <span>•</span>
                            <span><i class="fa-regular fa-clock mr-1 text-slate-400"></i>${new Date(post.created_at).toLocaleString('uk-UA')}</span>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2 shrink-0">
                        <button type="button" data-action="edit-post" data-id="${post.id}" class="p-2 text-slate-400 hover:text-indigo-600 transition" title="Редагувати">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" data-action="delete-post" data-id="${post.id}" class="p-2 text-slate-400 hover:text-rose-600 transition" title="Видалити">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </article>
        `).join('');

        const meta = json.meta || {};
        if (pagination) {
            pagination.innerHTML = `
                <div class="text-xs text-slate-500 font-medium">Сторінка ${meta.current_page || 1} з ${meta.last_page || 1} (Всього: ${meta.total || posts.length})</div>
                <div class="flex space-x-2">
                    <button type="button" data-action="page-posts" data-page="${currentPostPage - 1}" ${currentPostPage <= 1 ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Попередня</button>
                    <button type="button" data-action="page-posts" data-page="${currentPostPage + 1}" ${currentPostPage >= (meta.last_page || 1) ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Наступна</button>
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = `<div class="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl">Помилка завантаження: ${escapeHtml(err.message)}</div>`;
    }
}

export function initPosts(onEdit) {
    document.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-action]');
        if (!button || button.disabled) return;
        const id = Number(button.dataset.id);
        if (button.dataset.action === 'edit-post' && currentPostsMap.has(id)) {
            onEdit(currentPostsMap.get(id));
        }
        if (button.dataset.action === 'page-posts') loadPosts(Number(button.dataset.page));
        if (button.dataset.action !== 'delete-post' || !confirm('Ви впевнені, що хочете видалити цю статтю?')) return;
        try {
            await readResponse(await deletePost(id));
            showToast('Статтю видалено!');
            loadPosts();
        } catch (error) {
            showToast(error.message, true);
        }
    });
}
