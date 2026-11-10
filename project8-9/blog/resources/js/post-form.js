import { createPost, updatePost, fetchPost, readResponse } from './api.js';
import { getSelectedTagIds, loadTagsForSelects } from './tags.js';
import { saveArticleDraft, restoreArticleDraft, clearArticleDraft } from './storage.js';
import { validatePostFields, updateCounters, setFieldError, clearFieldError, showPostErrors, clearPostErrors } from './validation.js';
import { showToast, openModal, closeModal, escapeHtml } from './ui.js';

export const MAX_IMAGE_COUNT = 5;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1600;
const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const selectedFilesState = {
    post: [],
    editPost: [],
};

let nextImageId = 1;
let latestOnSaved = () => {};

export function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 Б';
    if (bytes < 1024) return `${bytes} Б`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} КБ`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} МБ`;
}

export function isSupportedImageType(file) {
    if (!file) return false;
    const type = (file.type || '').toLowerCase();
    if (SUPPORTED_MIME_TYPES.includes(type)) return true;
    if (!type && typeof file.name === 'string') {
        const lowerName = file.name.toLowerCase();
        return SUPPORTED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
    }
    return false;
}

function setImageError(prefix, message) {
    setFieldError(`${prefix}ImageDropzone`, `${prefix}ImagesError`, message);
    showToast(message, true);
}

function clearImageError(prefix) {
    clearFieldError(`${prefix}ImageDropzone`, `${prefix}ImagesError`);
}

function canvasToBlob(canvas, type, quality) {
    if (typeof canvas.toBlob === 'function') {
        return new Promise(resolve => canvas.toBlob(blob => resolve(blob), type, quality));
    }
    return Promise.resolve(null);
}

function replaceExtension(filename, newExt) {
    const base = (filename || 'image').replace(/\.[^/.]+$/, '');
    return `${base}.${newExt}`;
}

async function decodeImageSource(file) {
    if (typeof createImageBitmap === 'function') {
        try {
            return await createImageBitmap(file, { imageOrientation: 'from-image' });
        } catch {
            return await createImageBitmap(file);
        }
    }
    if (typeof Image === 'undefined' || typeof URL.createObjectURL !== 'function') {
        return null;
    }
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image decode error'));
        };
        img.src = objectUrl;
    });
}

export async function optimizeImageFile(file, options = {}) {
    const maxDimension = options.maxDimension || MAX_IMAGE_DIMENSION;
    const maxBytes = options.maxBytes || MAX_FILE_SIZE_BYTES;

    if (!isSupportedImageType(file)) {
        const error = new Error(`Файл «${file?.name || 'невідомий'}» має непідтримуваний формат. Дозволено лише зображення JPEG, PNG або WebP.`);
        error.code = 'UNSUPPORTED_FORMAT';
        throw error;
    }

    if (file.corrupted) {
        const error = new Error(`Не вдалося обробити зображення «${file.name}». Перевірте, чи файл не пошкоджений, та спробуйте інше фото.`);
        error.code = 'PROCESSING_FAILED';
        throw error;
    }

    const canUseCanvas = typeof document !== 'undefined' && (
        typeof createImageBitmap === 'function' ||
        (typeof navigator !== 'undefined' && !/jsdom/i.test(navigator.userAgent || ''))
    );
    const canvas = canUseCanvas ? document.createElement('canvas') : null;
    let ctx = null;
    if (canvas && typeof canvas.getContext === 'function') {
        try {
            ctx = canvas.getContext('2d');
        } catch {
            ctx = null;
        }
    }

    if (!ctx) {
        if (typeof createImageBitmap === 'function') {
            try {
                const bitmap = await createImageBitmap(file);
                bitmap?.close?.();
            } catch {
                const error = new Error(`Не вдалося обробити зображення «${file.name}». Перевірте, чи файл не пошкоджений, та спробуйте інше фото.`);
                error.code = 'PROCESSING_FAILED';
                throw error;
            }
        }
        if (file.size > maxBytes) {
            const error = new Error(`Файл «${file.name}» занадто великий (${formatFileSize(file.size)}). Максимальний дозволений розмір — 5 МБ.`);
            error.code = 'OVERSIZED';
            throw error;
        }
        return file;
    }

    let source;
    try {
        source = await decodeImageSource(file);
    } catch {
        const error = new Error(`Не вдалося обробити зображення «${file.name}». Перевірте, чи файл не пошкоджений, та спробуйте інше фото.`);
        error.code = 'PROCESSING_FAILED';
        throw error;
    }

    if (!source) {
        if (file.size > maxBytes) {
            const error = new Error(`Файл «${file.name}» занадто великий (${formatFileSize(file.size)}). Максимальний дозволений розмір — 5 МБ.`);
            error.code = 'OVERSIZED';
            throw error;
        }
        return file;
    }

    const srcWidth = source.width || source.naturalWidth || 0;
    const srcHeight = source.height || source.naturalHeight || 0;

    if (!srcWidth || !srcHeight) {
        source.close?.();
        const error = new Error(`Не вдалося обробити зображення «${file.name}». Перевірте, чи файл не пошкоджений, та спробуйте інше фото.`);
        error.code = 'PROCESSING_FAILED';
        throw error;
    }

    const needsResize = srcWidth > maxDimension || srcHeight > maxDimension;
    const needsCompression = file.size > 350 * 1024 || file.type === 'image/png';

    if (!needsResize && !needsCompression && file.size <= maxBytes) {
        source.close?.();
        return file;
    }

    const ratio = Math.min(1, maxDimension / Math.max(srcWidth, srcHeight));
    const targetWidth = Math.max(1, Math.round(srcWidth * ratio));
    const targetHeight = Math.max(1, Math.round(srcHeight * ratio));

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    try {
        ctx.clearRect?.(0, 0, targetWidth, targetHeight);
        ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    } catch {
        source.close?.();
        canvas.width = 0;
        canvas.height = 0;
        const error = new Error(`Не вдалося обробити зображення «${file.name}». Перевірте, чи файл не пошкоджений, та спробуйте інше фото.`);
        error.code = 'PROCESSING_FAILED';
        throw error;
    } finally {
        source.close?.();
    }

    const qualities = [0.82, 0.7, 0.55];
    let bestBlob = null;
    let outputMime = 'image/webp';
    let outputExt = 'webp';

    for (const quality of qualities) {
        let blob = await canvasToBlob(canvas, 'image/webp', quality);
        if (!blob || (blob.type && blob.type !== 'image/webp')) {
            outputMime = 'image/jpeg';
            outputExt = 'jpg';
            blob = await canvasToBlob(canvas, 'image/jpeg', quality);
        } else {
            outputMime = 'image/webp';
            outputExt = 'webp';
        }
        if (blob) {
            bestBlob = blob;
            if (blob.size <= maxBytes && blob.size <= 1.8 * 1024 * 1024) {
                break;
            }
        }
    }

    canvas.width = 0;
    canvas.height = 0;

    let candidateFile = file;
    if (bestBlob && (bestBlob.size < file.size || needsResize)) {
        const finalType = bestBlob.type || outputMime;
        const finalExt = finalType === 'image/jpeg' ? 'jpg' : outputExt;
        candidateFile = new File([bestBlob], replaceExtension(file.name, finalExt), {
            type: finalType,
            lastModified: file.lastModified || Date.now(),
        });
    }

    if (candidateFile.size > maxBytes) {
        const error = new Error(`Файл «${file.name}» занадто великий (${formatFileSize(file.size)}). Максимальний дозволений розмір — 5 МБ.`);
        error.code = 'OVERSIZED';
        throw error;
    }

    return candidateFile;
}

export function getSelectedFiles(prefix = 'post') {
    return (selectedFilesState[prefix] || []).map(entry => entry.file);
}

function getRemainingExistingCount(prefix) {
    if (prefix !== 'editPost') return 0;
    const allExisting = document.querySelectorAll('#editPostExistingImages .remove-post-image').length;
    const markedForRemoval = document.querySelectorAll('#editPostExistingImages .remove-post-image:checked').length;
    return Math.max(0, allExisting - markedForRemoval);
}

export function updateImageCounter(prefix = 'post') {
    const selectedCount = (selectedFilesState[prefix] || []).length;
    const existingCount = getRemainingExistingCount(prefix);
    const totalCount = selectedCount + existingCount;

    const counterEl = document.getElementById(`${prefix}ImageCount`);
    if (counterEl) {
        counterEl.textContent = `${totalCount} / ${MAX_IMAGE_COUNT} зображень`;
        counterEl.className = totalCount >= MAX_IMAGE_COUNT
            ? 'inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700'
            : 'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600';
    }

    const clearBtn = document.getElementById(`${prefix}ClearImagesBtn`);
    if (clearBtn) {
        clearBtn.classList.toggle('hidden', selectedCount === 0);
    }

    const selectBtn = document.getElementById(`${prefix}SelectImagesBtn`);
    if (selectBtn) {
        selectBtn.disabled = totalCount >= MAX_IMAGE_COUNT;
        selectBtn.classList.toggle('opacity-50', totalCount >= MAX_IMAGE_COUNT);
        selectBtn.classList.toggle('cursor-not-allowed', totalCount >= MAX_IMAGE_COUNT);
    }
}

export function renderSelectedImages(prefix = 'post') {
    const container = document.getElementById(`${prefix}ImagePreview`);
    if (!container) return;
    container.replaceChildren();

    const entries = selectedFilesState[prefix] || [];
    entries.forEach(entry => {
        if (!entry.previewUrl && typeof URL.createObjectURL === 'function') {
            entry.previewUrl = URL.createObjectURL(entry.file);
        }

        const card = document.createElement('div');
        card.className = 'group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs';
        card.dataset.previewId = String(entry.id);

        const thumbWrapper = document.createElement('div');
        thumbWrapper.className = 'relative aspect-square w-full bg-slate-100 overflow-hidden';

        const image = document.createElement('img');
        image.alt = `Попередній перегляд: ${entry.file.name}`;
        image.className = 'h-full w-full object-cover';
        if (entry.previewUrl) {
            image.src = entry.previewUrl;
        }
        thumbWrapper.append(image);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.dataset.removeSelectedImage = String(entry.id);
        removeBtn.dataset.prefix = prefix;
        removeBtn.setAttribute('aria-label', `Видалити зображення ${entry.file.name}`);
        removeBtn.title = 'Видалити зображення';
        removeBtn.className = 'absolute top-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/75 text-white shadow-xs hover:bg-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 transition cursor-pointer';
        removeBtn.innerHTML = '<i class="fa-solid fa-xmark text-xs" aria-hidden="true"></i>';
        thumbWrapper.append(removeBtn);

        const meta = document.createElement('div');
        meta.className = 'flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-xs bg-white border-t border-slate-100';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'truncate font-medium text-slate-700';
        nameSpan.dataset.imageName = entry.file.name;
        nameSpan.title = entry.file.name;
        nameSpan.textContent = entry.file.name;

        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'shrink-0 text-[11px] text-slate-400';
        sizeSpan.dataset.imageSize = String(entry.file.size);
        sizeSpan.textContent = formatFileSize(entry.file.size);

        meta.append(nameSpan, sizeSpan);
        card.append(thumbWrapper, meta);
        container.append(card);
    });

    updateImageCounter(prefix);
}

export function removeSelectedImage(prefix, id) {
    const entries = selectedFilesState[prefix] || [];
    const index = entries.findIndex(item => String(item.id) === String(id));
    if (index === -1) return;

    const [removed] = entries.splice(index, 1);
    if (removed?.previewUrl && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(removed.previewUrl);
    }

    clearImageError(prefix);
    renderSelectedImages(prefix);
}

export function clearSelectedImages(prefix = 'post') {
    const entries = selectedFilesState[prefix] || [];
    entries.forEach(entry => {
        if (entry.previewUrl && typeof URL.revokeObjectURL === 'function') {
            URL.revokeObjectURL(entry.previewUrl);
        }
    });
    selectedFilesState[prefix] = [];
    const input = document.getElementById(`${prefix}Images`);
    if (input) input.value = '';
    clearImageError(prefix);
    renderSelectedImages(prefix);
}

export async function addFilesToSelection(prefix, fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return [];

    clearImageError(prefix);

    const existingCount = getRemainingExistingCount(prefix);
    const currentSelected = selectedFilesState[prefix] || [];
    const projectedTotal = existingCount + currentSelected.length + incoming.length;

    if (projectedTotal > MAX_IMAGE_COUNT) {
        setImageError(
            prefix,
            `Перевищено ліміт: можна додати щонайбільше ${MAX_IMAGE_COUNT} зображень до однієї статті (спроба обрати: ${projectedTotal}).`
        );
        return getSelectedFiles(prefix);
    }

    const errors = [];
    for (const rawFile of incoming) {
        try {
            const optimized = await optimizeImageFile(rawFile);
            const previewUrl = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(optimized) : '';
            selectedFilesState[prefix].push({
                id: nextImageId++,
                file: optimized,
                previewUrl,
            });
        } catch (error) {
            errors.push(error.message || `Не вдалося обробити зображення «${rawFile?.name || ''}».`);
        }
    }

    renderSelectedImages(prefix);

    if (errors.length > 0) {
        setImageError(prefix, errors.join(' '));
    }

    return getSelectedFiles(prefix);
}

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
    clearSelectedImages('editPost');
    const existingContainer = document.getElementById('editPostExistingImages');
    if (existingContainer) {
        existingContainer.innerHTML = (post.images || []).map(image => `
            <label class="group relative flex flex-col overflow-hidden cursor-pointer rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs transition has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50/40">
                <div class="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
                    <img src="${escapeHtml(image.url)}" alt="Зображення статті" class="h-full w-full object-cover transition group-has-[:checked]:opacity-40">
                </div>
                <span class="mt-1.5 flex items-center justify-center gap-1.5 px-1 py-0.5 text-xs font-medium text-slate-600 group-has-[:checked]:text-rose-700">
                    <input type="checkbox" value="${image.id}" class="remove-post-image accent-rose-600 rounded">
                    <span>Видалити</span>
                </span>
            </label>`).join('');
    }
    updateImageCounter('editPost');
    openModal('editPostModal');
}

export function initPostForms(onSaved = () => {}) {
    latestOnSaved = onSaved;
    clearSelectedImages('post');
    clearSelectedImages('editPost');
    restoreArticleDraft();

    const clearDraftBtn = document.getElementById('clearDraftBtn');
    if (clearDraftBtn && clearDraftBtn.dataset.bound !== 'true') {
        clearDraftBtn.dataset.bound = 'true';
        clearDraftBtn.addEventListener('click', () => {
            clearArticleDraft();
            clearSelectedImages('post');
        });
    }

    document.querySelectorAll('[data-modal-close="editPostModal"]').forEach(btn => {
        if (btn.dataset.editCancelBound === 'true') return;
        btn.dataset.editCancelBound = 'true';
        btn.addEventListener('click', () => {
            clearSelectedImages('editPost');
            document.querySelectorAll('#editPostExistingImages .remove-post-image').forEach(cb => {
                cb.checked = false;
            });
            updateImageCounter('editPost');
        });
    });

    for (const prefix of ['post', 'editPost']) {
        const isNew = prefix === 'post';
        const form = document.getElementById(isNew ? 'newPostForm' : 'editPostForm');
        const tagContainer = document.getElementById(`${prefix}TagCheckboxes`);
        const fileInput = document.getElementById(`${prefix}Images`);
        const selectBtn = document.getElementById(`${prefix}SelectImagesBtn`);
        const clearBtn = document.getElementById(`${prefix}ClearImagesBtn`);
        const dropzone = document.getElementById(`${prefix}ImageDropzone`);
        const previewContainer = document.getElementById(`${prefix}ImagePreview`);
        const existingContainer = !isNew ? document.getElementById('editPostExistingImages') : null;

        updateImageCounter(prefix);

        if (selectBtn && selectBtn.dataset.bound !== 'true') {
            selectBtn.dataset.bound = 'true';
            selectBtn.addEventListener('click', () => {
                fileInput?.click();
            });
        }

        if (clearBtn && clearBtn.dataset.bound !== 'true') {
            clearBtn.dataset.bound = 'true';
            clearBtn.addEventListener('click', () => {
                clearSelectedImages(prefix);
            });
        }

        if (fileInput && fileInput.dataset.bound !== 'true') {
            fileInput.dataset.bound = 'true';
            fileInput.addEventListener('change', async () => {
                const files = Array.from(fileInput.files || []);
                fileInput.value = '';
                await addFilesToSelection(prefix, files);
            });
        }

        if (dropzone && dropzone.dataset.bound !== 'true') {
            dropzone.dataset.bound = 'true';
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, event => {
                    event.preventDefault();
                    event.stopPropagation();
                    dropzone.classList.add('border-indigo-500', 'bg-indigo-50/50');
                });
            });
            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, event => {
                    event.preventDefault();
                    event.stopPropagation();
                    dropzone.classList.remove('border-indigo-500', 'bg-indigo-50/50');
                });
            });
            dropzone.addEventListener('drop', async event => {
                const droppedFiles = event.dataTransfer?.files;
                if (droppedFiles?.length) {
                    await addFilesToSelection(prefix, droppedFiles);
                }
            });
        }

        if (previewContainer && previewContainer.dataset.bound !== 'true') {
            previewContainer.dataset.bound = 'true';
            previewContainer.addEventListener('click', event => {
                const target = event.target instanceof Element ? event.target : null;
                const removeBtn = target?.closest('[data-remove-selected-image]');
                if (!removeBtn) return;
                removeSelectedImage(prefix, removeBtn.dataset.removeSelectedImage);
            });
        }

        if (existingContainer && existingContainer.dataset.bound !== 'true') {
            existingContainer.dataset.bound = 'true';
            existingContainer.addEventListener('change', event => {
                const target = event.target instanceof Element ? event.target : null;
                if (target?.classList.contains('remove-post-image')) {
                    clearImageError('editPost');
                    updateImageCounter('editPost');
                }
            });
        }

        for (const field of ['Header', 'Description']) {
            const input = document.getElementById(`${prefix}${field}`);
            if (input && input.dataset.bound !== 'true') {
                input.dataset.bound = 'true';
                input.addEventListener('input', () => {
                    updateCounters(prefix);
                    if (isNew) saveArticleDraft();
                    const length = Array.from(input.value.trim()).length;
                    if (field === 'Header' ? length >= 5 && length <= 100 : length >= 20) {
                        clearFieldError(input.id, `${input.id}Error`);
                    }
                });
            }
        }

        if (tagContainer && tagContainer.dataset.bound !== 'true') {
            tagContainer.dataset.bound = 'true';
            tagContainer.addEventListener('change', () => {
                clearFieldError(tagContainer.id, `${prefix}TagsError`);
                if (isNew) saveArticleDraft();
            });
        }

        if (form && form.dataset.bound !== 'true') {
            form.dataset.bound = 'true';
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

                if (selectedFilesState[prefix].length === 0 && fileInput?.files?.length > 0) {
                    const directFiles = Array.from(fileInput.files);
                    fileInput.value = '';
                    await addFilesToSelection(prefix, directFiles);
                    const imageErrorEl = document.getElementById(`${prefix}ImagesError`);
                    if (imageErrorEl && !imageErrorEl.classList.contains('hidden') && imageErrorEl.innerText) {
                        return;
                    }
                }

                const images = getSelectedFiles(prefix);
                const remove_images = isNew ? [] : [...document.querySelectorAll('#editPostExistingImages .remove-post-image:checked')].map(input => Number(input.value));
                const existingCount = isNew ? 0 : document.querySelectorAll('#editPostExistingImages .remove-post-image').length;
                const totalImages = images.length + Math.max(0, existingCount - remove_images.length);

                if (totalImages > MAX_IMAGE_COUNT) {
                    setImageError(
                        prefix,
                        `Перевищено ліміт: можна додати щонайбільше ${MAX_IMAGE_COUNT} зображень до однієї статті (зараз обрано: ${totalImages}).`
                    );
                    return;
                }

                for (const file of images) {
                    if (!isSupportedImageType(file)) {
                        setImageError(prefix, `Файл «${file.name}» має непідтримуваний формат. Дозволено лише зображення JPEG, PNG або WebP.`);
                        return;
                    }
                    if (file.size > MAX_FILE_SIZE_BYTES) {
                        setImageError(prefix, `Файл «${file.name}» занадто великий (${formatFileSize(file.size)}). Максимальний дозволений розмір — 5 МБ.`);
                        return;
                    }
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
                    clearSelectedImages(prefix);
                    closeModal(isNew ? 'newPostModal' : 'editPostModal');
                    showToast(isNew ? 'Статтю успішно створено та опубліковано!' : 'Статтю успішно оновлено!');
                    latestOnSaved(isNew ? 1 : undefined);
                } catch (error) {
                    if (error.status === 422) {
                        showPostErrors(prefix, error.errors);
                    } else if (images.length > 0 && (!error.status || error.status >= 500)) {
                        const uploadMsg = 'Не вдалося завантажити зображення на сервер. Перевірте з’єднання та спробуйте ще раз.';
                        setFieldError(`${prefix}ImageDropzone`, `${prefix}ImagesError`, uploadMsg);
                    }
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
}
