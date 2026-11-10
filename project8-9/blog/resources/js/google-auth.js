import { getAuthToken, setAuth, readResponse } from './api.js';
import { showToast } from './ui.js';

async function post(path, data, linking = false) {
    return readResponse(await fetch(path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
            ...(linking ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
        },
        body: JSON.stringify(data),
    }));
}

export async function finishGoogleLogin(onSuccess) {
    const params = new URLSearchParams(location.hash.slice(1));
    if (!params.has('google_code') && !params.has('google_status')) return;
    history.replaceState(null, '', location.pathname + location.search);
    try {
        if (params.has('google_code')) {
            const result = await post('/auth/google/exchange', { code: params.get('google_code') });
            setAuth(result.token, result.user);
            onSuccess();
            showToast('Успішний вхід через Google!');
        } else if (params.get('google_status') === 'linked') {
            showToast('Google підключено до вашого акаунту.');
        } else {
            showToast('Не вдалося увійти через Google. Якщо email уже зареєстровано, увійдіть із паролем і підключіть Google у меню акаунту.', true);
        }
    } catch {
        showToast('Не вдалося завершити вхід. Спробуйте Google ще раз.', true);
    }
}

export function initGoogleAuth(onSuccess) {
    finishGoogleLogin(onSuccess);
    document.querySelectorAll('[data-google-login]').forEach(button => {
        button.addEventListener('click', async () => {
            button.disabled = true;
            try {
                const result = await post('/auth/google/start', { mode: 'login' });
                location.assign(result.url);
            } catch (error) {
                showToast(error.message, true);
                button.disabled = false;
            }
        });
    });
    document.getElementById('googleLinkForm')?.addEventListener('submit', async event => {
        event.preventDefault();
        const field = document.getElementById('googleLinkPassword');
        const password = field.value;
        field.value = '';
        try {
            const result = await post('/auth/google/start', { mode: 'link', password }, true);
            location.assign(result.url);
        } catch (error) {
            showToast(error.message, true);
        }
    });
}
