import { test, expect, vi } from 'vitest';
vi.mock('../../resources/js/post-form.js', () => ({ initPostForms: vi.fn(), startEditPost: vi.fn() }));
import { getAuthToken, setAuth } from '../../resources/js/api.js';

test('guest first load, email login, logout, and expired token keep protected requests under control', async () => {
    localStorage.clear();
    document.body.innerHTML = `
        <div id="toast"><span id="toastIcon"></span><span id="toastMessage"></span></div>
        <div id="userState"></div>
        <button id="refreshBtn"></button>
        <div id="postsList"></div><div id="postsPagination"></div>
        <div id="tagsList"></div><div id="usersList"></div><div id="usersPagination"></div>
        <input id="postSearch" value="">
        <div id="loginModal" class="hidden"><form id="loginForm">
            <input id="loginEmail" value="reader@example.test"><input id="loginPassword" value="password">
            <button type="submit">Увійти</button>
        </form></div>
        <div id="registerModal" class="hidden"></div>
    `;
    let protectedCalls = 0;
    let expired = false;
    const fetchMock = vi.fn(async (url) => {
        if (url === '/api/login') return { ok: true, status: 200, json: async () => ({ token: 'valid-token', user: { username: 'Reader' } }) };
        if (url === '/api/logout') return { ok: true, status: 200, json: async () => ({ message: 'ok' }) };
        protectedCalls++;
        if (expired) return { ok: false, status: 401, json: async () => ({ message: 'Unauthenticated' }) };
        if (url.startsWith('/api/tags')) return { ok: true, status: 200, json: async () => ({ data: [], meta: { last_page: 1 } }) };
        return { ok: true, status: 200, json: async () => ({ data: [], meta: {} }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    await import('../../resources/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(protectedCalls).toBe(0);
    expect(document.getElementById('postsList').textContent).toContain('Ласкаво просимо');
    expect(document.querySelector('#postsList [data-modal-open="loginModal"]')).not.toBeNull();
    expect(document.querySelector('#postsList [data-modal-open="registerModal"]')).not.toBeNull();

    document.getElementById('loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(protectedCalls).toBeGreaterThan(0));
    expect(getAuthToken()).toBe('valid-token');
    await vi.waitFor(() => expect(document.getElementById('postsList').textContent).toContain('Статей поки немає'));

    document.getElementById('logoutBtn').click();
    await vi.waitFor(() => expect(getAuthToken()).toBe(''));
    await vi.waitFor(() => expect(document.getElementById('postsList').textContent).toContain('Ласкаво просимо'));
    const afterLogout = protectedCalls;
    document.getElementById('refreshBtn').click();
    expect(protectedCalls).toBe(afterLogout);

    setAuth('expired-token', { username: 'Reader' });
    expired = true;
    document.getElementById('refreshBtn').click();
    await vi.waitFor(() => expect(getAuthToken()).toBe(''));
    const afterExpiry = protectedCalls;
    document.getElementById('refreshBtn').click();
    expect(protectedCalls).toBe(afterExpiry);
    expect(document.getElementById('postsList').textContent).toContain('Ласкаво просимо');
    vi.unstubAllGlobals();
});
