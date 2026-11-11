import { test, expect, vi } from 'vitest';
vi.mock('../../resources/js/post-form.js', () => ({ initPostForms: vi.fn(), startEditPost: vi.fn() }));
import { clearAuth, getAuthToken } from '../../resources/js/api.js';

test('Google exchange restores controls and loads articles from the guest page', async () => {
    clearAuth();
    history.replaceState(null, '', '/#google_code=' + 'a'.repeat(64));
    document.head.innerHTML = '<meta name="csrf-token" content="test-csrf">';
    document.body.innerHTML = `
        <div id="toast"><span id="toastIcon"></span><span id="toastMessage"></span></div>
        <div id="userState"></div>
        <button id="createArticleBtn" data-auth-required hidden data-modal-open="newPostModal"></button>
        <nav id="mainTabs" data-auth-required hidden><button id="tabBtn-posts"></button><button id="tabBtn-tags"></button></nav>
        <div id="articleSearch" data-auth-required hidden><input id="postSearch"></div>
        <div id="postsList"></div><div id="postsPagination"></div>
        <div id="tagsList"></div><div id="usersList"></div><div id="usersPagination"></div>
    `;
    const fetchMock = vi.fn(async (url) => {
        if (url === '/auth/google/exchange') return { ok: true, status: 200, json: async () => ({ token: 'google-token', user: { username: 'Reader' } }) };
        if (url.startsWith('/api/tags')) return { ok: true, status: 200, json: async () => ({ data: [], meta: { last_page: 1 } }) };
        return { ok: true, status: 200, json: async () => ({ data: [], meta: {} }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    await import('../../resources/js/app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await vi.waitFor(() => expect(getAuthToken()).toBe('google-token'));
    for (const control of document.querySelectorAll('[data-auth-required]')) expect(control.hidden).toBe(false);
    expect(document.getElementById('mainTabs').hidden).toBe(false);
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([url]) => url.startsWith('/api/posts?'))).toBe(true));
    expect(location.hash).toBe('');
    vi.unstubAllGlobals();
    clearAuth();
});
