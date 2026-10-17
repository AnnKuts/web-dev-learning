import { fetchPosts, fetchPost, deletePost, readResponse } from './api.js';
import { renderListError, escapeHtml, showToast } from './ui.js';

let currentPostPage = 1;
const currentPostsMap = new Map();
let postRequest;

function getPostExcerpt(description) {
    const characters = Array.from(description.replace(/\s+/g, ' ').trim());
    return characters.length > 240 ? `${characters.slice(0, 240).join('').trimEnd()}…` : characters.join('');
}

export async function loadPost(id) {
    postRequest?.abort();
    const request = new AbortController();
    postRequest = request;
    const header = document.getElementById('viewPostHeader');
    const description = document.getElementById('viewPostDescription');
    const meta = document.getElementById('viewPostMeta');
    const tags = document.getElementById('viewPostTags');
    header.textContent = 'Завантаження статті…';
    description.textContent = '';
    meta.textContent = '';
    tags.textContent = '';
    try {
        const json = await readResponse(await fetchPost(id, request.signal));
        if (request.signal.aborted) return;
        const post = json.data;
        header.textContent = post.header;
        description.textContent = post.description;
        meta.innerHTML = `
            <span><i class="fa-solid fa-user mr-1" aria-hidden="true"></i>${escapeHtml(post.user?.username || 'Невідомий')}</span>
            <span><i class="fa-regular fa-clock mr-1" aria-hidden="true"></i>${new Date(post.created_at).toLocaleString('uk-UA')}</span>
        `;
        tags.textContent = (post.tags || []).map(tag => `#${tag.tag_name}`).join(' ');
    } catch (error) {
        if (request.signal.aborted) return;
        header.textContent = 'Не вдалося завантажити статтю';
        if (error.status === 404) error.message = 'Статтю не знайдено. Можливо, її видалено.';
        renderListError(description, error);
    }
}

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
                    <div class="flex-1 min-w-0">
                        <h3 class="text-lg font-bold text-slate-900 mb-2 break-words"><a href="/posts/${post.id}" class="hover:text-indigo-600">${escapeHtml(post.header)}</a></h3>
                        <p class="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-3 break-words">${escapeHtml(getPostExcerpt(post.description))}</p>
                        <a href="/posts/${post.id}" class="inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline mb-4">Читати повністю</a>
                        
                        <div class="flex flex-wrap items-center gap-2 mb-4">
                            ${(post.tags || []).map(t => `
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    #${escapeHtml(t.tag_name)}
                                </span>
                            `).join('')}
                        </div>

                        <div class="flex items-center space-x-3 text-xs text-slate-400">
                            <span class="font-medium text-slate-600"><i class="fa-solid fa-user mr-1 text-slate-500"></i>${escapeHtml(post.user?.username || 'Невідомий')}</span>
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
                    <button type="button" data-action="page-posts" data-page="${currentPostPage - 1}" ${currentPostPage <= 1 ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}><i class="fa-solid fa-chevron-left mr-1" aria-hidden="true"></i> Попередня</button>
                    <button type="button" data-action="page-posts" data-page="${currentPostPage + 1}" ${currentPostPage >= (meta.last_page || 1) ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Наступна <i class="fa-solid fa-chevron-right ml-1" aria-hidden="true"></i></button>
                </div>
            `;
        }
    } catch (err) {
        renderListError(container, err);
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
