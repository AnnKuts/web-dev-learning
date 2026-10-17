import { getAuthToken, getCurrentUser, setAuth, clearAuth, loginUser, registerUser, logoutUser, readResponse } from './api.js';
import { showToast, closeModal, renderUserState } from './ui.js';

function updateAuthDisplay() {
    renderUserState(getCurrentUser(), getAuthToken());
}

export function initAuth(onAuthChange) {
    updateAuthDisplay();
    document.addEventListener('click', async (event) => {
        if (!event.target.closest('#logoutBtn')) return;
        try {
            const response = await logoutUser();
            if (response.status !== 401) await readResponse(response);
            clearAuth();
            updateAuthDisplay();
            showToast('Ви вийшли з системи');
            onAuthChange();
        } catch (error) {
            showToast(error.message, true);
        }
    });
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value.trim() || '';
            const password = document.getElementById('loginPassword')?.value || '';

            try {
                const res = await loginUser({ email, password });
                const json = await readResponse(res);
                if (res.ok && json.token) {
                    setAuth(json.token, json.user);
                    showToast('Успішний вхід!');
                    closeModal('loginModal');
                    updateAuthDisplay();
                    onAuthChange();
                } else {
                    showToast(json.message || 'Невірні облікові дані', true);
                }
            } catch (err) {
                showToast(err.message, true);
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername')?.value.trim() || '';
            const email = document.getElementById('regEmail')?.value.trim() || '';
            const password = document.getElementById('regPassword')?.value || '';
            const password_confirmation = document.getElementById('regPasswordConf')?.value || '';
            const user_bio = document.getElementById('regBio')?.value.trim() || '';

            try {
                const res = await registerUser({ username, email, password, password_confirmation, user_bio });
                const json = await readResponse(res);
                if (res.ok && json.token) {
                    setAuth(json.token, json.user);
                    showToast('Реєстрація успішна!');
                    closeModal('registerModal');
                    updateAuthDisplay();
                    onAuthChange();
                } else {
                    showToast(json.message || 'Помилка реєстрації', true);
                }
            } catch (err) {
                showToast(err.message, true);
            }
        });
    }
}
