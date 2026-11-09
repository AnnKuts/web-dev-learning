import { initAuth } from './auth.js';
import { initPosts, loadPosts, loadPost, clearPostTagFilter } from './posts.js';
import { initPostForms, startEditPost } from './post-form.js';
import { initTags, loadTags, loadTagsForSelects } from './tags.js';
import { initUsers, loadUsers } from './users.js';
import { initHeaderMenu, initModals } from './ui.js';

let currentTab = 'posts';

function refreshCurrentTab(page) {
    const postPage = document.getElementById('postDetail');
    if (postPage) {
        loadPost(postPage.dataset.postId);
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
    initHeaderMenu();
    initModals();
    initAuth(() => {
        loadTagsForSelects();
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
    initPosts(startEditPost, () => switchTab('posts', 1));
    initTags(refreshCurrentTab);
    initUsers();
    document.querySelectorAll('[data-tab]').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        loadTagsForSelects();
        refreshCurrentTab();
    });
    loadTagsForSelects();
    refreshCurrentTab();
});
