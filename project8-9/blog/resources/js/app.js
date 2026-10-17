import './bootstrap';
import {
    getAuthToken,
    getCurrentUser,
    setAuth,
    clearAuth,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    fetchTags,
    createTag,
    deleteTag,
    fetchUsers,
    loginUser,
    registerUser,
    logoutUser,
} from './api';
import {
    saveArticleDraft,
    restoreArticleDraft,
    clearArticleDraft,
} from './storage';
import {
    setFieldError,
    clearFieldError,
    validatePostFields,
    updateCounters,
} from './validation';
import {
    showToast,
    openModal,
    closeModal,
    escapeHtml,
    renderUserState,
} from './ui';

let currentTab = 'posts';
let currentPostPage = 1;
let currentUserPage = 1;
let allTags = [];
let currentPostsMap = new Map();

function updateAuthDisplay() {
    renderUserState(getCurrentUser(), getAuthToken());
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = 'tab-btn px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 transition';
    });
    const activeBtn = document.getElementById(`tabBtn-${tab}`);
    if (activeBtn) {
        activeBtn.className = 'tab-btn px-4 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-900 shadow-sm transition';
    }

    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    const activeSection = document.getElementById(`tab-${tab}`);
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }

    refreshCurrentTab();
}

function refreshCurrentTab() {
    if (currentTab === 'posts') loadPosts(currentPostPage);
    if (currentTab === 'tags') loadTags();
    if (currentTab === 'users') loadUsers(currentUserPage);
}

async function loadTagsForSelects() {
    try {
        const res = await fetchTags();
        const json = await res.json();
        allTags = json.data || [];

        const renderBoxes = (containerId) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            if (allTags.length === 0) {
                container.innerHTML = '<span class="text-xs text-slate-400">Тегів ще немає</span>';
                return;
            }
            container.innerHTML = allTags.map(tag => `
                <label class="inline-flex items-center space-x-1.5 bg-white border border-slate-200 px-2 py-1 rounded-md text-xs cursor-pointer hover:bg-slate-100">
                    <input type="checkbox" name="tags" value="${tag.id}" class="rounded text-indigo-600 focus:ring-0">
                    <span>#${escapeHtml(tag.tag_name)}</span>
                </label>
            `).join('');
        };

        renderBoxes('postTagCheckboxes');
        renderBoxes('editPostTagCheckboxes');

        restoreArticleDraft();
    } catch (e) {
        console.error(e);
    }
}

async function loadPosts(page = 1) {
    currentPostPage = page;
    const container = document.getElementById('postsList');
    const pagination = document.getElementById('postsPagination');
    if (!container) return;

    container.innerHTML = '<div class="p-8 text-center text-slate-400">Завантаження статей...</div>';

    try {
        const res = await fetchPosts(page);
        if (res.status === 401) {
            container.innerHTML = `
                <div class="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center">
                    <h3 class="font-bold text-base mb-1">Потрібна авторизація</h3>
                    <p class="text-sm mb-4">Для перегляду та взаємодії зі статтями потрібен Bearer токен або включений DEV_AUTH_BYPASS.</p>
                    <button type="button" data-modal-open="loginModal" class="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg">Увійти</button>
                </div>
            `;
            if (pagination) pagination.innerHTML = '';
            return;
        }

        const json = await res.json();
        const posts = json.data || [];
        currentPostsMap.clear();
        posts.forEach(p => currentPostsMap.set(p.id, p));

        if (posts.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">Статей поки немає. Створіть першу!</div>';
            if (pagination) pagination.innerHTML = '';
            return;
        }

        container.innerHTML = posts.map(post => `
            <article class="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:shadow-md transition">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-slate-900 mb-2">${escapeHtml(post.header)}</h3>
                        <p class="text-sm text-slate-600 whitespace-pre-line leading-relaxed mb-4">${escapeHtml(post.description)}</p>
                        
                        <div class="flex flex-wrap items-center gap-2 mb-4">
                            ${(post.tags || []).map(t => `
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    #${escapeHtml(t.tag_name)}
                                </span>
                            `).join('')}
                        </div>

                        <div class="flex items-center space-x-3 text-xs text-slate-400">
                            <span class="font-medium text-slate-600"><i class="fa-solid fa-user mr-1 text-slate-500"></i>${escapeHtml(post.user?.username || 'Невідомий')}</span>
                            <span>•</span>
                            <span><i class="fa-regular fa-clock mr-1 text-slate-400"></i>${new Date(post.created_at).toLocaleString('uk-UA')}</span>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2 shrink-0">
                        <button type="button" data-action="edit-post" data-id="${post.id}" class="p-2 text-slate-400 hover:text-indigo-600 transition" title="Редагувати">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" data-action="delete-post" data-id="${post.id}" class="p-2 text-slate-400 hover:text-rose-600 transition" title="Видалити">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </article>
        `).join('');

        const meta = json.meta || {};
        if (pagination) {
            pagination.innerHTML = `
                <div class="text-xs text-slate-500 font-medium">Сторінка ${meta.current_page || 1} з ${meta.last_page || 1} (Всього: ${meta.total || posts.length})</div>
                <div class="flex space-x-2">
                    <button type="button" data-action="page-posts" data-page="${currentPostPage - 1}" ${currentPostPage <= 1 ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Попередня</button>
                    <button type="button" data-action="page-posts" data-page="${currentPostPage + 1}" ${currentPostPage >= (meta.last_page || 1) ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Наступна</button>
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = `<div class="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl">Помилка завантаження: ${escapeHtml(err.message)}</div>`;
    }
}

async function loadTags() {
    const container = document.getElementById('tagsList');
    if (!container) return;
    container.innerHTML = '<div class="p-8 text-center text-slate-400 col-span-full">Завантаження...</div>';

    try {
        const res = await fetchTags();
        if (res.status === 401) {
            container.innerHTML = `<div class="p-6 text-center text-amber-700 bg-amber-50 rounded-2xl col-span-full">Потрібна авторизація для перегляду тегів.</div>`;
            return;
        }
        const json = await res.json();
        const tags = json.data || [];

        if (tags.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-slate-400 col-span-full bg-white border border-slate-200 rounded-2xl">Тегів поки немає.</div>';
            return;
        }

        container.innerHTML = tags.map(tag => `
            <div class="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-2xs hover:shadow-sm transition">
                <div>
                    <h4 class="font-bold text-slate-900 text-sm">#${escapeHtml(tag.tag_name)}</h4>
                    <p class="text-xs text-slate-400">slug: ${escapeHtml(tag.tag_slug)}</p>
                </div>
                <button type="button" data-action="delete-tag" data-id="${tag.id}" class="text-slate-300 hover:text-rose-600 p-1 transition" title="Видалити тег">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div class="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl col-span-full">Помилка: ${escapeHtml(err.message)}</div>`;
    }
}

async function loadUsers(page = 1) {
    currentUserPage = page;
    const container = document.getElementById('usersList');
    const pagination = document.getElementById('usersPagination');
    if (!container) return;
    container.innerHTML = '<div class="p-8 text-center text-slate-400 col-span-full">Завантаження...</div>';

    try {
        const res = await fetchUsers(page);
        if (res.status === 401) {
            container.innerHTML = `<div class="p-6 text-center text-amber-700 bg-amber-50 rounded-2xl col-span-full">Потрібна авторизація для перегляду користувачів.</div>`;
            if (pagination) pagination.innerHTML = '';
            return;
        }
        const json = await res.json();
        const users = json.data || [];

        if (users.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-slate-400 col-span-full bg-white border border-slate-200 rounded-2xl">Користувачів не знайдено.</div>';
            if (pagination) pagination.innerHTML = '';
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div class="flex items-center space-x-3 mb-3">
                    <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-indigo-600">
                        ${escapeHtml((user.username || 'U')[0].toUpperCase())}
                    </div>
                    <div class="overflow-hidden">
                        <h4 class="font-bold text-slate-900 text-sm truncate">${escapeHtml(user.username)}</h4>
                        <p class="text-xs text-slate-400 truncate">${escapeHtml(user.email)}</p>
                    </div>
                </div>
                <p class="text-xs text-slate-600 line-clamp-2 min-h-8">${escapeHtml(user.user_bio || 'Біографія відсутня.')}</p>
            </div>
        `).join('');

        const meta = json.meta || {};
        if (pagination) {
            pagination.innerHTML = `
                <div class="text-xs text-slate-500 font-medium">Сторінка ${meta.current_page || 1} з ${meta.last_page || 1} (Всього: ${meta.total || users.length})</div>
                <div class="flex space-x-2">
                    <button type="button" data-action="page-users" data-page="${currentUserPage - 1}" ${currentUserPage <= 1 ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Попередня</button>
                    <button type="button" data-action="page-users" data-page="${currentUserPage + 1}" ${currentUserPage >= (meta.last_page || 1) ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Наступна</button>
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = `<div class="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl col-span-full">Помилка: ${escapeHtml(err.message)}</div>`;
    }
}

function startEditPost(post) {
    const idInput = document.getElementById('editPostId');
    const headerInput = document.getElementById('editPostHeader');
    const descInput = document.getElementById('editPostDescription');
    if (!idInput || !headerInput || !descInput) return;

    idInput.value = post.id;
    headerInput.value = post.header || '';
    descInput.value = post.description || '';

    clearFieldError('editPostHeader', 'editPostHeaderError');
    clearFieldError('editPostDescription', 'editPostDescriptionError');
    updateCounters('editPost');

    const postTagIds = (post.tags || []).map(t => t.id);
    document.querySelectorAll('#editPostTagCheckboxes input[name="tags"]').forEach(cb => {
        cb.checked = postTagIds.includes(parseInt(cb.value));
    });

    openModal('editPostModal');
}

function initEventHandlers() {
    document.addEventListener('click', (e) => {
        const modalOpenTrigger = e.target.closest('[data-modal-open]');
        if (modalOpenTrigger) {
            const modalId = modalOpenTrigger.getAttribute('data-modal-open');
            openModal(modalId);
            if (modalId === 'newPostModal') {
                restoreArticleDraft();
            }
            return;
        }

        const modalCloseTrigger = e.target.closest('[data-modal-close]');
        if (modalCloseTrigger) {
            const modalId = modalCloseTrigger.getAttribute('data-modal-close');
            closeModal(modalId);
            return;
        }

        if (e.target.classList.contains('modal-backdrop')) {
            e.target.classList.add('hidden');
            return;
        }

        const tabTrigger = e.target.closest('[data-tab]');
        if (tabTrigger) {
            switchTab(tabTrigger.getAttribute('data-tab'));
            return;
        }

        if (e.target.closest('#refreshBtn')) {
            refreshCurrentTab();
            return;
        }

        if (e.target.closest('#clearDraftBtn')) {
            clearArticleDraft();
            return;
        }

        if (e.target.closest('#logoutBtn')) {
            (async () => {
                try {
                    await logoutUser();
                } catch (err) {
                    console.error(err);
                }
                clearAuth();
                showToast('Ви вийшли з системи');
                updateAuthDisplay();
                refreshCurrentTab();
            })();
            return;
        }

        const actionBtn = e.target.closest('[data-action]');
        if (actionBtn) {
            const action = actionBtn.getAttribute('data-action');
            const id = parseInt(actionBtn.getAttribute('data-id'));
            const page = parseInt(actionBtn.getAttribute('data-page'));

            if (action === 'edit-post' && currentPostsMap.has(id)) {
                startEditPost(currentPostsMap.get(id));
            } else if (action === 'delete-post') {
                if (confirm('Ви впевнені, що хочете видалити цю статтю?')) {
                    (async () => {
                        try {
                            const res = await deletePost(id);
                            if (res.ok) {
                                showToast('Статтю видалено!');
                                loadPosts(currentPostPage);
                            } else {
                                const json = await res.json();
                                showToast(json.message || 'Помилка видалення', true);
                            }
                        } catch (err) {
                            showToast(err.message, true);
                        }
                    })();
                }
            } else if (action === 'delete-tag') {
                if (confirm('Видалити цей тег?')) {
                    (async () => {
                        try {
                            const res = await deleteTag(id);
                            if (res.ok) {
                                showToast('Тег видалено!');
                                loadTags();
                                loadTagsForSelects();
                            } else {
                                const json = await res.json();
                                showToast(json.message || 'Помилка видалення', true);
                            }
                        } catch (err) {
                            showToast(err.message, true);
                        }
                    })();
                }
            } else if (action === 'page-posts' && !isNaN(page) && page >= 1) {
                loadPosts(page);
            } else if (action === 'page-users' && !isNaN(page) && page >= 1) {
                loadUsers(page);
            }
        }
    });

    const newPostForm = document.getElementById('newPostForm');
    if (newPostForm) {
        newPostForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const headerInput = document.getElementById('postHeader');
            const descInput = document.getElementById('postDescription');
            const header = headerInput ? headerInput.value.trim() : '';
            const description = descInput ? descInput.value.trim() : '';
            const selectedTags = Array.from(document.querySelectorAll('#postTagCheckboxes input[name="tags"]:checked'))
                .map(cb => parseInt(cb.value));

            const isValid = validatePostFields(header, description, 'post');
            if (!isValid) {
                showToast('Будь ласка, виправте помилки у формі', true);
                return;
            }

            const submitBtn = document.getElementById('submitPostBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Публікація...';
            }

            try {
                const res = await createPost({ header, description, tags: selectedTags });
                const json = await res.json();

                if (res.ok) {
                    showToast('Статтю успішно створено та опубліковано!');
                    clearArticleDraft(false);
                    closeModal('newPostModal');
                    loadPosts(1);
                } else if (res.status === 422) {
                    if (json.errors) {
                        if (json.errors.header) {
                            setFieldError('postHeader', 'postHeaderError', json.errors.header[0]);
                        }
                        if (json.errors.description) {
                            setFieldError('postDescription', 'postDescriptionError', json.errors.description[0]);
                        }
                        if (json.errors.tags) {
                            setFieldError('postTagCheckboxes', 'postTagsError', json.errors.tags[0]);
                        }
                    }
                    showToast(json.message || 'Помилка валідації на сервері', true);
                } else {
                    showToast(json.message || 'Помилка при створенні статті', true);
                }
            } catch (err) {
                showToast('Помилка з\'єднання: ' + err.message, true);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Опублікувати';
                }
            }
        });
    }

    const postHeaderEl = document.getElementById('postHeader');
    if (postHeaderEl) {
        postHeaderEl.addEventListener('input', () => {
            updateCounters('post');
            saveArticleDraft();
            const val = postHeaderEl.value.trim();
            if (val.length >= 5 && val.length <= 100) {
                clearFieldError('postHeader', 'postHeaderError');
            }
        });
    }

    const postDescEl = document.getElementById('postDescription');
    if (postDescEl) {
        postDescEl.addEventListener('input', () => {
            updateCounters('post');
            saveArticleDraft();
            const val = postDescEl.value.trim();
            if (val.length >= 20) {
                clearFieldError('postDescription', 'postDescriptionError');
            }
        });
    }

    const postTagsContainer = document.getElementById('postTagCheckboxes');
    if (postTagsContainer) {
        postTagsContainer.addEventListener('change', () => {
            saveArticleDraft();
        });
    }

    const editPostForm = document.getElementById('editPostForm');
    if (editPostForm) {
        editPostForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const id = document.getElementById('editPostId')?.value;
            const headerInput = document.getElementById('editPostHeader');
            const descInput = document.getElementById('editPostDescription');
            const header = headerInput ? headerInput.value.trim() : '';
            const description = descInput ? descInput.value.trim() : '';
            const selectedTags = Array.from(document.querySelectorAll('#editPostTagCheckboxes input[name="tags"]:checked'))
                .map(cb => parseInt(cb.value));

            const isValid = validatePostFields(header, description, 'editPost');
            if (!isValid) {
                showToast('Будь ласка, виправте помилки', true);
                return;
            }

            const submitBtn = document.getElementById('submitEditPostBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Збереження...';
            }

            try {
                const res = await updatePost(id, { header, description, tags: selectedTags });
                const json = await res.json();
                if (res.ok) {
                    showToast('Статтю успішно оновлено!');
                    closeModal('editPostModal');
                    loadPosts(currentPostPage);
                } else if (res.status === 422 && json.errors) {
                    if (json.errors.header) setFieldError('editPostHeader', 'editPostHeaderError', json.errors.header[0]);
                    if (json.errors.description) setFieldError('editPostDescription', 'editPostDescriptionError', json.errors.description[0]);
                    showToast(json.message || 'Помилка валідації на сервері', true);
                } else {
                    showToast(json.message || 'Помилка оновлення', true);
                }
            } catch (err) {
                showToast('Помилка: ' + err.message, true);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Зберегти зміни';
                }
            }
        });
    }

    const editHeaderEl = document.getElementById('editPostHeader');
    if (editHeaderEl) {
        editHeaderEl.addEventListener('input', () => {
            updateCounters('editPost');
            if (editHeaderEl.value.trim().length >= 5 && editHeaderEl.value.trim().length <= 100) {
                clearFieldError('editPostHeader', 'editPostHeaderError');
            }
        });
    }

    const editDescEl = document.getElementById('editPostDescription');
    if (editDescEl) {
        editDescEl.addEventListener('input', () => {
            updateCounters('editPost');
            if (editDescEl.value.trim().length >= 20) {
                clearFieldError('editPostDescription', 'editPostDescriptionError');
            }
        });
    }

    const tagNameEl = document.getElementById('tagName');
    if (tagNameEl) {
        tagNameEl.addEventListener('input', () => {
            const slugEl = document.getElementById('tagSlug');
            if (slugEl) {
                slugEl.value = tagNameEl.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }
        });
    }

    const newTagForm = document.getElementById('newTagForm');
    if (newTagForm) {
        newTagForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const tag_name = document.getElementById('tagName')?.value.trim() || '';
            const tag_slug = document.getElementById('tagSlug')?.value.trim() || '';

            try {
                const res = await createTag({ tag_name, tag_slug });
                const json = await res.json();
                if (res.ok) {
                    showToast('Тег створено!');
                    closeModal('newTagModal');
                    const nameInput = document.getElementById('tagName');
                    const slugInput = document.getElementById('tagSlug');
                    if (nameInput) nameInput.value = '';
                    if (slugInput) slugInput.value = '';
                    loadTagsForSelects();
                    if (currentTab === 'tags') loadTags();
                } else {
                    showToast(json.message || 'Помилка створення тегу', true);
                }
            } catch (err) {
                showToast(err.message, true);
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value.trim() || '';
            const password = document.getElementById('loginPassword')?.value.trim() || '';

            try {
                const res = await loginUser({ email, password });
                const json = await res.json();
                if (res.ok && json.token) {
                    setAuth(json.token, json.user);
                    showToast('Успішний вхід!');
                    closeModal('loginModal');
                    updateAuthDisplay();
                    refreshCurrentTab();
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
                const json = await res.json();
                if (res.ok && json.token) {
                    setAuth(json.token, json.user);
                    showToast('Реєстрація успішна!');
                    closeModal('registerModal');
                    updateAuthDisplay();
                    refreshCurrentTab();
                } else {
                    showToast(json.message || 'Помилка реєстрації', true);
                }
            } catch (err) {
                showToast(err.message, true);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initEventHandlers();
    updateAuthDisplay();
    loadTagsForSelects();
    loadPosts(1);
    restoreArticleDraft();
});
