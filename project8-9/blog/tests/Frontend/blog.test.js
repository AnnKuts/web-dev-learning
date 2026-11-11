import { test, beforeEach, afterEach, expect, vi } from 'vitest';
import { saveArticleDraft, restoreArticleDraft, DRAFT_STORAGE_KEY } from '../../resources/js/storage.js';
import { createPost, updatePost, fetchAllTags, readResponse, setAuth, clearAuth } from '../../resources/js/api.js';
import { initPostForms, startEditPost, addFilesToSelection, optimizeImageFile, getSelectedFiles } from '../../resources/js/post-form.js';
import { loadPosts, loadPost } from '../../resources/js/posts.js';
import { escapeHtml } from '../../resources/js/ui.js';

beforeEach(() => {
    localStorage.clear();
    setAuth('test-token', { username: 'Test' });
    document.body.innerHTML = `
        <div id="toast" class="hidden">
            <span id="toastIcon"></span><span id="toastMessage"></span>
        </div>
        <div id="draftStatus" class="hidden">
            <i class="fa-solid fa-floppy-disk"></i><span id="draftStatusText"></span>
        </div>
        <div id="newPostModal">
            <form id="newPostForm" novalidate>
                <input id="postHeader" name="header" required minlength="5" maxlength="100">
                <span id="headerCounter"></span><p id="postHeaderError" class="hidden"></p>
                <textarea id="postDescription" name="description" required minlength="20"></textarea>
                <span id="descCounter"></span><p id="postDescriptionError" class="hidden"></p>
                <div id="postTagCheckboxes" data-loaded="true">
                    <label><input type="checkbox" name="tags" value="18" checked>Laravel</label>
                </div>
                <p id="postTagsError" class="hidden"></p>
                <span id="postImageCount">0 / 5 зображень</span>
                <button type="button" id="postClearImagesBtn" class="hidden">Видалити всі</button>
                <div id="postImageDropzone">
                    <input id="postImages" type="file" multiple class="sr-only">
                    <button type="button" id="postSelectImagesBtn">Обрати фотографії</button>
                </div>
                <p id="postImagesError" class="hidden"></p>
                <div id="postImagePreview"></div>
                <p id="postFormError" class="hidden"></p>
                <button id="clearDraftBtn" type="button">Очистити чернетку</button>
                <button id="submitPostBtn" type="submit">Опублікувати</button>
            </form>
        </div>
        <div id="editPostModal" class="hidden">
            <form id="editPostForm" novalidate>
                <input id="editPostId" type="hidden" value="7">
                <input id="editPostHeader" name="header" required minlength="5" maxlength="100">
                <span id="editHeaderCounter"></span><p id="editPostHeaderError" class="hidden"></p>
                <textarea id="editPostDescription" name="description" required minlength="20"></textarea>
                <span id="editDescCounter"></span><p id="editPostDescriptionError" class="hidden"></p>
                <div id="editPostTagCheckboxes" data-loaded="true">
                    <label><input type="checkbox" name="tags" value="18" checked>Laravel</label>
                </div>
                <p id="editPostTagsError" class="hidden"></p>
                <span id="editPostImageCount">0 / 5 зображень</span>
                <button type="button" id="editPostClearImagesBtn" class="hidden">Видалити всі</button>
                <div id="editPostImageDropzone">
                    <input id="editPostImages" type="file" multiple class="sr-only">
                    <button type="button" id="editPostSelectImagesBtn">Обрати фотографії</button>
                </div>
                <p id="editPostImagesError" class="hidden"></p>
                <div id="editPostImagePreview"></div>
                <div id="editPostExistingImages"></div>
                <p id="editPostFormError" class="hidden"></p>
                <button type="button" data-modal-close="editPostModal">Скасувати</button>
                <button id="submitEditPostBtn" type="submit">Зберегти зміни</button>
            </form>
        </div>
        <div id="postsList"></div><div id="postsPagination"></div>
        <article id="postDetail" data-post-id="7">
            <h1 id="viewPostHeader"></h1><p id="viewPostMeta"></p>
            <p id="viewPostTags"></p><div id="viewPostDescription"></div>
        </article>
    `;
});

afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
    localStorage.clear();
});

function fillDraft() {
    document.getElementById('postHeader').value = 'Valid header';
    document.getElementById('postDescription').value = 'A description longer than twenty characters.';
    saveArticleDraft();
}

async function submitForm(id) {
    const form = document.getElementById(id);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(form.querySelector('[type="submit"]').disabled).toBe(false));
}

test('clearing all fields and tags removes the old draft', () => {
    initPostForms(vi.fn());
    fillDraft();
    for (const id of ['postHeader', 'postDescription']) {
        const input = document.getElementById(id);
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const checkbox = document.querySelector('#postTagCheckboxes input');
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    restoreArticleDraft();
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    expect(document.getElementById('postHeader').value).toBe('');
    expect(document.getElementById('draftStatus').classList.contains('hidden')).toBe(true);
});

test('restores text and tags, without overwriting new text when tags arrive later', () => {
    fillDraft();
    document.getElementById('postHeader').value = '';
    const checkbox = document.querySelector('#postTagCheckboxes input');
    checkbox.checked = false;
    restoreArticleDraft();
    expect(document.getElementById('postHeader').value).toBe('Valid header');
    expect(checkbox.checked).toBe(true);
    document.getElementById('postHeader').value = 'New text';
    restoreArticleDraft(true);
    expect(document.getElementById('postHeader').value).toBe('New text');
});

test('typing before tags load preserves saved tag selection', () => {
    fillDraft();
    const container = document.getElementById('postTagCheckboxes');
    container.dataset.loaded = 'false';
    container.replaceChildren();
    document.getElementById('postHeader').value = 'New text';
    saveArticleDraft();
    expect(JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY)).tags).toEqual([18]);
});

test('fetches every tag page and stops at last_page', async () => {
    const urls = [];
    vi.stubGlobal('fetch', vi.fn(async url => {
        urls.push(url);
        return Response.json({ data: [{ id: urls.length }], meta: { last_page: 3 } });
    }));
    expect(await fetchAllTags()).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(urls).toEqual(['/api/tags?page=1', '/api/tags?page=2', '/api/tags?page=3']);
});

test('article images use multipart upload while ordinary edits retain JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ data: { id: 7 } })));
    const image = new File(['image bytes'], 'picture.png', { type: 'image/png' });
    await createPost({ header: 'Article', description: 'Long enough article description', tags: [18], images: [image] });
    const [createUrl, createOptions] = fetch.mock.calls[0];
    expect(createUrl).toBe('/api/posts');
    expect(createOptions.body).toBeInstanceOf(FormData);
    expect(createOptions.body.get('images[]')).toBe(image);
    expect(createOptions.headers['Content-Type']).toBeUndefined();

    await updatePost(7, { header: 'Changed', description: 'Long enough article description', tags: [], images: [image], remove_images: [3] });
    const [, editOptions] = fetch.mock.calls[1];
    expect(editOptions.method).toBe('POST');
    expect(editOptions.body.get('_method')).toBe('PUT');
    expect(editOptions.body.get('remove_images[]')).toBe('3');
    expect(editOptions.body.get('clear_tags')).toBe('1');

    await updatePost(7, { header: 'Changed', description: 'Long enough article description', tags: [], images: [], remove_images: [3] });
    const [, jsonOptions] = fetch.mock.calls[2];
    expect(jsonOptions.method).toBe('PUT');
    expect(JSON.parse(jsonOptions.body).remove_images).toEqual([3]);
});

test.each([401, 403, 422, 'network'])('failed publication (%s) preserves fields, tags and draft', async status => {
    fillDraft();
    const onSaved = vi.fn();
    initPostForms(onSaved);
    vi.stubGlobal('fetch', vi.fn(async () => {
        if (status === 'network') throw new TypeError('Failed to fetch');
        return Response.json({ message: 'Rejected', errors: { 'tags.0': ['Обраний тег не існує.'] } }, { status });
    }));
    await submitForm('newPostForm');
    expect(document.getElementById('postHeader').value).toBe('Valid header');
    expect(document.querySelector('#postTagCheckboxes input').checked).toBe(true);
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).not.toBeNull();
    expect(onSaved).not.toHaveBeenCalled();
    if (status === 422) {
        const error = document.getElementById('postTagsError');
        expect(error.innerText).toBe('Обраний тег не існує.');
        expect(error.classList.contains('hidden')).toBe(false);
    }
});

test('successful publication clears the draft and resets the form', async () => {
    fillDraft();
    const onSaved = vi.fn();
    initPostForms(onSaved);
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ data: { id: 1 } }, { status: 201 })));
    await submitForm('newPostForm');
    expect(fetch).toHaveBeenCalledWith('/api/posts', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ header: 'Valid header', description: 'A description longer than twenty characters.', tags: [18] }),
    }));
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    expect(document.getElementById('postHeader').value).toBe('');
    expect(document.querySelector('#postTagCheckboxes input').checked).toBe(false);
    expect(document.getElementById('newPostModal').classList.contains('hidden')).toBe(true);
    expect(onSaved).toHaveBeenCalledWith(1);
});

test('HTTP errors are rejected, including non-JSON responses and empty DELETE responses', async () => {
    for (const status of [401, 403, 500]) {
        await expect(readResponse(new Response('Error', { status }))).rejects.toMatchObject({ status });
    }
    expect(await readResponse(new Response(null, { status: 204 }))).toEqual({});
});

test('HTML escaping neutralizes user content inside templates', () => {
    expect(escapeHtml('<img src="x" onerror="alert(1)">')).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
});

test('edit validation displays tags.* errors without losing values or the creation draft', async () => {
    fillDraft();
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    const onSaved = vi.fn();
    initPostForms(onSaved);
    document.getElementById('editPostHeader').value = 'Edited header';
    document.getElementById('editPostDescription').value = 'An edited description longer than twenty characters.';
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
        errors: { 'tags.0': ['Обраний тег не існує.'] },
    }, { status: 422 })));
    await submitForm('editPostForm');
    expect(document.getElementById('editPostTagsError').innerText).toBe('Обраний тег не існує.');
    expect(document.getElementById('editPostHeader').value).toBe('Edited header');
    expect(document.querySelector('#editPostTagCheckboxes input').checked).toBe(true);
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBe(draft);
    expect(onSaved).not.toHaveBeenCalled();
});

test('client validation blocks publication of invalid fields', async () => {
    initPostForms(vi.fn());
    document.getElementById('postHeader').value = '1234';
    document.getElementById('postDescription').value = 'Short';
    vi.stubGlobal('fetch', vi.fn());
    await submitForm('newPostForm');
    expect(fetch).not.toHaveBeenCalled();
    expect(document.getElementById('postHeaderError').innerText).toBeTruthy();
    expect(document.getElementById('postDescriptionError').innerText).toBeTruthy();
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).not.toBeNull();
});

test('post cards show a short excerpt and open the full article safely', async () => {
    const description = `<b>Текст</b> ${'𐐀'.repeat(250)}\nПовний текст статті`;
    const post = {
        id: 7, header: '<script>Заголовок</script>', description,
        created_at: '2026-01-01T12:00:00Z', user: { username: 'Anna' },
        tags: [{ tag_name: 'Laravel' }],
    };
    const detail = { ...post, header: 'Актуальний заголовок', description: description + '\nОновлено на сервері' };
    vi.stubGlobal('fetch', vi.fn(async url => Response.json({ data: url === '/api/posts/7' ? detail : [post] })));
    await loadPosts(1);
    const list = document.getElementById('postsList');
    const excerpt = Array.from(description.replace(/\s+/g, ' ')).slice(0, 240).join('') + '…';
    expect(list.querySelector('article p').textContent).toBe(excerpt);
    expect(list.querySelector('h3').textContent).toBe(post.header);
    expect(list.querySelector('script')).toBeNull();
    expect(list.textContent).not.toContain('Повний текст статті');
    expect(list.querySelector('a[href="/posts/7"]').textContent).toBe(post.header);
    await loadPost(7);
    expect(document.getElementById('viewPostDescription').textContent).toBe(detail.description);
    expect(document.getElementById('viewPostDescription').querySelector('b')).toBeNull();
    expect(document.getElementById('viewPostHeader').textContent).toBe(detail.header);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(['/api/posts?page=1', '/api/posts/7']);
    expect(document.getElementById('viewPostTags').textContent).toBe('#Laravel');
});

test.each([401, 403, 404, 'network'])('article detail API error (%s) clears the previous article and shows an error', async status => {
    document.getElementById('viewPostDescription').textContent = 'Previous article';
    vi.stubGlobal('fetch', vi.fn(async url => {
        expect(url).toBe('/api/posts/7');
        expect(document.getElementById('viewPostHeader').textContent).toBe('Завантаження статті…');
        if (status === 'network') throw new TypeError('Failed to fetch');
        return Response.json({ message: 'Rejected' }, { status });
    }));
    await loadPost(7);
    expect(document.getElementById('viewPostHeader').textContent).toBe(status === 401 ? '' : 'Не вдалося завантажити статтю');
    const error = document.getElementById('viewPostDescription').textContent;
    expect(error).not.toContain('Previous article');
    expect(error).toContain(status === 401 ? 'Ласкаво просимо' : status === 404 ? 'Статтю не знайдено' : 'Помилка завантаження');
});

test('removing an individual image preview removes only that file from upload payload and revokes its URL while preserving form fields', async () => {
    const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation(file => `blob:mock-${file.name}`);
    const revokeUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    initPostForms(vi.fn());
    fillDraft();

    const file1 = new File(['a'.repeat(2048)], 'first.png', { type: 'image/png' });
    const file2 = new File(['b'.repeat(4096)], 'second.jpg', { type: 'image/jpeg' });
    await addFilesToSelection('post', [file1, file2]);

    const file3 = new File(['c'.repeat(1024)], 'third.webp', { type: 'image/webp' });
    await addFilesToSelection('post', [file3]);

    const preview = document.getElementById('postImagePreview');
    expect(preview.querySelectorAll('[data-preview-id]')).toHaveLength(3);
    expect(document.getElementById('postImageCount').textContent).toBe('3 / 5 зображень');
    expect(preview.textContent).toContain('first.png');
    expect(preview.textContent).toContain('2.0 КБ');
    expect(preview.textContent).toContain('second.jpg');
    expect(preview.textContent).toContain('4.0 КБ');

    const cards = preview.querySelectorAll('[data-preview-id]');
    cards[1].click();
    expect(cards[1].dataset.active).toBe('true');
    const removeButtons = preview.querySelectorAll('[data-remove-selected-image]');
    expect(removeButtons[1].className).toContain('bg-white/95');
    removeButtons[1].click();

    expect(revokeUrlSpy).toHaveBeenCalledWith('blob:mock-second.jpg');
    expect(preview.querySelectorAll('[data-preview-id]')).toHaveLength(2);
    expect(document.getElementById('postImageCount').textContent).toBe('2 / 5 зображень');
    expect(getSelectedFiles('post').map(f => f.name)).toEqual(['first.png', 'third.webp']);

    expect(document.getElementById('postHeader').value).toBe('Valid header');
    expect(document.getElementById('postDescription').value).toBe('A description longer than twenty characters.');
    expect(document.querySelector('#postTagCheckboxes input').checked).toBe(true);

    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ data: { id: 99 } }, { status: 201 })));
    await submitForm('newPostForm');

    const [, options] = fetch.mock.calls[0];
    expect(options.body).toBeInstanceOf(FormData);
    const uploadedNames = options.body.getAll('images[]').map(f => f.name);
    expect(uploadedNames).toEqual(['first.png', 'third.webp']);

    createUrlSpy.mockRestore();
    revokeUrlSpy.mockRestore();
});

test('displays specific Ukrainian errors for unsupported format, oversized image, too many images, and corrupted image', async () => {
    initPostForms(vi.fn());

    const badFormat = new File(['svg content'], 'diagram.svg', { type: 'image/svg+xml' });
    await addFilesToSelection('post', [badFormat]);
    const errorEl = document.getElementById('postImagesError');
    expect(errorEl.classList.contains('hidden')).toBe(false);
    expect(errorEl.innerText).toContain('diagram.svg');
    expect(errorEl.innerText).toContain('JPEG, PNG або WebP');
    expect(getSelectedFiles('post')).toHaveLength(0);

    const sixMbBytes = new Uint8Array(6 * 1024 * 1024);
    const hugePng = new File([sixMbBytes], 'huge-screenshot.png', { type: 'image/png' });
    await addFilesToSelection('post', [hugePng]);
    expect(errorEl.classList.contains('hidden')).toBe(false);
    expect(errorEl.innerText).toContain('huge-screenshot.png');
    expect(errorEl.innerText).toContain('6.00 МБ');
    expect(errorEl.innerText).toContain('5 МБ');
    expect(getSelectedFiles('post')).toHaveLength(0);

    const corruptedPng = new File(['not a real image'], 'broken.png', { type: 'image/png' });
    corruptedPng.corrupted = true;
    await addFilesToSelection('post', [corruptedPng]);
    expect(errorEl.innerText).toContain('broken.png');
    expect(errorEl.innerText).toContain('Не вдалося обробити зображення');

    const validFiles = [1, 2, 3, 4].map(n => new File(['ok'], `img-${n}.jpg`, { type: 'image/jpeg' }));
    await addFilesToSelection('post', validFiles);
    expect(getSelectedFiles('post')).toHaveLength(4);

    const extraFiles = [5, 6].map(n => new File(['ok'], `img-${n}.jpg`, { type: 'image/jpeg' }));
    await addFilesToSelection('post', extraFiles);
    expect(errorEl.innerText).toContain('щонайбільше 5 зображень');
    expect(getSelectedFiles('post')).toHaveLength(4);

    document.getElementById('postClearImagesBtn').click();
    expect(getSelectedFiles('post')).toHaveLength(0);
    expect(document.getElementById('postImageCount').textContent).toBe('0 / 5 зображень');
});

test('optimizeImageFile resizes and compresses large PNG/JPEG images via canvas before upload', async () => {
    const closeSpy = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({
        width: 3200,
        height: 1600,
        close: closeSpy,
    })));

    const drawImageSpy = vi.fn();
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        clearRect: vi.fn(),
        drawImage: drawImageSpy,
    });
    const toBlobSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb) {
        cb(new Blob(['compressed-webp-bytes'], { type: 'image/webp' }));
    });

    const largePng = new File([new Uint8Array(2 * 1024 * 1024)], 'camera-photo.png', { type: 'image/png' });
    const optimized = await optimizeImageFile(largePng);

    expect(drawImageSpy).toHaveBeenCalledWith(expect.anything(), 0, 0, 1600, 800);
    expect(closeSpy).toHaveBeenCalled();
    expect(optimized.name).toBe('camera-photo.webp');
    expect(optimized.type).toBe('image/webp');
    expect(optimized.size).toBeLessThan(largePng.size);

    getContextSpy.mockRestore();
    toBlobSpy.mockRestore();
});

test('edit article modal distinguishes new images from existing images and cancel preserves stored images', async () => {
    initPostForms(vi.fn());
    const existingPost = {
        id: 7,
        header: 'Existing article',
        description: 'Existing article description with more than twenty characters.',
        tags: [{ id: 18, tag_name: 'Laravel' }],
        images: [
            { id: 101, url: '/storage/posts/one.webp' },
            { id: 102, url: '/storage/posts/two.webp' },
        ],
    };

    vi.stubGlobal('fetch', vi.fn(async (url) => {
        if (url === '/api/posts/7') return Response.json({ data: existingPost });
        return Response.json({ data: [{ id: 18, tag_name: 'Laravel' }], meta: { last_page: 1 } });
    }));

    await startEditPost({ id: 7 });
    expect(document.getElementById('editPostExistingImages').querySelectorAll('.remove-post-image')).toHaveLength(2);
    expect(document.getElementById('editPostImageCount').textContent).toBe('2 / 5 зображень');

    const new1 = new File(['new1'], 'new-one.png', { type: 'image/png' });
    const new2 = new File(['new2'], 'new-two.png', { type: 'image/png' });
    await addFilesToSelection('editPost', [new1, new2]);
    expect(document.getElementById('editPostImageCount').textContent).toBe('4 / 5 зображень');

    document.querySelector('#editPostImagePreview [data-remove-selected-image]').click();
    expect(getSelectedFiles('editPost').map(f => f.name)).toEqual(['new-two.png']);
    expect(document.getElementById('editPostImageCount').textContent).toBe('3 / 5 зображень');

    const existingCheckboxes = document.querySelectorAll('#editPostExistingImages .remove-post-image');
    existingCheckboxes[0].checked = true;
    existingCheckboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.getElementById('editPostImageCount').textContent).toBe('2 / 5 зображень');

    document.querySelector('[data-modal-close="editPostModal"]').click();
    expect(getSelectedFiles('editPost')).toHaveLength(0);
    expect(existingCheckboxes[0].checked).toBe(false);
    expect(fetch.mock.calls.every(([, opts]) => !opts?.method || opts.method === 'GET')).toBe(true);
});
