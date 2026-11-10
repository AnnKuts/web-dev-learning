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
                <img id="profileSettingsAvatarImg" class="hidden">
                <div id="profileSettingsAvatarFallback">U</div>
                <p id="profileSettingsUsername"></p>
                <p id="profileSettingsEmail"></p>
                <p id="profileSettingsBio" class="hidden"></p>
                <p id="profileSettingsAvatarStatus"></p>
                <button type="button" id="profileOpenAvatarBtn" data-modal-close="profileSettingsModal" data-modal-open="avatarModal">Змінити фотографію</button>
                <span id="profileSettingsGoogleBadge" class="hidden">Підключено</span>
                <p id="profileSettingsGoogleText"></p>
                <button type="button" id="profileSettingsGoogleLinkBtn" data-modal-close="profileSettingsModal" data-modal-open="googleLinkModal">Підключити Google</button>
                <button type="button" data-modal-close="profileSettingsModal">Закрити</button>
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

    const user = { username: 'Anna Kuts', email: 'anna@example.com', avatar_url: null, google_linked: false };
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
    expect(document.getElementById('headerMenu').classList.contains('hidden')).toBe(false);
    expect(dropdown.className).toContain('w-[calc(100vw-2rem)]');
    for (const item of dropdown.querySelectorAll('[role="menuitem"]')) {
        expect(item.className).toContain('min-h-11');
    }
});

test('dropdown opens, closes on outside click or Escape, supports keyboard navigation, and avoids duplicate listeners', () => {
    const user = { username: 'Anna', email: 'anna@example.com', avatar_url: 'https://example.com/a.webp' };
    // Call renderUserState multiple times to ensure listeners are never duplicated
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

test('profile settings and Google linking modals open from dropdown and reflect Google linking status', () => {
    const unlinkedUser = {
        username: 'Anna',
        email: 'anna@example.com',
        user_bio: 'PHP & Laravel developer',
        avatar_url: null,
        google_linked: false,
    };
    setAuth('token-1', unlinkedUser);
    renderUserState(unlinkedUser, 'token-1');

    const menuBtn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdownMenu');

    // Google link button is shown in dropdown when not linked
    expect(document.getElementById('googleLinkMenuBtn')).not.toBeNull();

    // Open dropdown and click Profile Settings
    menuBtn.click();
    document.getElementById('profileSettingsMenuBtn').click();

    expect(dropdown.classList.contains('hidden')).toBe(true);
    const profileModal = document.getElementById('profileSettingsModal');
    expect(profileModal.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('profileSettingsUsername').textContent).toBe('Anna');
    expect(document.getElementById('profileSettingsEmail').textContent).toBe('anna@example.com');
    expect(document.getElementById('profileSettingsBio').textContent).toBe('PHP & Laravel developer');
    expect(document.getElementById('profileSettingsGoogleBadge').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('profileSettingsGoogleLinkBtn').classList.contains('hidden')).toBe(false);

    // Clicking "Підключити Google" inside Profile Settings closes profile modal and opens googleLinkModal
    document.getElementById('profileSettingsGoogleLinkBtn').click();
    expect(profileModal.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('googleLinkModal').classList.contains('hidden')).toBe(false);

    // Close googleLinkModal and open it directly from dropdown
    document.querySelector('[data-modal-close="googleLinkModal"]').click();
    expect(document.getElementById('googleLinkModal').classList.contains('hidden')).toBe(true);

    menuBtn.click();
    document.getElementById('googleLinkMenuBtn').click();
    expect(dropdown.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('googleLinkModal').classList.contains('hidden')).toBe(false);

    // When Google is already linked, dropdown hides the link option and profile settings shows "Підключено"
    const linkedUser = { ...unlinkedUser, google_linked: true };
    setAuth('token-1', linkedUser);
    renderUserState(linkedUser, 'token-1');
    expect(document.getElementById('googleLinkMenuBtn')).toBeNull();
    expect(document.getElementById('profileSettingsGoogleBadge').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('profileSettingsGoogleLinkBtn').classList.contains('hidden')).toBe(true);
});

test('avatar modal centers properly, previews selected image, validates input, and updates header on upload and delete', async () => {
    const initialUser = { username: 'Anna', email: 'anna@example.com', avatar_url: null };
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
                    username: 'Anna',
                    email: 'anna@example.com',
                    avatar_url: 'https://cdn.example.com/avatars/new.webp',
                },
            });
        }
        if (url === '/api/me/avatar' && options.method === 'DELETE') {
            return Response.json({
                data: {
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
    setAuth('token-xyz', { username: 'Anna', email: 'anna@example.com', avatar_url: null });
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
