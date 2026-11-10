import { initGoogleAuth } from './google-auth.js';
import { getAuthToken, getCurrentUser, setAuth, clearAuth, loginUser, registerUser, logoutUser, readResponse } from './api.js';
import { showToast, closeModal, renderUserState, closeUserDropdown } from './ui.js';

let logoutListenerBound = false;
let latestOnAuthChange = () => {};

function updateAuthDisplay() {
    renderUserState(getCurrentUser(), getAuthToken());
}

export function initAuth(onAuthChange = () => {}) {
    latestOnAuthChange = onAuthChange;
    updateAuthDisplay();
    initGoogleAuth(() => { updateAuthDisplay(); latestOnAuthChange(); });

    if (!logoutListenerBound) {
        logoutListenerBound = true;
        document.addEventListener('click', async (event) => {
            const target = event.target instanceof Element ? event.target : null;
            if (!target?.closest('#logoutBtn')) return;
            closeUserDropdown();
            try {
                const response = await logoutUser();
                if (response.status !== 401) await readResponse(response);
                clearAuth();
                updateAuthDisplay();
                showToast('Ви вийшли з системи');
                if (document.getElementById('postDetail') || window.location.pathname !== '/') {
                    window.location.assign('/');
                    return;
                }
                latestOnAuthChange();
            } catch (error) {
                showToast(error.message, true);
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm && loginForm.dataset.bound !== 'true') {
        loginForm.dataset.bound = 'true';
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
                    latestOnAuthChange();
                } else {
                    showToast(json.message || 'Невірні облікові дані', true);
                }
            } catch (err) {
                showToast(err.message, true);
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm && registerForm.dataset.bound !== 'true') {
        registerForm.dataset.bound = 'true';
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
                    latestOnAuthChange();
                } else {
                    showToast(json.message || 'Помилка реєстрації', true);
                }
            } catch (err) {
                showToast(err.message, true);
            }
        });
    }
}
