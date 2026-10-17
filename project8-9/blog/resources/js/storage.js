import { showToast } from './ui';
import { clearFieldError, updateCounters } from './validation';

export const DRAFT_STORAGE_KEY = 'article_draft_variant3';

export function saveArticleDraft() {
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
            draftStatus.innerHTML = `<i class="fa-solid fa-floppy-disk mr-1"></i> Чернетку збережено о ${draft.savedAt}`;
            draftStatus.classList.remove('hidden');
        }
    }
}

export function restoreArticleDraft() {
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
        updateCounters('post');
        if (draftStatus && draft.savedAt) {
            draftStatus.innerHTML = `<i class="fa-solid fa-floppy-disk mr-1"></i> Чернетку відновлено (${draft.savedAt})`;
            draftStatus.classList.remove('hidden');
        }
    } catch (e) {
        console.error('Failed to parse draft from localStorage', e);
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

    clearFieldError('postHeader', 'postHeaderError');
    clearFieldError('postDescription', 'postDescriptionError');
    updateCounters('post');

    if (draftStatus) {
        draftStatus.classList.add('hidden');
    }
    if (notify) {
        showToast('Чернетку очищено');
    }
}
