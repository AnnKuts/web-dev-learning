import { getAuthToken, getHeaders, getCurrentUser, setAuth, readResponse } from './api.js';
import { renderUserState, closeModal, showToast } from './ui.js';

export function initAvatar() {
    const form = document.getElementById('avatarForm');
    const file = document.getElementById('avatarFile');
    const preview = document.getElementById('avatarPreview');
    file?.addEventListener('change', () => {
        const selected = file.files?.[0];
        if (!selected) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || selected.size > 2 * 1024 * 1024) {
            showToast('Оберіть JPEG, PNG або WebP до 2 МБ.', true);
            file.value = '';
            return;
        }
        const url = URL.createObjectURL(selected);
        preview.src = url;
        preview.classList.remove('hidden');
        preview.onload = () => URL.revokeObjectURL(url);
    });
    form?.addEventListener('submit', async event => {
        event.preventDefault();
        if (!file.files?.[0]) return;
        const button = form.querySelector('[type=submit]');
        button.disabled = true;
        const body = new FormData();
        body.append('avatar', file.files[0]);
        try {
            const response = await readResponse(await fetch('/api/me/avatar', { method: 'POST', headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'application/json' }, body }));
            setAuth(getAuthToken(), { ...getCurrentUser(), ...response.data });
            renderUserState(getCurrentUser(), getAuthToken());
            closeModal('avatarModal');
            showToast('Аватар оновлено');
        } catch (error) { showToast(error.message, true); }
        finally { button.disabled = false; }
    });
    document.getElementById('avatarDelete')?.addEventListener('click', async () => {
        try {
            const response = await readResponse(await fetch('/api/me/avatar', { method: 'DELETE', headers: getHeaders() }));
            setAuth(getAuthToken(), { ...getCurrentUser(), ...response.data });
            renderUserState(getCurrentUser(), getAuthToken());
            preview.classList.add('hidden');
            file.value = '';
            closeModal('avatarModal');
            showToast('Аватар видалено');
        } catch (error) { showToast(error.message, true); }
    });
}
