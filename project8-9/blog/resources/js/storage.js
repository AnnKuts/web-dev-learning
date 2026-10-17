import { showToast } from './ui.js';
import { clearPostErrors, updateCounters } from './validation.js';

export const DRAFT_STORAGE_KEY = 'article_draft_variant3';

function readArticleDraft() {
    try {
        return JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || 'null');
    } catch {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return null;
    }
}

export function saveArticleDraft() {
    const headerInput = document.getElementById('postHeader');
    const descInput = document.getElementById('postDescription');
    const tagsLoaded = document.getElementById('postTagCheckboxes')?.dataset.loaded === 'true';
    const previousDraft = readArticleDraft();
    const selectedTags = Array.from(document.querySelectorAll('#postTagCheckboxes input[name="tags"]:checked'))
        .map(cb => parseInt(cb.value));

    const draft = {
        header: headerInput ? headerInput.value : '',
        description: descInput ? descInput.value : '',
        tags: tagsLoaded ? selectedTags : previousDraft?.tags || [],
        savedAt: new Date().toLocaleTimeString('uk-UA')
    };

    if (draft.header || draft.description || draft.tags.length > 0) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        const draftStatus = document.getElementById('draftStatus');
        if (draftStatus) {
            draftStatus.textContent = `Чернетку збережено о ${draft.savedAt}`;
            draftStatus.classList.remove('hidden');
        }
    } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        document.getElementById('draftStatus')?.classList.add('hidden');
    }
}

export function restoreArticleDraft(tagsOnly = false) {
    const draft = readArticleDraft();
    if (!draft) return;

    const headerInput = document.getElementById('postHeader');
    const descInput = document.getElementById('postDescription');
    const draftStatus = document.getElementById('draftStatus');

    if (!tagsOnly && headerInput && draft.header !== undefined) {
        headerInput.value = draft.header;
    }
    if (!tagsOnly && descInput && draft.description !== undefined) {
        descInput.value = draft.description;
    }
    if (Array.isArray(draft.tags)) {
        document.querySelectorAll('#postTagCheckboxes input[name="tags"]').forEach(cb => {
            cb.checked = draft.tags.includes(parseInt(cb.value));
        });
    }
    updateCounters('post');
    if (draftStatus && draft.savedAt) {
        draftStatus.textContent = `Чернетку відновлено (${draft.savedAt})`;
        draftStatus.classList.remove('hidden');
    }
}

export function clearArticleDraft(notify = true) {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    const headerInput = document.getElementById('postHeader');
    const descInput = document.getElementById('postDescription');
    const draftStatus = document.getElementById('draftStatus');

    if (headerInput) headerInput.value = '';
    if (descInput) descInput.value = '';
    document.querySelectorAll('#postTagCheckboxes input[name="tags"]').forEach(cb => {
        cb.checked = false;
    });

    clearPostErrors('post');
    updateCounters('post');

    if (draftStatus) {
        draftStatus.classList.add('hidden');
    }
    if (notify) {
        showToast('Чернетку очищено');
    }
}
