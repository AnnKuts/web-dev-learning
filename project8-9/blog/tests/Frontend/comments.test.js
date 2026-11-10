import { test, expect, vi } from 'vitest';
import { setAuth, clearAuth } from '../../resources/js/api.js';
import { initComments, loadComments } from '../../resources/js/comments.js';

test('new comment appears without reloading and user text is escaped', async () => {
    setAuth('test-token', { id: 1, username: 'Anna' });
    document.body.innerHTML = `
        <form id="commentForm"><textarea id="commentContent"></textarea><button type="submit">Опублікувати</button></form>
        <div id="commentsList"></div><button id="commentsMore" class="hidden"></button>
        <div id="toast"><span id="toastIcon"></span><span id="toastMessage"></span></div>`;
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

    clearAuth();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
});
