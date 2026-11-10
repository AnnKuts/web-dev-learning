import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { getAuthToken, getCurrentUser, setAuth, clearAuth } from '../../resources/js/api.js';
import { renderUserState, initHeaderMenu, initModals, openModal } from '../../resources/js/ui.js';
import { initAvatar } from '../../resources/js/avatar.js';
import { initAuth } from '../../resources/js/auth.js';

function buildHeaderAndModalsDom() {
    document.head.innerHTML = '<meta name="csrf-token" content="test-csrf">';
    document.body.innerHTML = `
        <div id="toast" class="hidden"><span id="toastIcon"></span><span id="toastMessage"></span></div>
        <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <a href="/" class="order-1 h-16 flex flex-1 min-w-0 items-center space-x-3 group">Блог UA</a>
                <button type="button" id="headerMenuToggle" aria-controls="headerMenu" aria-expanded="false" aria-label="Відкрити меню"
                    class="order-2 lg:hidden shrink-0 w-10 h-10">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <button type="button" id="createArticleBtn" data-modal-open="newPostModal" data-auth-required hidden
                    class="order-4 lg:order-2 w-full lg:w-auto mb-3 lg:mb-0 min-h-11">
                    <span>Створити статтю</span>
                </button>
                <div id="headerMenu" class="order-3 lg:order-3 hidden basis-full min-w-0 flex flex-col gap-3 border-t border-slate-200 py-3 lg:basis-auto lg:flex lg:flex-row lg:items-center lg:border-0 lg:py-0">
                    <div id="userState" class="min-w-0 text-sm font-medium text-slate-600 flex items-center"></div>
                </div>
            </div>
        </header>

        <div id="loginModal" class="modal-backdrop fixed inset-0 flex items-center justify-center hidden">
            <form id="loginForm">
                <input id="loginEmail" value="anna@example.com">
                <input id="loginPassword" value="secret123">
                <button type="submit">Увійти</button>
            </form>
        </div>
        <div id="registerModal" class="modal-backdrop fixed inset-0 flex items-center justify-center hidden"></div>
        <div id="googleLinkModal" class="modal-backdrop fixed inset-0 flex items-center justify-center hidden">
            <form id="googleLinkForm">
                <input id="googleLinkPassword" type="password">
                <button type="submit">Підключити Google</button>
                <button type="button" data-modal-close="googleLinkModal">Скасувати</button>
            </form>
        </div>

        <div id="profileSettingsModal" role="dialog" aria-modal="true" class="modal-backdrop fixed inset-0 z-50 hidden flex items-center justify-center">
            <div>
                <img id="profileSettingsAvatar" alt="Фото профілю" class="hidden">
                <div id="profileSettingsAvatarFallback">U</div>
                <h2 id="profileSettingsTitle">Налаштування профілю</h2>
                <p>Керування вашим обліковим записом</p>
                <form id="profileSettingsForm" novalidate>
                    <input type="text" id="profileUsername" name="username" required minlength="2" maxlength="255">
                    <p id="profileUsernameError" class="hidden"></p>
                    <input type="email" id="profileEmail" name="email" readonly aria-readonly="true">
                    <textarea id="profileBio" name="user_bio" rows="3" maxlength="1000"></textarea>
                    <p id="profileBioError" class="hidden"></p>
                    <span id="profileSettingsGoogleBadge" class="hidden">Підключено</span>
                    <span id="profileSettingsGoogleUnlinked">Не підключено</span>
                    <p id="profileFormError" role="alert" class="hidden"></p>
                    <button type="button" data-modal-close="profileSettingsModal">Скасувати</button>
                    <button type="submit" id="profileSaveBtn"><span>Зберегти зміни</span></button>
                </form>
            </div>
        </div>

        <div id="avatarModal" role="dialog" aria-modal="true" class="modal-backdrop fixed inset-0 z-50 hidden flex items-center justify-center">
            <form id="avatarForm">
                <img id="avatarPreview" class="hidden">
                <div id="avatarPlaceholder">U</div>
                <input id="avatarFile" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only">
                <label for="avatarFile" id="avatarSelectBtn"><span>Обрати фото</span></label>
                <p id="avatarFileName" class="hidden"></p>
                <p id="avatarError" role="alert" class="hidden"></p>
                <button type="button" id="avatarDelete" class="hidden"><span>Видалити фото</span></button>
                <button type="button" data-modal-close="avatarModal">Скасувати</button>
                <button type="submit" id="avatarSaveBtn" disabled><span>Зберегти</span></button>
            </form>
        </div>
    `;
}

beforeEach(() => {
    localStorage.clear();
    clearAuth();
    buildHeaderAndModalsDom();
    initHeaderMenu();
    initModals();
});

afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
    localStorage.clear();
    clearAuth();
});

test('guest vs authenticated header renders compact avatar button and keeps create article separate', () => {
    renderUserState(null, '');

    expect(document.querySelector('#userState [data-modal-open="loginModal"]')).not.toBeNull();
    expect(document.querySelector('#userState [data-modal-open="registerModal"]')).not.toBeNull();
    expect(document.getElementById('userMenuBtn')).toBeNull();
    expect(document.getElementById('userDropdownMenu')).toBeNull();
    expect(document.getElementById('headerMenuToggle').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('headerMenu').classList.contains('hidden')).toBe(true);

    const user = { id: 1, username: 'Anna Kuts', email: 'anna@example.com', avatar_url: null, google_connected: false };
    setAuth('token-123', user);
    renderUserState(user, 'token-123');

    const menuBtn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdownMenu');
    expect(menuBtn).not.toBeNull();
    expect(menuBtn.getAttribute('aria-expanded')).toBe('false');
    expect(menuBtn.getAttribute('aria-haspopup')).toBe('menu');
    expect(dropdown).not.toBeNull();
    expect(dropdown.classList.contains('hidden')).toBe(true);

    // Fallback initial is rendered when avatar_url is null
    const fallback = document.getElementById('headerUserAvatarFallback');
    expect(fallback).not.toBeNull();
    expect(fallback.textContent).toBe('A');
    expect(document.getElementById('headerUserAvatar')).toBeNull();

    // Create article button remains outside the profile dropdown
    const createBtn = document.getElementById('createArticleBtn');
    expect(dropdown.contains(createBtn)).toBe(false);

    // Mobile compatibility: authenticated header menu is inline and accessible without hamburger toggle
    expect(document.getElementById('headerMenuToggle').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('headerMenuToggle').classList.contains('inline-flex')).toBe(false);
    expect(document.getElementById('headerMenuToggle').hidden).toBe(true);
    expect(document.getElementById('headerMenu').classList.contains('hidden')).toBe(false);
    expect(dropdown.className).toContain('w-[calc(100vw-2rem)]');
    for (const item of dropdown.querySelectorAll('[role="menuitem"]')) {
        expect(item.className).toContain('min-h-11');
    }
});

test('dropdown opens, closes on outside click or Escape, supports keyboard navigation, and avoids duplicate listeners', () => {
    const user = { id: 1, username: 'Anna', email: 'anna@example.com', avatar_url: 'https://example.com/a.webp' };
    renderUserState(user, 'token-1');
    renderUserState(user, 'token-1');
    renderUserState(user, 'token-1');

    const menuBtn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdownMenu');

    expect(document.getElementById('headerUserAvatar')?.getAttribute('src')).toBe('https://example.com/a.webp');
    expect(document.getElementById('userDropdownName').textContent).toBe('Anna');
    expect(document.getElementById('userDropdownEmail').textContent).toBe('anna@example.com');

    // Click to open
    menuBtn.click();
    expect(dropdown.classList.contains('hidden')).toBe(false);
    expect(menuBtn.getAttribute('aria-expanded')).toBe('true');

    // Click outside to close
    document.body.click();
    expect(dropdown.classList.contains('hidden')).toBe(true);
    expect(menuBtn.getAttribute('aria-expanded')).toBe('false');

    // Open via ArrowDown and navigate menu items
    menuBtn.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(dropdown.classList.contains('hidden')).toBe(false);
    const items = dropdown.querySelectorAll('[role="menuitem"]');
    expect(document.activeElement).toBe(items[0]);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);

    // Press Escape to close and return focus to trigger button
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(dropdown.classList.contains('hidden')).toBe(true);
    expect(menuBtn.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(menuBtn);
});

test('profile settings modal populates fields, validates and saves username/biography updates, and reflects Google connection status without duplication', async () => {
    const unlinkedUser = {
        id: 7,
        username: 'Anna',
        email: 'anna@example.com',
        user_bio: 'PHP & Laravel developer',
        avatar_url: null,
        google_connected: false,
    };
    setAuth('token-1', unlinkedUser);
    renderUserState(unlinkedUser, 'token-1');

    const menuBtn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdownMenu');

    // Google link button is shown in dropdown when not connected
    expect(document.getElementById('googleLinkMenuBtn')).not.toBeNull();

    // Open dropdown and click Profile Settings
    menuBtn.click();
    document.getElementById('profileSettingsMenuBtn').click();

    expect(dropdown.classList.contains('hidden')).toBe(true);
    const profileModal = document.getElementById('profileSettingsModal');
    expect(profileModal.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('profileUsername').value).toBe('Anna');
    expect(document.getElementById('profileEmail').value).toBe('anna@example.com');
    expect(document.getElementById('profileEmail').readOnly).toBe(true);
    expect(document.getElementById('profileBio').value).toBe('PHP & Laravel developer');
    expect(document.getElementById('profileSettingsAvatar').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('profileSettingsAvatarFallback').textContent).toBe('A');
    expect(document.getElementById('profileSettingsGoogleBadge').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('profileSettingsGoogleUnlinked').classList.contains('hidden')).toBe(false);

    // Ensure profile settings modal does not duplicate avatar upload or Google link buttons
    expect(profileModal.querySelector('[data-modal-open="avatarModal"]')).toBeNull();
    expect(profileModal.querySelector('[data-modal-open="googleLinkModal"]')).toBeNull();

    // Client-side validation rejects too-short username
    document.getElementById('profileUsername').value = 'A';
    document.getElementById('profileSettingsForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.getElementById('profileUsernameError').classList.contains('hidden')).toBe(false);

    // Server-side validation error (422) displays field error message
    const fetchMock = vi.fn(async (url, options) => {
        const body = JSON.parse(options.body);
        if (body.username === 'TakenName') {
            return Response.json({
                message: 'The username has already been taken.',
                errors: { username: ['Це ім’я користувача вже зайняте.'] },
            }, { status: 422 });
        }
        return Response.json({
            data: {
                id: 7,
                username: body.username,
                email: 'anna@example.com',
                user_bio: body.user_bio || null,
                avatar_url: null,
                google_connected: true,
            },
        });
    });
    vi.stubGlobal('fetch', fetchMock);

    document.getElementById('profileUsername').value = 'TakenName';
    document.getElementById('profileSettingsForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('profileUsernameError').textContent).toBe('Це ім’я користувача вже зайняте.'));
    expect(profileModal.classList.contains('hidden')).toBe(false);

    // Valid update saves via PUT /api/users/7 and immediately refreshes header, dropdown, and Google status
    document.getElementById('profileUsername').value = 'KutsAnna';
    document.getElementById('profileBio').value = 'Updated biography text';
    document.getElementById('profileSettingsForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(profileModal.classList.contains('hidden')).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith('/api/users/7', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ username: 'KutsAnna', user_bio: 'Updated biography text' }),
    }));

    expect(getCurrentUser().username).toBe('KutsAnna');
    expect(getCurrentUser().user_bio).toBe('Updated biography text');
    expect(document.getElementById('userDropdownName').textContent).toBe('KutsAnna');
    expect(document.getElementById('headerUserAvatarFallback').textContent).toBe('K');

    // Because updated response has google_connected: true, dropdown hides "Підключити Google" and modal shows "Підключено"
    expect(document.getElementById('googleLinkMenuBtn')).toBeNull();
    expect(document.getElementById('profileSettingsGoogleBadge').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('profileSettingsGoogleUnlinked').classList.contains('hidden')).toBe(true);
});

test('avatar modal centers properly, previews selected image, validates input, and updates header on upload and delete', async () => {
    const initialUser = { id: 1, username: 'Anna', email: 'anna@example.com', avatar_url: null };
    setAuth('token-1', initialUser);
    renderUserState(initialUser, 'token-1');
    initAvatar();

    // Open avatar modal from dropdown
    document.getElementById('userMenuBtn').click();
    document.getElementById('changeAvatarMenuBtn').click();

    const avatarModal = document.getElementById('avatarModal');
    const preview = document.getElementById('avatarPreview');
    const placeholder = document.getElementById('avatarPlaceholder');
    const deleteBtn = document.getElementById('avatarDelete');
    const saveBtn = document.getElementById('avatarSaveBtn');
    const fileInput = document.getElementById('avatarFile');

    expect(avatarModal.classList.contains('hidden')).toBe(false);
    expect(avatarModal.classList.contains('flex')).toBe(true);
    expect(preview.classList.contains('hidden')).toBe(true);
    expect(placeholder.classList.contains('hidden')).toBe(false);
    expect(placeholder.textContent).toBe('A');
    expect(deleteBtn.classList.contains('hidden')).toBe(true);
    expect(saveBtn.disabled).toBe(true);

    // Invalid file selection (> 2MB or wrong type) shows error and keeps save disabled
    const invalidFile = new File(['bad'], 'malware.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', { value: [invalidFile], configurable: true });
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.getElementById('avatarError').classList.contains('hidden')).toBe(false);
    expect(saveBtn.disabled).toBe(true);

    // Valid file selection shows immediate preview and enables save button
    const validFile = new File(['image-bytes'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [validFile], configurable: true });
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.getElementById('avatarError').classList.contains('hidden')).toBe(true);
    expect(preview.classList.contains('hidden')).toBe(false);
    expect(placeholder.classList.contains('hidden')).toBe(true);
    expect(saveBtn.disabled).toBe(false);

    // Submit avatar upload and verify immediate header update
    const fetchMock = vi.fn(async (url, options) => {
        if (url === '/api/me/avatar' && options.method === 'POST') {
            return Response.json({
                data: {
                    id: 1,
                    username: 'Anna',
                    email: 'anna@example.com',
                    avatar_url: 'https://cdn.example.com/avatars/new.webp',
                },
            });
        }
        if (url === '/api/me/avatar' && options.method === 'DELETE') {
            return Response.json({
                data: {
                    id: 1,
                    username: 'Anna',
                    email: 'anna@example.com',
                    avatar_url: null,
                },
            });
        }
        return Response.json({});
    });
    vi.stubGlobal('fetch', fetchMock);

    document.getElementById('avatarForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(avatarModal.classList.contains('hidden')).toBe(true));

    expect(getCurrentUser().avatar_url).toBe('https://cdn.example.com/avatars/new.webp');
    expect(document.getElementById('headerUserAvatar')?.getAttribute('src')).toBe('https://cdn.example.com/avatars/new.webp');
    expect(document.getElementById('headerUserAvatarFallback')).toBeNull();

    // Reopen avatar modal: delete button should now be visible
    openModal('avatarModal');
    expect(deleteBtn.classList.contains('hidden')).toBe(false);
    expect(preview.getAttribute('src')).toBe('https://cdn.example.com/avatars/new.webp');
    expect(saveBtn.disabled).toBe(true);

    // Delete avatar and verify header reverts to fallback initial
    deleteBtn.click();
    await vi.waitFor(() => expect(avatarModal.classList.contains('hidden')).toBe(true));

    expect(getCurrentUser().avatar_url).toBeNull();
    expect(document.getElementById('headerUserAvatar')).toBeNull();
    expect(document.getElementById('headerUserAvatarFallback')?.textContent).toBe('A');
    expect(deleteBtn.classList.contains('hidden')).toBe(true);
});

test('logout through the dropdown clears auth state and removes the profile menu', async () => {
    setAuth('token-xyz', { id: 1, username: 'Anna', email: 'anna@example.com', avatar_url: null });
    vi.stubGlobal('fetch', vi.fn(async (url) => {
        if (url === '/api/logout') return Response.json({ message: 'Logged out' });
        return Response.json({});
    }));

    const onAuthChange = vi.fn();
    initAuth(onAuthChange);

    const menuBtn = document.getElementById('userMenuBtn');
    menuBtn.click();
    expect(document.getElementById('userDropdownMenu').classList.contains('hidden')).toBe(false);

    document.getElementById('logoutBtn').click();
    await vi.waitFor(() => expect(getAuthToken()).toBe(''));

    expect(getCurrentUser()).toBeNull();
    expect(document.getElementById('userMenuBtn')).toBeNull();
    expect(document.getElementById('userDropdownMenu')).toBeNull();
    expect(document.querySelector('#userState [data-modal-open="loginModal"]')).not.toBeNull();
    expect(onAuthChange).toHaveBeenCalledOnce();
});
