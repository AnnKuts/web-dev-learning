import { initAuth } from './auth.js';
import { initComments, loadComments } from './comments.js';
import { initAvatar } from './avatar.js';
import { initPosts, loadPosts, loadPost, clearPostTagFilter } from './posts.js';
import { initPostForms, startEditPost } from './post-form.js';
import { initTags, loadTags, loadTagsForSelects } from './tags.js';
import { initUsers, loadUsers } from './users.js';
import { initHeaderMenu, initModals, renderGuestState, renderUserState } from './ui.js';
import { getAuthToken, getCurrentUser } from './api.js';

let currentTab = 'posts';

function syncAuthControls() {
    const authenticated = Boolean(getAuthToken());
    document.querySelectorAll('[data-auth-required]').forEach(control => {
        control.hidden = !authenticated;
    });
    if (!authenticated && currentTab !== 'posts') switchTab('posts');
}

function refreshCurrentTab(page) {
    if (!getAuthToken()) {
        renderGuestState(document.getElementById('postsList'));
        renderGuestState(document.getElementById('tagsList'));
        renderGuestState(document.getElementById('usersList'));
        const detail = document.getElementById('postDetail');
        if (detail) {
            document.getElementById('viewPostHeader').textContent = '';
            document.getElementById('viewPostMeta').textContent = '';
            document.getElementById('viewPostTags').textContent = '';
            renderGuestState(document.getElementById('viewPostDescription'));
            renderGuestState(document.getElementById('commentsList'));
            document.getElementById('commentForm')?.classList.add('hidden');
        }
        document.getElementById('postsPagination')?.replaceChildren();
        document.getElementById('usersPagination')?.replaceChildren();
        return;
    }
    const postPage = document.getElementById('postDetail');
    if (postPage) {
        document.getElementById('commentForm')?.classList.remove('hidden');
        loadPost(postPage.dataset.postId);
        loadComments(postPage.dataset.postId);
        if (!document.getElementById('publishedPosts').classList.contains('hidden')) loadPosts(page);
        return;
    }
    if (currentTab === 'posts') loadPosts(page);
    if (currentTab === 'tags') loadTags();
    if (currentTab === 'users') loadUsers();
}

function switchTab(tab, page) {
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

    refreshCurrentTab(page);
}

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('auth:expired', () => {
        renderUserState(getCurrentUser(), getAuthToken());
        syncAuthControls();
        refreshCurrentTab();
    });
    syncAuthControls();
    initHeaderMenu();
    initModals();
    initAuth(() => {
        syncAuthControls();
        if (getAuthToken()) loadTagsForSelects();
        refreshCurrentTab();
    });
    initPostForms(page => {
        if (page === 1) {
            document.getElementById('postSearch').value = '';
            clearPostTagFilter();
        }
        if (document.getElementById('postDetail')) {
            document.getElementById('publishedPosts').classList.remove('hidden');
            refreshCurrentTab(page);
            document.getElementById('publishedPosts').scrollIntoView({ behavior: 'smooth' });
            return;
        }
        switchTab('posts', page);
    });
    initAvatar();
    initComments();
    initPosts(startEditPost, () => switchTab('posts', 1));
    initTags(refreshCurrentTab);
    initUsers();
    document.querySelectorAll('[data-tab]').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        if (getAuthToken()) loadTagsForSelects();
        refreshCurrentTab();
    });
    if (getAuthToken()) loadTagsForSelects();
    refreshCurrentTab();
});
