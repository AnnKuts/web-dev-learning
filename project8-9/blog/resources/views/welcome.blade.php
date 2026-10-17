<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog API Dashboard — Варіант 3</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">

    <div id="toast" class="fixed top-5 right-5 z-50 transform transition-all duration-300 translate-y-[-100px] opacity-0 pointer-events-none max-w-md bg-white border border-slate-200 shadow-xl rounded-xl p-4 flex items-center space-x-3">
        <span id="toastIcon" class="text-xl">✅</span>
        <div class="flex-1 text-sm font-medium" id="toastMessage">Повідомлення</div>
    </div>

    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-100">
                    B
                </div>
                <div>
                    <h1 class="text-lg font-bold text-slate-900 leading-tight">Блог / CMS статей <span class="text-xs font-normal text-slate-500">(Варіант №3)</span></h1>
                    <div class="flex items-center space-x-2 text-xs">
                        @if(app()->isLocal() && config('auth.dev_bypass'))
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Dev Auth Bypass ({{ config('auth.dev_user_email') }})
                            </span>
                        @else
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Sanctum Required
                            </span>
                        @endif
                    </div>
                </div>
            </div>

            <div class="flex items-center space-x-3">
                <div id="userState" class="text-sm font-medium text-slate-600 flex items-center space-x-2"></div>
                <button onclick="openModal('newPostModal')" class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-indigo-200 flex items-center space-x-1">
                    <span>+ Створити статтю</span>
                </button>
            </div>
        </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <nav class="flex space-x-2 bg-slate-200/70 p-1 rounded-xl w-fit">
                <button onclick="switchTab('posts')" id="tabBtn-posts" class="tab-btn px-4 py-1.5 rounded-lg text-sm font-medium bg-white text-slate-900 shadow-sm transition">
                    Статті
                </button>
                <button onclick="switchTab('tags')" id="tabBtn-tags" class="tab-btn px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 transition">
                    Теги
                </button>
                <button onclick="switchTab('users')" id="tabBtn-users" class="tab-btn px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 transition">
                    Користувачі
                </button>
            </nav>

            <div class="flex items-center space-x-2">
                <button onclick="openModal('newTagModal')" class="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg transition shadow-2xs">
                    + Новий тег
                </button>
                <button onclick="refreshCurrentTab()" class="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg transition shadow-2xs">
                    🔄 Оновити
                </button>
            </div>
        </div>

        <section id="tab-posts" class="tab-content">
            <div id="postsList" class="space-y-4">
                <div class="p-8 text-center text-slate-400">Завантаження статей...</div>
            </div>
            <div id="postsPagination" class="mt-6 flex items-center justify-between"></div>
        </section>

        <section id="tab-tags" class="tab-content hidden">
            <div id="tagsList" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div class="p-8 text-center text-slate-400 col-span-full">Завантаження тегів...</div>
            </div>
        </section>

        <section id="tab-users" class="tab-content hidden">
            <div id="usersList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="p-8 text-center text-slate-400 col-span-full">Завантаження користувачів...</div>
            </div>
            <div id="usersPagination" class="mt-6 flex items-center justify-between"></div>
        </section>
    </div>

    <div id="newPostModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-lg font-bold text-slate-900">Нова стаття (Варіант №3)</h2>
                    <p class="text-xs text-slate-500">Заголовок: 5–100 симв. • Контент: від 20 симв. • Автозбереження</p>
                </div>
                <div id="draftStatus" class="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 hidden">
                    💾 Чернетка збережена
                </div>
            </div>

            <form id="newPostForm" class="space-y-4" novalidate>
                <div>
                    <div class="flex justify-between items-center mb-1">
                        <label for="postHeader" class="block text-sm font-medium text-slate-700">Заголовок (title) <span class="text-rose-500">*</span></label>
                        <span id="headerCounter" class="text-xs text-slate-400">0 / 100</span>
                    </div>
                    <input type="text" id="postHeader" name="header" required minlength="5" maxlength="100" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition" placeholder="Введіть заголовок статті (5–100 символів)...">
                    <p id="postHeaderError" class="text-xs text-rose-600 font-medium mt-1 hidden"></p>
                </div>

                <div>
                    <div class="flex justify-between items-center mb-1">
                        <label for="postDescription" class="block text-sm font-medium text-slate-700">Контент статті (content) <span class="text-rose-500">*</span></label>
                        <span id="descCounter" class="text-xs text-slate-400">0 символів (мін. 20)</span>
                    </div>
                    <textarea id="postDescription" name="description" rows="5" required minlength="20" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition" placeholder="Текст статті (не менше 20 символів)..."></textarea>
                    <p id="postDescriptionError" class="text-xs text-rose-600 font-medium mt-1 hidden"></p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Теги (tags)</label>
                    <div id="postTagCheckboxes" class="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50"></div>
                    <p id="postTagsError" class="text-xs text-rose-600 font-medium mt-1 hidden"></p>
                </div>

                <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button type="button" onclick="clearArticleDraft()" class="text-xs text-slate-500 hover:text-rose-600 hover:underline">
                        🗑️ Очистити чернетку
                    </button>
                    <div class="flex space-x-2">
                        <button type="button" onclick="closeModal('newPostModal')" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Скасувати</button>
                        <button type="submit" id="submitPostBtn" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition">Опублікувати</button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <div id="editPostModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <h2 class="text-lg font-bold text-slate-900 mb-4">Редагувати статтю</h2>
            <form id="editPostForm" class="space-y-4" novalidate>
                <input type="hidden" id="editPostId">
                <div>
                    <div class="flex justify-between items-center mb-1">
                        <label for="editPostHeader" class="block text-sm font-medium text-slate-700">Заголовок (title)</label>
                        <span id="editHeaderCounter" class="text-xs text-slate-400">0 / 100</span>
                    </div>
                    <input type="text" id="editPostHeader" required minlength="5" maxlength="100" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition">
                    <p id="editPostHeaderError" class="text-xs text-rose-600 font-medium mt-1 hidden"></p>
                </div>
                <div>
                    <div class="flex justify-between items-center mb-1">
                        <label for="editPostDescription" class="block text-sm font-medium text-slate-700">Контент (content)</label>
                        <span id="editDescCounter" class="text-xs text-slate-400">0 символів (мін. 20)</span>
                    </div>
                    <textarea id="editPostDescription" rows="5" required minlength="20" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition"></textarea>
                    <p id="editPostDescriptionError" class="text-xs text-rose-600 font-medium mt-1 hidden"></p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Теги</label>
                    <div id="editPostTagCheckboxes" class="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50"></div>
                </div>
                <div class="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button type="button" onclick="closeModal('editPostModal')" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Скасувати</button>
                    <button type="submit" id="submitEditPostBtn" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition">Зберегти зміни</button>
                </div>
            </form>
        </div>
    </div>

    <div id="newTagModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <h2 class="text-lg font-bold text-slate-900 mb-4">Додати новий тег</h2>
            <form onsubmit="handleCreateTag(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Назва тегу</label>
                    <input type="text" id="tagName" required oninput="generateSlug(this.value)" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden" placeholder="Наприклад: React">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Slug (слаг)</label>
                    <input type="text" id="tagSlug" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden" placeholder="наприклад: react">
                </div>
                <div class="flex justify-end space-x-2 pt-2">
                    <button type="button" onclick="closeModal('newTagModal')" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Скасувати</button>
                    <button type="submit" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm">Створити</button>
                </div>
            </form>
        </div>
    </div>

    <div id="loginModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <h2 class="text-lg font-bold text-slate-900 mb-4">Авторизація</h2>
            <form onsubmit="handleLogin(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" id="loginEmail" required value="admin@example.com" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
                    <input type="password" id="loginPassword" required value="password" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
                </div>
                <div class="flex justify-end space-x-2 pt-2">
                    <button type="button" onclick="closeModal('loginModal')" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Скасувати</button>
                    <button type="submit" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm">Увійти</button>
                </div>
            </form>
        </div>
    </div>

    <div id="registerModal" class="modal-backdrop fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 hidden">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <h2 class="text-lg font-bold text-slate-900 mb-4">Реєстрація</h2>
            <form onsubmit="handleRegister(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Username</label>
                    <input type="text" id="regUsername" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" id="regEmail" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
                    <input type="password" id="regPassword" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Підтвердження паролю</label>
                    <input type="password" id="regPasswordConf" required class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Біографія (опціонально)</label>
                    <textarea id="regBio" rows="2" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"></textarea>
                </div>
                <div class="flex justify-end space-x-2 pt-2">
                    <button type="button" onclick="closeModal('registerModal')" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Скасувати</button>
                    <button type="submit" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm">Зареєструватися</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const DRAFT_STORAGE_KEY = 'article_draft_variant3';

        let currentTab = 'posts';
        let currentPostPage = 1;
        let currentUserPage = 1;
        let allTags = [];
        let authToken = localStorage.getItem('auth_token') || '';
        let currentUser = JSON.parse(localStorage.getItem('auth_user') || 'null');

        function getHeaders() {
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            return headers;
        }

        function showToast(msg, isError = false) {
            const toast = document.getElementById('toast');
            const icon = document.getElementById('toastIcon');
            const message = document.getElementById('toastMessage');

            icon.innerText = isError ? '❌' : '✅';
            message.innerText = msg;
            toast.classList.remove('translate-y-[-100px]', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');

            setTimeout(() => {
                toast.classList.add('translate-y-[-100px]', 'opacity-0');
                toast.classList.remove('translate-y-0', 'opacity-100');
            }, 3000);
        }

        function openModal(id) {
            document.getElementById(id).classList.remove('hidden');
            if (id === 'newPostModal') {
                restoreArticleDraft();
            }
        }

        function closeModal(id) {
            document.getElementById(id).classList.add('hidden');
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
            document.getElementById(`tab-${tab}`).classList.remove('hidden');

            refreshCurrentTab();
        }

        function refreshCurrentTab() {
            if (currentTab === 'posts') loadPosts(currentPostPage);
            if (currentTab === 'tags') loadTags();
            if (currentTab === 'users') loadUsers(currentUserPage);
        }

        function renderUserState() {
            const stateDiv = document.getElementById('userState');
            if (authToken && currentUser) {
                stateDiv.innerHTML = `
                    <span class="text-slate-900 font-semibold">${currentUser.username}</span>
                    <button onclick="handleLogout()" class="text-xs text-rose-600 hover:underline">Вийти</button>
                `;
            } else if (authToken) {
                stateDiv.innerHTML = `
                    <span class="text-slate-900 font-semibold">Токен активний</span>
                    <button onclick="handleLogout()" class="text-xs text-rose-600 hover:underline">Вийти</button>
                `;
            } else {
                stateDiv.innerHTML = `
                    <button onclick="openModal('loginModal')" class="text-xs text-indigo-600 hover:underline font-semibold">Увійти</button>
                    <span class="text-slate-300">|</span>
                    <button onclick="openModal('registerModal')" class="text-xs text-indigo-600 hover:underline font-semibold">Реєстрація</button>
                `;
            }
        }

        function saveArticleDraft() {
            const headerInput = document.getElementById('postHeader');
            const descInput = document.getElementById('postDescription');
            const selectedTags = Array.from(document.querySelectorAll('#postTagCheckboxes input[name="tags"]:checked'))
                .map(cb => parseInt(cb.value));

            const draft = {
                header: headerInput ? headerInput.value : '',
                description: descInput ? descInput.value : '',
                tags: selectedTags,
                savedAt: new Date().toLocaleTimeString('uk-UA')
            };

            if (draft.header || draft.description || draft.tags.length > 0) {
                localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
                const draftStatus = document.getElementById('draftStatus');
                if (draftStatus) {
                    draftStatus.innerText = `💾 Чернетку збережено о ${draft.savedAt}`;
                    draftStatus.classList.remove('hidden');
                }
            }
        }

        function restoreArticleDraft() {
            const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (!raw) return;

            try {
                const draft = JSON.parse(raw);
                const headerInput = document.getElementById('postHeader');
                const descInput = document.getElementById('postDescription');
                const draftStatus = document.getElementById('draftStatus');

                if (headerInput && draft.header !== undefined) {
                    headerInput.value = draft.header;
                }
                if (descInput && draft.description !== undefined) {
                    descInput.value = draft.description;
                }
                if (Array.isArray(draft.tags)) {
                    document.querySelectorAll('#postTagCheckboxes input[name="tags"]').forEach(cb => {
                        cb.checked = draft.tags.includes(parseInt(cb.value));
                    });
                }
                updateCounters();
                if (draftStatus && draft.savedAt) {
                    draftStatus.innerText = `💾 Чернетку відновлено (${draft.savedAt})`;
                    draftStatus.classList.remove('hidden');
                }
            } catch (e) {
                console.error('Failed to parse draft from localStorage', e);
            }
        }

        function clearArticleDraft(notify = true) {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            const headerInput = document.getElementById('postHeader');
            const descInput = document.getElementById('postDescription');
            const draftStatus = document.getElementById('draftStatus');

            if (headerInput) headerInput.value = '';
            if (descInput) descInput.value = '';
            document.querySelectorAll('#postTagCheckboxes input[name="tags"]').forEach(cb => {
                cb.checked = false;
            });

            clearFieldError('postHeader', 'postHeaderError');
            clearFieldError('postDescription', 'postDescriptionError');
            updateCounters();

            if (draftStatus) {
                draftStatus.classList.add('hidden');
            }
            if (notify) {
                showToast('Чернетку очищено');
            }
        }

        function updateCounters() {
            const headerVal = document.getElementById('postHeader')?.value || '';
            const descVal = document.getElementById('postDescription')?.value || '';
            const headerCounter = document.getElementById('headerCounter');
            const descCounter = document.getElementById('descCounter');

            if (headerCounter) {
                headerCounter.innerText = `${headerVal.length} / 100`;
                headerCounter.className = (headerVal.length > 0 && (headerVal.length < 5 || headerVal.length > 100))
                    ? 'text-xs text-rose-500 font-medium'
                    : 'text-xs text-slate-400';
            }
            if (descCounter) {
                descCounter.innerText = `${descVal.length} символів (мін. 20)`;
                descCounter.className = (descVal.length > 0 && descVal.length < 20)
                    ? 'text-xs text-rose-500 font-medium'
                    : 'text-xs text-slate-400';
            }
        }

        function updateEditCounters() {
            const headerVal = document.getElementById('editPostHeader')?.value || '';
            const descVal = document.getElementById('editPostDescription')?.value || '';
            const headerCounter = document.getElementById('editHeaderCounter');
            const descCounter = document.getElementById('editDescCounter');

            if (headerCounter) {
                headerCounter.innerText = `${headerVal.length} / 100`;
                headerCounter.className = (headerVal.length > 0 && (headerVal.length < 5 || headerVal.length > 100))
                    ? 'text-xs text-rose-500 font-medium'
                    : 'text-xs text-slate-400';
            }
            if (descCounter) {
                descCounter.innerText = `${descVal.length} символів (мін. 20)`;
                descCounter.className = (descVal.length > 0 && descVal.length < 20)
                    ? 'text-xs text-rose-500 font-medium'
                    : 'text-xs text-slate-400';
            }
        }

        function setFieldError(inputId, errorId, message) {
            const input = document.getElementById(inputId);
            const errorEl = document.getElementById(errorId);
            if (input) {
                input.classList.add('border-rose-500', 'bg-rose-50/30');
                input.classList.remove('border-slate-300');
            }
            if (errorEl) {
                errorEl.innerText = message;
                errorEl.classList.remove('hidden');
            }
        }

        function clearFieldError(inputId, errorId) {
            const input = document.getElementById(inputId);
            const errorEl = document.getElementById(errorId);
            if (input) {
                input.classList.remove('border-rose-500', 'bg-rose-50/30');
                input.classList.add('border-slate-300');
            }
            if (errorEl) {
                errorEl.innerText = '';
                errorEl.classList.add('hidden');
            }
        }

        function validatePostFields(header, description) {
            let isValid = true;

            if (!header || header.length < 5) {
                setFieldError('postHeader', 'postHeaderError', `Заголовок занадто короткий (потрібно від 5 до 100 символів, зараз: ${header.length}).`);
                isValid = false;
            } else if (header.length > 100) {
                setFieldError('postHeader', 'postHeaderError', `Заголовок занадто довгий (максимум 100 символів, зараз: ${header.length}).`);
                isValid = false;
            } else {
                clearFieldError('postHeader', 'postHeaderError');
            }

            if (!description || description.length < 20) {
                setFieldError('postDescription', 'postDescriptionError', `Контент занадто короткий (потрібно щонайменше 20 символів, зараз: ${description.length}).`);
                isValid = false;
            } else {
                clearFieldError('postDescription', 'postDescriptionError');
            }

            return isValid;
        }

        async function loadTagsForSelects() {
            try {
                const res = await fetch('/api/tags', { headers: getHeaders() });
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
                            <span>#${tag.tag_name}</span>
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
            container.innerHTML = '<div class="p-8 text-center text-slate-400">Завантаження...</div>';

            try {
                const res = await fetch(`/api/posts?page=${page}`, { headers: getHeaders() });
                if (res.status === 401) {
                    container.innerHTML = `
                        <div class="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center">
                            <h3 class="font-bold text-base mb-1">Потрібна авторизація</h3>
                            <p class="text-sm mb-4">Для перегляду та взаємодії зі статтями потрібен Bearer токен або включений DEV_AUTH_BYPASS.</p>
                            <button onclick="openModal('loginModal')" class="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg">Увійти</button>
                        </div>
                    `;
                    pagination.innerHTML = '';
                    return;
                }

                const json = await res.json();
                const posts = json.data || [];

                if (posts.length === 0) {
                    container.innerHTML = '<div class="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">Статей поки немає. Створіть першу!</div>';
                    pagination.innerHTML = '';
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
                                    <span class="font-medium text-slate-600">👤 ${escapeHtml(post.user?.username || 'Невідомий')}</span>
                                    <span>•</span>
                                    <span>🕒 ${new Date(post.created_at).toLocaleString('uk-UA')}</span>
                                </div>
                            </div>

                            <div class="flex items-center space-x-2 shrink-0">
                                <button onclick='startEditPost(${JSON.stringify(post)})' class="p-2 text-slate-400 hover:text-indigo-600 transition" title="Редагувати">
                                    ✏️
                                </button>
                                <button onclick="handleDeletePost(${post.id})" class="p-2 text-slate-400 hover:text-rose-600 transition" title="Видалити">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </article>
                `).join('');

                const meta = json.meta || {};
                pagination.innerHTML = `
                    <div class="text-xs text-slate-500 font-medium">Сторінка ${meta.current_page || 1} з ${meta.last_page || 1} (Всього: ${meta.total || posts.length})</div>
                    <div class="flex space-x-2">
                        <button onclick="loadPosts(${currentPostPage - 1})" ${currentPostPage <= 1 ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Попередня</button>
                        <button onclick="loadPosts(${currentPostPage + 1})" ${currentPostPage >= (meta.last_page || 1) ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Наступна</button>
                    </div>
                `;

            } catch (err) {
                container.innerHTML = `<div class="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl">Помилка завантаження: ${err.message}</div>`;
            }
        }

        async function loadTags() {
            const container = document.getElementById('tagsList');
            container.innerHTML = '<div class="p-8 text-center text-slate-400 col-span-full">Завантаження...</div>';

            try {
                const res = await fetch('/api/tags', { headers: getHeaders() });
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
                        <button onclick="handleDeleteTag(${tag.id})" class="text-slate-300 hover:text-rose-600 p-1 transition" title="Видалити тег">
                            🗑️
                        </button>
                    </div>
                `).join('');
            } catch (err) {
                container.innerHTML = `<div class="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl col-span-full">Помилка: ${err.message}</div>`;
            }
        }

        async function loadUsers(page = 1) {
            currentUserPage = page;
            const container = document.getElementById('usersList');
            const pagination = document.getElementById('usersPagination');
            container.innerHTML = '<div class="p-8 text-center text-slate-400 col-span-full">Завантаження...</div>';

            try {
                const res = await fetch(`/api/users?page=${page}`, { headers: getHeaders() });
                if (res.status === 401) {
                    container.innerHTML = `<div class="p-6 text-center text-amber-700 bg-amber-50 rounded-2xl col-span-full">Потрібна авторизація для перегляду користувачів.</div>`;
                    pagination.innerHTML = '';
                    return;
                }
                const json = await res.json();
                const users = json.data || [];

                if (users.length === 0) {
                    container.innerHTML = '<div class="p-8 text-center text-slate-400 col-span-full bg-white border border-slate-200 rounded-2xl">Користувачів не знайдено.</div>';
                    pagination.innerHTML = '';
                    return;
                }

                container.innerHTML = users.map(user => `
                    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                        <div class="flex items-center space-x-3 mb-3">
                            <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-indigo-600">
                                ${(user.username || 'U')[0].toUpperCase()}
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
                pagination.innerHTML = `
                    <div class="text-xs text-slate-500 font-medium">Сторінка ${meta.current_page || 1} з ${meta.last_page || 1} (Всього: ${meta.total || users.length})</div>
                    <div class="flex space-x-2">
                        <button onclick="loadUsers(${currentUserPage - 1})" ${currentUserPage <= 1 ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Попередня</button>
                        <button onclick="loadUsers(${currentUserPage + 1})" ${currentUserPage >= (meta.last_page || 1) ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 text-xs border rounded-lg bg-white"' : 'class="px-3 py-1 text-xs border rounded-lg bg-white hover:bg-slate-50"'}>Наступна</button>
                    </div>
                `;
            } catch (err) {
                container.innerHTML = `<div class="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl col-span-full">Помилка: ${err.message}</div>`;
            }
        }

        const newPostForm = document.getElementById('newPostForm');
        if (newPostForm) {
            newPostForm.addEventListener('submit', async function (event) {
                event.preventDefault();

                const headerInput = document.getElementById('postHeader');
                const descInput = document.getElementById('postDescription');
                const header = headerInput ? headerInput.value.trim() : '';
                const description = descInput ? descInput.value.trim() : '';
                const selectedTags = Array.from(document.querySelectorAll('#postTagCheckboxes input[name="tags"]:checked'))
                    .map(cb => parseInt(cb.value));

                const isValid = validatePostFields(header, description);
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
                    const res = await fetch('/api/posts', {
                        method: 'POST',
                        headers: getHeaders(),
                        body: JSON.stringify({ header, description, tags: selectedTags })
                    });

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
                updateCounters();
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
                updateCounters();
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

        function startEditPost(post) {
            document.getElementById('editPostId').value = post.id;
            const headerInput = document.getElementById('editPostHeader');
            const descInput = document.getElementById('editPostDescription');
            headerInput.value = post.header;
            descInput.value = post.description;

            clearFieldError('editPostHeader', 'editPostHeaderError');
            clearFieldError('editPostDescription', 'editPostDescriptionError');
            updateEditCounters();

            const postTagIds = (post.tags || []).map(t => t.id);
            document.querySelectorAll('#editPostTagCheckboxes input[name="tags"]').forEach(cb => {
                cb.checked = postTagIds.includes(parseInt(cb.value));
            });

            openModal('editPostModal');
        }

        const editPostForm = document.getElementById('editPostForm');
        if (editPostForm) {
            editPostForm.addEventListener('submit', async function (event) {
                event.preventDefault();
                const id = document.getElementById('editPostId').value;
                const headerInput = document.getElementById('editPostHeader');
                const descInput = document.getElementById('editPostDescription');
                const header = headerInput ? headerInput.value.trim() : '';
                const description = descInput ? descInput.value.trim() : '';
                const selectedTags = Array.from(document.querySelectorAll('#editPostTagCheckboxes input[name="tags"]:checked'))
                    .map(cb => parseInt(cb.value));

                let isValid = true;
                if (!header || header.length < 5 || header.length > 100) {
                    setFieldError('editPostHeader', 'editPostHeaderError', `Заголовок має бути від 5 до 100 символів (зараз: ${header.length}).`);
                    isValid = false;
                } else {
                    clearFieldError('editPostHeader', 'editPostHeaderError');
                }

                if (!description || description.length < 20) {
                    setFieldError('editPostDescription', 'editPostDescriptionError', `Контент має містити щонайменше 20 символів (зараз: ${description.length}).`);
                    isValid = false;
                } else {
                    clearFieldError('editPostDescription', 'editPostDescriptionError');
                }

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
                    const res = await fetch(`/api/posts/${id}`, {
                        method: 'PUT',
                        headers: getHeaders(),
                        body: JSON.stringify({ header, description, tags: selectedTags })
                    });
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
                updateEditCounters();
                if (editHeaderEl.value.trim().length >= 5 && editHeaderEl.value.trim().length <= 100) {
                    clearFieldError('editPostHeader', 'editPostHeaderError');
                }
            });
        }

        const editDescEl = document.getElementById('editPostDescription');
        if (editDescEl) {
            editDescEl.addEventListener('input', () => {
                updateEditCounters();
                if (editDescEl.value.trim().length >= 20) {
                    clearFieldError('editPostDescription', 'editPostDescriptionError');
                }
            });
        }

        async function handleDeletePost(id) {
            if (!confirm('Ви впевнені, що хочете видалити цю статтю?')) return;
            try {
                const res = await fetch(`/api/posts/${id}`, {
                    method: 'DELETE',
                    headers: getHeaders(),
                });
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
        }

        function generateSlug(val) {
            document.getElementById('tagSlug').value = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }

        async function handleCreateTag(e) {
            e.preventDefault();
            const tag_name = document.getElementById('tagName').value.trim();
            const tag_slug = document.getElementById('tagSlug').value.trim();

            try {
                const res = await fetch('/api/tags', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ tag_name, tag_slug })
                });
                const json = await res.json();
                if (res.ok) {
                    showToast('Тег створено!');
                    closeModal('newTagModal');
                    document.getElementById('tagName').value = '';
                    document.getElementById('tagSlug').value = '';
                    loadTagsForSelects();
                    if (currentTab === 'tags') loadTags();
                } else {
                    showToast(json.message || 'Помилка створення тегу', true);
                }
            } catch (err) {
                showToast(err.message, true);
            }
        }

        async function handleDeleteTag(id) {
            if (!confirm('Видалити цей тег?')) return;
            try {
                const res = await fetch(`/api/tags/${id}`, {
                    method: 'DELETE',
                    headers: getHeaders(),
                });
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
        }

        async function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const json = await res.json();
                if (res.ok && json.token) {
                    authToken = json.token;
                    currentUser = json.user;
                    localStorage.setItem('auth_token', authToken);
                    localStorage.setItem('auth_user', JSON.stringify(currentUser));
                    showToast('Успішний вхід!');
                    closeModal('loginModal');
                    renderUserState();
                    refreshCurrentTab();
                } else {
                    showToast(json.message || 'Невірні облікові дані', true);
                }
            } catch (err) {
                showToast(err.message, true);
            }
        }

        async function handleRegister(e) {
            e.preventDefault();
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const password_confirmation = document.getElementById('regPasswordConf').value;
            const user_bio = document.getElementById('regBio').value.trim();

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, password_confirmation, user_bio })
                });
                const json = await res.json();
                if (res.ok && json.token) {
                    authToken = json.token;
                    currentUser = json.user;
                    localStorage.setItem('auth_token', authToken);
                    localStorage.setItem('auth_user', JSON.stringify(currentUser));
                    showToast('Реєстрація успішна!');
                    closeModal('registerModal');
                    renderUserState();
                    refreshCurrentTab();
                } else {
                    showToast(json.message || 'Помилка реєстрації', true);
                }
            } catch (err) {
                showToast(err.message, true);
            }
        }

        async function handleLogout() {
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: getHeaders(),
                });
            } catch (e) {
                console.error(e);
            }
            authToken = '';
            currentUser = null;
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            showToast('Ви вийшли з системи');
            renderUserState();
            refreshCurrentTab();
        }

        function escapeHtml(text) {
            if (!text) return '';
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        renderUserState();
        loadTagsForSelects();
        loadPosts(1);
        restoreArticleDraft();
    </script>
</body>
</html>
