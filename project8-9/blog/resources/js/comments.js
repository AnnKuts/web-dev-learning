import { getHeaders, getAuthToken, readResponse } from './api.js';
import { escapeHtml, showToast } from './ui.js';

let page = 1;
let postId;
let comments = [];

const avatar = author => author?.avatar_url
    ? `<img src="${escapeHtml(author.avatar_url)}" alt="" loading="lazy" class="h-9 w-9 shrink-0 rounded-full object-cover">`
    : `<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 uppercase">${escapeHtml(author?.username?.[0] || '?')}</span>`;

function render() {
    const list = document.getElementById('commentsList');
    if (!list) return;
    list.innerHTML = comments.length ? comments.map(comment => `
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition" data-comment-id="${comment.id}">
            <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                    ${avatar(comment.author)}
                    <div class="min-w-0 flex-1">
                        <p class="truncate font-semibold text-slate-900 text-sm">${escapeHtml(comment.author?.username || 'Невідомий')}</p>
                        <time class="block text-xs text-slate-500">${new Date(comment.created_at).toLocaleString('uk-UA')}</time>
                    </div>
                </div>
                ${comment.can_edit ? `
                <div class="flex items-center space-x-2 shrink-0">
                    <button type="button" data-comment-action="edit" aria-label="Редагувати коментар" title="Редагувати коментар" class="action-icon-btn action-icon-btn-edit inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition cursor-pointer disabled:opacity-50">
                        <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                    </button>
                    <button type="button" data-comment-action="delete" aria-label="Видалити коментар" title="Видалити коментар" class="action-icon-btn action-icon-btn-delete inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 transition cursor-pointer disabled:opacity-50">
                        <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                    </button>
                </div>` : ''}
            </div>
            <p class="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">${escapeHtml(comment.content)}</p>
        </article>`).join('') : '<p class="text-sm text-slate-500">Коментарів поки немає. Напишіть перший.</p>';
}

export async function loadComments(id, nextPage = 1) {
    postId = id;
    page = nextPage;
    const list = document.getElementById('commentsList');
    if (!list) return;
    if (!getAuthToken()) {
        list.replaceChildren();
        document.getElementById('commentsSection')?.classList.add('hidden');
        return;
    }
    document.getElementById('commentsSection')?.classList.remove('hidden');
    list.textContent = 'Завантаження коментарів…';
    try {
        const result = await readResponse(await fetch(`/api/posts/${id}/comments?page=${page}`, { headers: getHeaders() }));
        if (postId !== id || !getAuthToken()) return;
        comments = result.data;
        render();
        const more = document.getElementById('commentsMore');
        if (more) more.classList.toggle('hidden', page >= result.meta.last_page);
    } catch (error) {
        if (error.status === 401 && !getAuthToken()) {
            list.replaceChildren();
            document.getElementById('commentsSection')?.classList.add('hidden');
            return;
        }
        list.textContent = 'Не вдалося завантажити коментарі. Спробуйте ще раз.';
    }
}

export function initComments() {
    const moreBtn = document.getElementById('commentsMore');
    if (moreBtn && moreBtn.dataset.bound !== 'true') {
        moreBtn.dataset.bound = 'true';
        moreBtn.addEventListener('click', () => loadComments(postId, page + 1));
    }

    const form = document.getElementById('commentForm');
    if (form && form.dataset.bound !== 'true') {
        form.dataset.bound = 'true';
        form.addEventListener('submit', async event => {
            event.preventDefault();
            const field = document.getElementById('commentContent');
            const button = event.currentTarget.querySelector('[type=submit]');
            button.disabled = true;
            try {
                const result = await readResponse(await fetch(`/api/posts/${postId}/comments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ content: field.value.trim() }) }));
                field.value = '';
                comments.push(result.data);
                render();
            } catch (error) { showToast(error.message, true); }
            finally { button.disabled = false; }
        });
    }

    const list = document.getElementById('commentsList');
    if (list && list.dataset.bound !== 'true') {
        list.dataset.bound = 'true';
        list.addEventListener('click', async event => {
            const button = event.target.closest('[data-comment-action]');
            if (!button) return;
            const comment = comments.find(item => item.id === Number(button.closest('[data-comment-id]').dataset.commentId));
            if (!comment?.can_edit) return;
            const content = button.dataset.commentAction === 'edit' ? prompt('Змініть коментар', comment.content) : null;
            if (button.dataset.commentAction === 'edit' && (content === null || !content.trim())) return;
            if (button.dataset.commentAction === 'delete' && !confirm('Видалити коментар?')) return;
            button.disabled = true;
            try {
                await readResponse(await fetch(`/api/posts/${postId}/comments/${comment.id}`, {
                    method: content === null ? 'DELETE' : 'PUT', headers: getHeaders(),
                    ...(content === null ? {} : { body: JSON.stringify({ content: content.trim() }) }),
                }));
                await loadComments(postId, page);
            } catch (error) { showToast(error.message, true); }
            finally { button.disabled = false; }
        });
    }
}
