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

export async function fetchPosts(page = 1) {
    return fetch(`/api/posts?page=${page}`, { headers: getHeaders() });
}

export async function createPost(data) {
    return fetch('/api/posts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
}

export async function updatePost(id, data) {
    return fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
}

export async function deletePost(id) {
    return fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
}

export async function fetchTags() {
    return fetch('/api/tags', { headers: getHeaders() });
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
