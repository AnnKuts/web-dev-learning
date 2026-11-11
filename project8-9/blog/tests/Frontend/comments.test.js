import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { setAuth, clearAuth } from '../../resources/js/api.js';
import { initAuth } from '../../resources/js/auth.js';
import { initComments, loadComments } from '../../resources/js/comments.js';

beforeEach(() => {
    setAuth('test-token', { id: 1, username: 'Anna' });
    document.body.innerHTML = `
        <form id="commentForm"><textarea id="commentContent"></textarea><button type="submit">Опублікувати</button></form>
        <div id="commentsList"></div><button id="commentsMore" class="hidden"></button>
        <div id="toast"><span id="toastIcon"></span><span id="toastMessage"></span></div>`;
});

afterEach(() => {
    clearAuth();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
});

test('new comment appears without reloading and user text is escaped', async () => {
    const created = { id: 2, content: '<script>bad()</script>', author: { username: 'Anna', avatar_url: null }, created_at: '2026-11-11T12:00:00Z', can_edit: true };
    vi.stubGlobal('fetch', vi.fn(async (_, options) => options?.method === 'POST'
        ? Response.json({ data: created }, { status: 201 })
        : Response.json({ data: [], meta: { last_page: 1 } })));

    initComments();
    await loadComments(5);
    document.getElementById('commentContent').value = created.content;
    document.getElementById('commentForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('commentsList').textContent).toContain(created.content));
    expect(document.querySelector('#commentsList script')).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(document.getElementById('commentContent').value).toBe('');
});

test('comment cards render accessible icon action buttons only for authorized comments and support edit and delete', async () => {
    let items = [
        {
            id: 10,
            content: 'Мій власний коментар',
            author: { username: 'Anna', avatar_url: null },
            created_at: '2026-11-11T12:00:00Z',
            can_edit: true,
        },
        {
            id: 11,
            content: 'Чужий коментар',
            author: { username: 'OtherUser', avatar_url: 'https://example.com/u.webp' },
            created_at: '2026-11-11T12:05:00Z',
            can_edit: false,
        },
    ];

    const fetchMock = vi.fn(async (url, options) => {
        if (options?.method === 'PUT') {
            const body = JSON.parse(options.body);
            items[0] = { ...items[0], content: body.content };
            return Response.json({ data: items[0] });
        }
        if (options?.method === 'DELETE') {
            items = items.filter(c => c.id !== 10);
            return new Response(null, { status: 204 });
        }
        return Response.json({ data: items, meta: { last_page: 1 } });
    });
    vi.stubGlobal('fetch', fetchMock);
    const confirmSpy = vi.fn();
    vi.stubGlobal('confirm', confirmSpy);

    initComments();
    await loadComments(5);

    const ownCard = document.querySelector('[data-comment-id="10"]');
    const otherCard = document.querySelector('[data-comment-id="11"]');

    const editBtn = ownCard.querySelector('[data-comment-action="edit"]');
    const deleteBtn = ownCard.querySelector('[data-comment-action="delete"]');
    expect(editBtn).not.toBeNull();
    expect(deleteBtn).not.toBeNull();
    expect(editBtn.getAttribute('aria-label')).toBe('Редагувати коментар');
    expect(deleteBtn.getAttribute('aria-label')).toBe('Видалити коментар');
    expect(editBtn.querySelector('.fa-pen-to-square')).not.toBeNull();
    expect(deleteBtn.querySelector('.fa-trash-can')).not.toBeNull();
    expect(editBtn.className).toContain('action-icon-btn');
    expect(deleteBtn.className).toContain('action-icon-btn');

    expect(otherCard.querySelector('[data-comment-action="edit"]')).toBeNull();
    expect(otherCard.querySelector('[data-comment-action="delete"]')).toBeNull();

    editBtn.click();
    const editForm = document.querySelector('[data-comment-id="10"] [data-comment-edit-form]');
    const editInput = document.querySelector('[data-comment-id="10"] [data-comment-edit-input]');
    expect(editForm).not.toBeNull();
    expect(editInput).not.toBeNull();
    expect(editInput.value).toBe('Мій власний коментар');

    document.querySelector('[data-comment-id="10"] [data-comment-action="cancel-edit"]').click();
    expect(document.querySelector('[data-comment-id="10"] [data-comment-edit-form]')).toBeNull();
    expect(document.querySelector('[data-comment-id="10"] [data-comment-body]').textContent).toBe('Мій власний коментар');

    document.querySelector('[data-comment-id="10"] [data-comment-action="edit"]').click();
    const reopenedInput = document.querySelector('[data-comment-id="10"] [data-comment-edit-input]');
    reopenedInput.value = 'Оновлений коментар';
    document.querySelector('[data-comment-id="10"] [data-comment-edit-form]').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(document.querySelector('[data-comment-id="10"]').textContent).toContain('Оновлений коментар'));
    expect(fetchMock).toHaveBeenCalledWith('/api/posts/5/comments/10', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ content: 'Оновлений коментар' }),
    }));

    document.querySelector('[data-comment-id="10"] [data-comment-action="delete"]').click();
    expect(confirmSpy).not.toHaveBeenCalled();
    const deleteModal = document.getElementById('deleteCommentModal');
    expect(deleteModal).not.toBeNull();
    expect(deleteModal.classList.contains('hidden')).toBe(false);

    deleteModal.querySelector('[data-comment-delete-cancel]').click();
    expect(deleteModal.classList.contains('hidden')).toBe(true);
    expect(document.querySelector('[data-comment-id="10"]')).not.toBeNull();

    document.querySelector('[data-comment-id="10"] [data-comment-action="delete"]').click();
    expect(deleteModal.classList.contains('hidden')).toBe(false);
    document.getElementById('confirmDeleteCommentBtn').click();

    await vi.waitFor(() => expect(document.querySelector('[data-comment-id="10"]')).toBeNull());
    expect(deleteModal.classList.contains('hidden')).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/posts/5/comments/10', expect.objectContaining({
        method: 'DELETE',
    }));
});

test('logging out from an article detail page redirects directly to the home page and hides comments without rendering a duplicate guest block', async () => {
    document.body.innerHTML = `
        <div id="userState"></div>
        <button id="logoutBtn" type="button">Вийти</button>
        <article id="postDetail" data-post-id="7"></article>
        <section id="commentsSection">
            <form id="commentForm"></form>
            <div id="commentsList"><p>Existing comment</p></div>
        </section>
        <div id="toast"><span id="toastIcon"></span><span id="toastMessage"></span></div>
    `;

    const assignSpy = vi.fn();
    vi.stubGlobal('location', { ...window.location, pathname: '/posts/7', assign: assignSpy, hash: '', search: '' });
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ message: 'Logged out' })));

    initAuth();
    document.getElementById('logoutBtn').click();

    await vi.waitFor(() => expect(assignSpy).toHaveBeenCalledWith('/'));
    await loadComments(7);
    expect(document.getElementById('commentsList').textContent).toBe('');
    expect(document.getElementById('commentsSection').classList.contains('hidden')).toBe(true);
});
