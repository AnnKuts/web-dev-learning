import { getHeaders, getAuthToken, readResponse } from './api.js';
import { escapeHtml, showToast } from './ui.js';

let page = 1;
let postId;
let comments = [];
let editingCommentId = null;

const avatar = author => author?.avatar_url
    ? `<img src="${escapeHtml(author.avatar_url)}" alt="" loading="lazy" class="h-9 w-9 shrink-0 rounded-full object-cover">`
    : `<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 uppercase">${escapeHtml(author?.username?.[0] || '?')}</span>`;

function render() {
    const list = document.getElementById('commentsList');
    if (!list) return;
    list.innerHTML = comments.length ? comments.map(comment => {
        const isEditing = comment.can_edit && editingCommentId === comment.id;
        return `
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
                    <button type="button" data-comment-action="edit" aria-label="Редагувати коментар" title="Редагувати коментар" class="action-icon-btn action-icon-btn-edit inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg p-2 ${isEditing ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'} active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition cursor-pointer disabled:opacity-50">
                        <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                    </button>
                    <button type="button" data-comment-action="delete" aria-label="Видалити коментар" title="Видалити коментар" class="action-icon-btn action-icon-btn-delete inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 transition cursor-pointer disabled:opacity-50">
                        <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                    </button>
                </div>` : ''}
            </div>
            ${isEditing ? `
            <form data-comment-edit-form class="mt-3 space-y-2.5">
                <label for="editCommentContent-${comment.id}" class="sr-only">Редагувати коментар</label>
                <textarea
                    id="editCommentContent-${comment.id}"
                    data-comment-edit-input
                    required
                    maxlength="2000"
                    rows="3"
                    class="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition"
                >${escapeHtml(comment.content)}</textarea>
                <div class="flex flex-wrap items-center justify-end gap-2">
                    <button
                        type="button"
                        data-comment-action="cancel-edit"
                        class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition cursor-pointer"
                    >
                        Скасувати
                    </button>
                    <button
                        type="submit"
                        data-comment-action="save-edit"
                        class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 active:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition cursor-pointer disabled:opacity-50"
                    >
                        Зберегти
                    </button>
                </div>
            </form>
            ` : `
            <p data-comment-body class="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">${escapeHtml(comment.content)}</p>
            `}
        </article>`;
    }).join('') : '<div class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-2xs">Коментарів поки немає. Напишіть перший.</div>';

    if (editingCommentId !== null) {
        const input = list.querySelector(`#editCommentContent-${editingCommentId}`);
        if (input) {
            input.focus();
            const len = input.value.length;
            input.setSelectionRange?.(len, len);
        }
    }
}

export async function loadComments(id, nextPage = 1) {
    postId = id;
    page = nextPage;
    editingCommentId = null;
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
            const target = event.target instanceof Element ? event.target : null;
            const button = target?.closest('[data-comment-action]');
            if (!button) return;
            const card = button.closest('[data-comment-id]');
            if (!card) return;
            const comment = comments.find(item => item.id === Number(card.dataset.commentId));
            if (!comment?.can_edit) return;

            if (button.dataset.commentAction === 'edit') {
                editingCommentId = editingCommentId === comment.id ? null : comment.id;
                render();
                return;
            }

            if (button.dataset.commentAction === 'cancel-edit') {
                editingCommentId = null;
                render();
                return;
            }

            if (button.dataset.commentAction !== 'delete' || !confirm('Видалити коментар?')) return;
            button.disabled = true;
            try {
                await readResponse(await fetch(`/api/posts/${postId}/comments/${comment.id}`, {
                    method: 'DELETE',
                    headers: getHeaders(),
                }));
                editingCommentId = null;
                await loadComments(postId, page);
            } catch (error) { showToast(error.message, true); }
            finally { button.disabled = false; }
        });

        list.addEventListener('submit', async event => {
            const target = event.target instanceof Element ? event.target : null;
            const editForm = target?.closest('[data-comment-edit-form]');
            if (!editForm) return;
            event.preventDefault();
            const card = editForm.closest('[data-comment-id]');
            if (!card) return;
            const comment = comments.find(item => item.id === Number(card.dataset.commentId));
            if (!comment?.can_edit) return;

            const textarea = editForm.querySelector('[data-comment-edit-input]');
            const content = textarea ? textarea.value.trim() : '';
            if (!content) {
                showToast('Коментар не може бути порожнім.', true);
                return;
            }

            const submitBtn = editForm.querySelector('[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            try {
                await readResponse(await fetch(`/api/posts/${postId}/comments/${comment.id}`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify({ content }),
                }));
                editingCommentId = null;
                await loadComments(postId, page);
                showToast('Коментар оновлено');
            } catch (error) {
                showToast(error.message, true);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });

        list.addEventListener('keydown', event => {
            if (event.key === 'Escape' && editingCommentId !== null) {
                const target = event.target instanceof Element ? event.target : null;
                if (target?.closest('[data-comment-edit-form]')) {
                    event.preventDefault();
                    editingCommentId = null;
                    render();
                }
            }
        });
    }
}
