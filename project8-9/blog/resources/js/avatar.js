import { getAuthToken, getHeaders, getCurrentUser, setAuth, readResponse } from './api.js';
import { renderUserState, closeModal, showToast, syncAvatarModal } from './ui.js';

function setAvatarError(message = '') {
    const errorEl = document.getElementById('avatarError');
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.toggle('hidden', !message);
}

function setButtonLoading(button, loading, loadingText, defaultText) {
    if (!button) return;
    const label = button.querySelector('span');
    if (label) {
        label.textContent = loading ? loadingText : defaultText;
    } else {
        button.textContent = loading ? loadingText : defaultText;
    }
}

export function initAvatar() {
    const form = document.getElementById('avatarForm');
    const file = document.getElementById('avatarFile');
    const preview = document.getElementById('avatarPreview');
    const placeholder = document.getElementById('avatarPlaceholder');
    const fileNameEl = document.getElementById('avatarFileName');
    const deleteBtn = document.getElementById('avatarDelete');
    const saveBtn = document.getElementById('avatarSaveBtn') || form?.querySelector('[type="submit"]');

    syncAvatarModal(getCurrentUser(), true);

    if (file && file.dataset.bound !== 'true') {
        file.dataset.bound = 'true';
        file.addEventListener('change', () => {
            const selected = file.files?.[0];
            if (!selected) {
                syncAvatarModal(getCurrentUser(), true);
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || selected.size > 2 * 1024 * 1024) {
                const msg = 'Оберіть JPEG, PNG або WebP до 2 МБ.';
                syncAvatarModal(getCurrentUser(), true);
                setAvatarError(msg);
                showToast(msg, true);
                return;
            }
            setAvatarError('');
            const url = typeof URL.createObjectURL === 'function'
                ? URL.createObjectURL(selected)
                : `blob:${selected.name}`;
            if (preview) {
                preview.src = url;
                preview.classList.remove('hidden');
                preview.onload = () => URL.revokeObjectURL?.(url);
            }
            placeholder?.classList.add('hidden');
            if (fileNameEl) {
                fileNameEl.textContent = selected.name;
                fileNameEl.classList.remove('hidden');
            }
            if (saveBtn) saveBtn.disabled = false;
        });
    }

    if (form && form.dataset.bound !== 'true') {
        form.dataset.bound = 'true';
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!file?.files?.[0]) return;
            const button = document.getElementById('avatarSaveBtn') || form.querySelector('[type="submit"]');
            const currentDeleteBtn = document.getElementById('avatarDelete');
            if (button) button.disabled = true;
            if (currentDeleteBtn) currentDeleteBtn.disabled = true;
            setButtonLoading(button, true, 'Збереження...', 'Зберегти');
            setAvatarError('');

            const body = new FormData();
            body.append('avatar', file.files[0]);
            try {
                const response = await readResponse(await fetch('/api/me/avatar', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json' },
                    body,
                }));
                setAuth(getAuthToken(), { ...getCurrentUser(), ...response.data });
                file.value = '';
                renderUserState(getCurrentUser(), getAuthToken());
                closeModal('avatarModal');
                showToast('Аватар оновлено');
            } catch (error) {
                setAvatarError(error.message);
                showToast(error.message, true);
            } finally {
                setButtonLoading(button, false, 'Збереження...', 'Зберегти');
                if (button) button.disabled = !file?.files?.[0];
                if (currentDeleteBtn) currentDeleteBtn.disabled = false;
            }
        });
    }

    if (deleteBtn && deleteBtn.dataset.bound !== 'true') {
        deleteBtn.dataset.bound = 'true';
        deleteBtn.addEventListener('click', async () => {
            const button = document.getElementById('avatarSaveBtn') || form?.querySelector('[type="submit"]');
            deleteBtn.disabled = true;
            if (button) button.disabled = true;
            setButtonLoading(deleteBtn, true, 'Видалення...', 'Видалити фото');
            setAvatarError('');

            try {
                const response = await readResponse(await fetch('/api/me/avatar', {
                    method: 'DELETE',
                    headers: getHeaders(),
                }));
                setAuth(getAuthToken(), { ...getCurrentUser(), ...response.data });
                if (file) file.value = '';
                renderUserState(getCurrentUser(), getAuthToken());
                closeModal('avatarModal');
                showToast('Аватар видалено');
            } catch (error) {
                setAvatarError(error.message);
                showToast(error.message, true);
            } finally {
                setButtonLoading(deleteBtn, false, 'Видалення...', 'Видалити фото');
                deleteBtn.disabled = false;
                if (button) button.disabled = !file?.files?.[0];
            }
        });
    }
}
