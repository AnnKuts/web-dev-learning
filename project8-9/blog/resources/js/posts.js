import { fetchPosts, fetchPost, deletePost, readResponse, getAuthToken } from './api.js';
import { renderListError, renderGuestState, escapeHtml, showToast } from './ui.js';
import { renderPagination } from './pagination.js';

let currentPostPage = 1;
const currentPostsMap = new Map();
let postRequest;
let postsRequest;

export function clearPostTagFilter() {
    const url = new URL(window.location.href);
    url.searchParams.delete('tag');
    window.history.replaceState(null, '', url);
    document.getElementById('postTagFilter')?.classList.add('hidden');
}

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
    if (!getAuthToken()) {
        postRequest?.abort();
        header.textContent = '';
        meta.textContent = '';
        tags.textContent = '';
        renderGuestState(description);
        return;
    }
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
        tags.innerHTML = (post.tags || []).map(tag => `<a href="/?tag=${tag.id}" data-action="filter-tag" class="hover:underline">#${escapeHtml(tag.tag_name)}</a>`).join(' ');
    } catch (error) {
        if (request.signal.aborted) return;
        if (error.status === 401 && !getAuthToken()) {
            header.textContent = '';
            meta.textContent = '';
            tags.textContent = '';
            renderGuestState(description);
            return;
        }
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

    postsRequest?.abort();
    if (!getAuthToken()) {
        currentPostsMap.clear();
        if (pagination) pagination.replaceChildren();
        renderGuestState(container);
        return;
    }
    const request = new AbortController();
    postsRequest = request;
    const query = document.getElementById('postSearch')?.value.trim() || '';
    const tagId = new URLSearchParams(window.location.search).get('tag');
    const tagFilter = document.getElementById('postTagFilter');
    const tagLabel = document.getElementById('postTagLabel');
    tagFilter?.classList.toggle('hidden', !tagId);
    if (tagLabel) {
        tagLabel.textContent = tagId ? 'Тег' : '';
        tagLabel.removeAttribute('title');
    }

    currentPostsMap.clear();
    if (pagination) pagination.innerHTML = '';
    container.innerHTML = '<div class="p-8 text-center text-slate-400">Завантаження статей...</div>';

    try {
        const res = await fetchPosts(page, query, request.signal, tagId);
        const json = await readResponse(res);
        if (request.signal.aborted) return;
        if (tagLabel && json.filter_tag) {
            tagLabel.textContent = `#${json.filter_tag.tag_name}`;
            tagLabel.title = tagLabel.textContent;
        }
        const posts = json.data || [];
        currentPostsMap.clear();
        posts.forEach(p => currentPostsMap.set(p.id, p));

        if (posts.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">${query ? 'За цим заголовком статей не знайдено.' : tagId ? 'За цим тегом статей поки немає.' : 'Статей поки немає. Створіть першу!'}</div>`;
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
                                <a href="/?tag=${t.id}" data-action="filter-tag" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100">
                                    #${escapeHtml(t.tag_name)}
                                </a>
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

        renderPagination(pagination, json.meta || {}, 'page-posts', posts.length);
    } catch (err) {
        if (request.signal.aborted) return;
        if (err.status === 401 && !getAuthToken()) { renderGuestState(container); return; }
        renderListError(container, err);
    }
}

export function initPosts(onEdit, onTagSelected) {
    document.getElementById('postSearch')?.addEventListener('input', () => loadPosts(1));
    document.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-action]');
        if (!button || button.disabled) return;
        if (button.dataset.action === 'filter-tag') {
            if (document.getElementById('postDetail') || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            window.history.replaceState(null, '', button.href);
            document.getElementById('postSearch').value = '';
            onTagSelected();
            return;
        }
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
