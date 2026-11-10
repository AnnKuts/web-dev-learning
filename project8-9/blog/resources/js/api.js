let authToken = localStorage.getItem('auth_token') || '';
let currentUser = JSON.parse(localStorage.getItem('auth_user') || 'null');

export function getAuthToken() {
    return authToken;
}

export function getCurrentUser() {
    return currentUser;
}

export function setAuth(token, user) {
    authToken = token;
    currentUser = user;
    if (token) {
        localStorage.setItem('auth_token', token);
    } else {
        localStorage.removeItem('auth_token');
    }
    if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('auth_user');
    }
}

export function clearAuth() {
    authToken = '';
    currentUser = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
}

export function getHeaders() {
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

export async function fetchPosts(page = 1, query = '', signal, tagId) {
    const params = new URLSearchParams({ page });
    if (query) params.set('q', query);
    if (tagId) params.set('tag', tagId);
    return fetch(`/api/posts?${params}`, { headers: getHeaders(), signal });
}

export async function fetchPost(id, signal) {
    return fetch(`/api/posts/${id}`, { headers: getHeaders(), signal });
}

function postPayload(data) {
    if (!data.images?.length) {
        const { images, remove_images, ...fields } = data;
        if (remove_images?.length) fields.remove_images = remove_images;
        return { headers: getHeaders(), body: JSON.stringify(fields) };
    }
    const body = new FormData();
    body.append('header', data.header);
    body.append('description', data.description);
    data.tags.forEach(id => body.append('tags[]', id));
    if (!data.tags.length) body.append('clear_tags', '1');
    data.images.forEach(file => body.append('images[]', file));
    (data.remove_images || []).forEach(id => body.append('remove_images[]', id));
    const { 'Content-Type': _, ...headers } = getHeaders();
    return { headers, body };
}

export async function createPost(data) {
    return fetch('/api/posts', { method: 'POST', ...postPayload(data) });
}

export async function updatePost(id, data) {
    const payload = postPayload(data);
    if (payload.body instanceof FormData) payload.body.append('_method', 'PUT');
    return fetch(`/api/posts/${id}`, { method: payload.body instanceof FormData ? 'POST' : 'PUT', ...payload });
}

export async function deletePost(id) {
    return fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
}

export async function fetchTags(page = 1) {
    return fetch(`/api/tags?page=${page}`, { headers: getHeaders() });
}

export async function createTag(data) {
    return fetch('/api/tags', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deleteTag(id) {
    return fetch(`/api/tags/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
}

export async function fetchUsers(page = 1) {
    return fetch(`/api/users?page=${page}`, { headers: getHeaders() });
}

export async function updateUserProfile(id, data) {
    const targetId = id ?? currentUser?.id;
    return fetch(`/api/users/${targetId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
}

export async function loginUser(data) {
    return fetch('/api/login', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function registerUser(data) {
    return fetch('/api/register', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function logoutUser() {
    return fetch('/api/logout', {
        method: 'POST',
        headers: getHeaders(),
    });
}

export async function readResponse(response) {
    const json = response.status === 204 ? {} : await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401 && authToken) {
            clearAuth();
            document.dispatchEvent(new Event('auth:expired'));
        }
        const message = response.status === 401 ? 'Потрібна авторизація. Увійдіть у систему.'
            : response.status === 403 ? 'У вас немає дозволу на цю дію.'
            : response.status === 413 ? 'Загальний розмір завантажуваних файлів перевищує допустимий ліміт сервера.'
            : json.message || `Помилка запиту (${response.status}).`;
        const error = new Error(message);
        error.status = response.status;
        error.errors = json.errors || {};
        throw error;
    }
    return json;
}

export async function fetchAllTags() {
    const tags = [];
    let page = 1;
    let lastPage;
    do {
        const json = await readResponse(await fetchTags(page));
        tags.push(...json.data);
        lastPage = json.meta.last_page;
        page++;
    } while (page <= lastPage);
    return tags;
}
