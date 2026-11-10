import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { finishGoogleLogin } from '../../resources/js/google-auth.js';
import { clearAuth, getAuthToken } from '../../resources/js/api.js';

beforeEach(() => {
    clearAuth();
    document.head.innerHTML = '<meta name="csrf-token" content="test-csrf">';
    document.body.innerHTML = '<div id="toast" class="hidden"><span id="toastIcon"></span><span id="toastMessage"></span></div>';
});
afterEach(() => { vi.unstubAllGlobals(); history.replaceState(null, '', '/'); });

test('Google handoff removes code from URL and exchanges through CSRF protected POST', async () => {
    history.replaceState(null, '', '/#google_code=' + 'a'.repeat(64));
    const fetchMock = vi.fn(async () => {
        expect(location.hash).toBe('');
        return { ok: true, status: 200, json: async () => ({ token: 'sanctum-token', user: { id: 1 } }) };
    });
    vi.stubGlobal('fetch', fetchMock);
    const success = vi.fn();
    await finishGoogleLogin(success);
    expect(fetchMock).toHaveBeenCalledWith('/auth/google/exchange', expect.objectContaining({
        method: 'POST', credentials: 'same-origin', headers: expect.objectContaining({ 'X-CSRF-TOKEN': 'test-csrf' }),
    }));
    expect(getAuthToken()).toBe('sanctum-token');
    expect(success).toHaveBeenCalledOnce();
});

test('failed exchange does not authenticate and does not retain the code', async () => {
    history.replaceState(null, '', '/#google_code=' + 'b'.repeat(64));
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const success = vi.fn();
    await finishGoogleLogin(success);
    expect(getAuthToken()).toBe('');
    expect(location.hash).toBe('');
    expect(success).not.toHaveBeenCalled();
});
