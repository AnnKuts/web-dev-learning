import { createPost, updatePost, readResponse } from './api.js';
import { getSelectedTagIds, loadTagsForSelects } from './tags.js';
import { saveArticleDraft, restoreArticleDraft, clearArticleDraft } from './storage.js';
import { validatePostFields, updateCounters, clearFieldError, showPostErrors, clearPostErrors } from './validation.js';
import { showToast, openModal, closeModal } from './ui.js';

export async function startEditPost(post) {
    await loadTagsForSelects();
    if (document.getElementById('editPostTagCheckboxes').dataset.loaded !== 'true') return;
    document.getElementById('editPostId').value = post.id;
    document.getElementById('editPostHeader').value = post.header;
    document.getElementById('editPostDescription').value = post.description;
    clearPostErrors('editPost');
    updateCounters('editPost');
    const tagIds = (post.tags || []).map(tag => tag.id);
    document.querySelectorAll('#editPostTagCheckboxes input').forEach(checkbox => {
        checkbox.checked = tagIds.includes(Number(checkbox.value));
    });
    openModal('editPostModal');
}

export function initPostForms(onSaved) {
    restoreArticleDraft();
    document.getElementById('clearDraftBtn').addEventListener('click', () => clearArticleDraft());

    for (const prefix of ['post', 'editPost']) {
        const isNew = prefix === 'post';
        const form = document.getElementById(isNew ? 'newPostForm' : 'editPostForm');
        const tagContainer = document.getElementById(`${prefix}TagCheckboxes`);
        for (const field of ['Header', 'Description']) {
            const input = document.getElementById(`${prefix}${field}`);
            input.addEventListener('input', () => {
                updateCounters(prefix);
                if (isNew) saveArticleDraft();
                const length = Array.from(input.value.trim()).length;
                if (field === 'Header' ? length >= 5 && length <= 100 : length >= 20) {
                    clearFieldError(input.id, `${input.id}Error`);
                }
            });
        }
        tagContainer.addEventListener('change', () => {
            clearFieldError(tagContainer.id, `${prefix}TagsError`);
            if (isNew) saveArticleDraft();
        });
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const header = document.getElementById(`${prefix}Header`).value.trim();
            const description = document.getElementById(`${prefix}Description`).value.trim();
            clearPostErrors(prefix);
            if (isNew) saveArticleDraft();
            if (!validatePostFields(header, description, prefix)) {
                showToast('Будь ласка, виправте помилки у формі', true);
                return;
            }
            const button = form.querySelector('[type="submit"]');
            if (button.disabled) return;
            button.disabled = true;
            const label = button.innerText;
            button.innerText = isNew ? 'Публікація...' : 'Збереження...';
            try {
                if (tagContainer.dataset.loaded !== 'true') await loadTagsForSelects();
                if (tagContainer.dataset.loaded !== 'true') return;
                const data = { header, description, tags: getSelectedTagIds(tagContainer.id) };
                const response = isNew
                    ? await createPost(data)
                    : await updatePost(document.getElementById('editPostId').value, data);
                await readResponse(response);
                if (isNew) clearArticleDraft(false);
                closeModal(isNew ? 'newPostModal' : 'editPostModal');
                showToast(isNew ? 'Статтю успішно створено та опубліковано!' : 'Статтю успішно оновлено!');
                onSaved(isNew ? 1 : undefined);
            } catch (error) {
                if (error.status === 422) showPostErrors(prefix, error.errors);
                showToast(error.message, true);
            } finally {
                button.disabled = false;
                button.innerText = label;
            }
        });
    }
}
