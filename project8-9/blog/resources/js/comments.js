import { getHeaders, getAuthToken, readResponse } from './api.js';
import { escapeHtml, renderGuestState, showToast } from './ui.js';

let page = 1;
let postId;
let comments = [];

const avatar = author => author?.avatar_url
    ? `<img src="${escapeHtml(author.avatar_url)}" alt="" loading="lazy" class="h-9 w-9 rounded-full object-cover">`
    : `<span class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">${escapeHtml(author?.username?.[0] || '?')}</span>`;

function render() {
    const list = document.getElementById('commentsList');
    if (!list) return;
    list.innerHTML = comments.length ? comments.map(comment => `
        <article class="rounded-xl border border-slate-200 bg-white p-4" data-comment-id="${comment.id}">
            <div class="flex items-center gap-3">${avatar(comment.author)}
                <div><p class="font-semibold text-slate-900">${escapeHtml(comment.author.username)}</p>
                    <time class="text-xs text-slate-500">${new Date(comment.created_at).toLocaleString('uk-UA')}</time></div>
            </div>
            <p class="mt-3 whitespace-pre-wrap break-words text-sm text-slate-700">${escapeHtml(comment.content)}</p>
            ${comment.can_edit ? `<div class="mt-3 flex gap-3 text-sm">
                <button type="button" data-comment-action="edit" class="text-indigo-700 hover:underline">Редагувати</button>
                <button type="button" data-comment-action="delete" class="text-rose-700 hover:underline">Видалити</button></div>` : ''}
        </article>`).join('') : '<p class="text-sm text-slate-500">Коментарів поки немає. Напишіть перший.</p>';
}

export async function loadComments(id, nextPage = 1) {
    postId = id;
    page = nextPage;
    const list = document.getElementById('commentsList');
    if (!list) return;
    if (!getAuthToken()) { renderGuestState(list); return; }
    list.textContent = 'Завантаження коментарів…';
    try {
        const result = await readResponse(await fetch(`/api/posts/${id}/comments?page=${page}`, { headers: getHeaders() }));
        if (postId !== id || !getAuthToken()) return;
        comments = result.data;
        render();
        const more = document.getElementById('commentsMore');
        if (more) more.classList.toggle('hidden', page >= result.meta.last_page);
    } catch (error) {
        if (error.status === 401 && !getAuthToken()) { renderGuestState(list); return; }
        list.textContent = 'Не вдалося завантажити коментарі. Спробуйте ще раз.';
    }
}

export function initComments() {
    document.getElementById('commentsMore')?.addEventListener('click', () => loadComments(postId, page + 1));
    document.getElementById('commentForm')?.addEventListener('submit', async event => {
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
    document.getElementById('commentsList')?.addEventListener('click', async event => {
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
