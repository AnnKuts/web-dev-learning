import { createPost, updatePost, fetchPost, readResponse } from './api.js';
import { getSelectedTagIds, loadTagsForSelects } from './tags.js';
import { saveArticleDraft, restoreArticleDraft, clearArticleDraft } from './storage.js';
import { validatePostFields, updateCounters, clearFieldError, showPostErrors, clearPostErrors } from './validation.js';
import { showToast, openModal, closeModal, escapeHtml } from './ui.js';

export async function startEditPost(post) {
    await loadTagsForSelects();
    if (document.getElementById('editPostTagCheckboxes').dataset.loaded !== 'true') return;
    try {
        post = (await readResponse(await fetchPost(post.id))).data;
    } catch (error) {
        showToast(error.message, true);
        return;
    }
    document.getElementById('editPostId').value = post.id;
    document.getElementById('editPostHeader').value = post.header;
    document.getElementById('editPostDescription').value = post.description;
    clearPostErrors('editPost');
    updateCounters('editPost');
    const tagIds = (post.tags || []).map(tag => tag.id);
    document.querySelectorAll('#editPostTagCheckboxes input').forEach(checkbox => {
        checkbox.checked = tagIds.includes(Number(checkbox.value));
    });
    document.getElementById('editPostImages').value = '';
    renderSelectedImages('editPost');
    document.getElementById('editPostExistingImages').innerHTML = (post.images || []).map(image => `
        <label class="relative block cursor-pointer rounded-lg border border-slate-200 p-1 has-[:checked]:border-rose-500">
            <img src="${escapeHtml(image.url)}" alt="Зображення статті" class="aspect-square w-full rounded object-cover">
            <span class="mt-1 flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" value="${image.id}" class="remove-post-image accent-rose-600"> Видалити</span>
        </label>`).join('');
    openModal('editPostModal');
}

function renderSelectedImages(prefix) {
    const input = document.getElementById(`${prefix}Images`);
    const container = document.getElementById(`${prefix}ImagePreview`);
    container.replaceChildren();
    [...input.files].forEach(file => {
        const image = document.createElement('img');
        image.alt = `Попередній перегляд: ${file.name}`;
        image.className = 'aspect-square w-full rounded-lg object-cover';
        const url = URL.createObjectURL(file);
        image.src = url;
        image.onload = () => URL.revokeObjectURL(url);
        container.append(image);
    });
}

export function initPostForms(onSaved) {
    restoreArticleDraft();
    document.getElementById('clearDraftBtn').addEventListener('click', () => clearArticleDraft());

    for (const prefix of ['post', 'editPost']) {
        const isNew = prefix === 'post';
        const form = document.getElementById(isNew ? 'newPostForm' : 'editPostForm');
        const tagContainer = document.getElementById(`${prefix}TagCheckboxes`);
        document.getElementById(`${prefix}Images`).addEventListener('change', () => renderSelectedImages(prefix));
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
            const formError = document.getElementById(`${prefix}FormError`);
            if (formError) {
                formError.textContent = '';
                formError.classList.add('hidden');
            }
            if (isNew) saveArticleDraft();
            if (!validatePostFields(header, description, prefix)) {
                showToast('Будь ласка, виправте помилки у формі', true);
                return;
            }
            const images = [...document.getElementById(`${prefix}Images`).files];
            const remove_images = isNew ? [] : [...document.querySelectorAll('.remove-post-image:checked')].map(input => Number(input.value));
            const existingCount = isNew ? 0 : document.querySelectorAll('.remove-post-image').length;
            if (images.length + existingCount - remove_images.length > 5 || images.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
                showToast('Дозволено до 5 зображень JPEG, PNG або WebP розміром до 5 МБ кожне.', true);
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
                const data = { header, description, tags: getSelectedTagIds(tagContainer.id), images, remove_images };
                const response = isNew
                    ? await createPost(data)
                    : await updatePost(document.getElementById('editPostId').value, data);
                await readResponse(response);
                if (isNew) clearArticleDraft(false);
                document.getElementById(`${prefix}Images`).value = '';
                renderSelectedImages(prefix);
                closeModal(isNew ? 'newPostModal' : 'editPostModal');
                showToast(isNew ? 'Статтю успішно створено та опубліковано!' : 'Статтю успішно оновлено!');
                onSaved(isNew ? 1 : undefined);
            } catch (error) {
                if (error.status === 422) showPostErrors(prefix, error.errors);
                if (formError) {
                    formError.textContent = error.message;
                    formError.classList.remove('hidden');
                }
                showToast(error.message, true);
            } finally {
                button.disabled = false;
                button.innerText = label;
            }
        });
    }
}
