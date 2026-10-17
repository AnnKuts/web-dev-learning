import { fetchAllTags, createTag, deleteTag, readResponse } from './api.js';
import { renderListError, escapeHtml, showToast, closeModal } from './ui.js';
import { restoreArticleDraft, saveArticleDraft } from './storage.js';

export function getSelectedTagIds(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} input[name="tags"]:checked`), checkbox => Number(checkbox.value));
}

export async function loadTagsForSelects() {
    try {
        const allTags = await fetchAllTags();

        const renderBoxes = (containerId) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            const selected = new Set(getSelectedTagIds(containerId));
            container.dataset.loaded = 'true';
            if (allTags.length === 0) {
                container.innerHTML = '<span class="text-xs text-slate-400">Тегів ще немає</span>';
                return;
            }
            container.innerHTML = allTags.map(tag => `
                <label class="inline-flex items-center space-x-1.5 bg-white border border-slate-200 px-2 py-1 rounded-md text-xs cursor-pointer hover:bg-slate-100">
                    <input type="checkbox" name="tags" value="${tag.id}" ${selected.has(tag.id) ? 'checked' : ''} class="rounded text-indigo-600 focus:ring-0">
                    <span>#${escapeHtml(tag.tag_name)}</span>
                </label>
            `).join('');
        };

        renderBoxes('postTagCheckboxes');
        renderBoxes('editPostTagCheckboxes');

        restoreArticleDraft(true);
    } catch (e) {
        showToast(e.message, true);
    }
}

export async function loadTags() {
    const container = document.getElementById('tagsList');
    if (!container) return;
    container.innerHTML = '<div class="p-8 text-center text-slate-400 col-span-full">Завантаження...</div>';

    try {
        const tags = await fetchAllTags();

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
        renderListError(container, err);
    }
}

export function initTags(onTagsChange) {
    document.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-action="delete-tag"]');
        if (!button || !confirm('Видалити цей тег?')) return;
        try {
            await readResponse(await deleteTag(Number(button.dataset.id)));
            showToast('Тег видалено!');
            await loadTagsForSelects();
            saveArticleDraft();
            loadTags();
        } catch (error) {
            showToast(error.message, true);
        }
    });
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
                await readResponse(res);
                showToast('Тег створено!');
                closeModal('newTagModal');
                const nameInput = document.getElementById('tagName');
                const slugInput = document.getElementById('tagSlug');
                if (nameInput) nameInput.value = '';
                if (slugInput) slugInput.value = '';
                loadTagsForSelects();
                onTagsChange();
            } catch (err) {
                showToast(err.message, true);
            }
        });
    }
}
