import { test, beforeEach, afterEach, expect, vi } from 'vitest';
import { saveArticleDraft, restoreArticleDraft, DRAFT_STORAGE_KEY } from '../../resources/js/storage.js';
import { fetchAllTags, readResponse } from '../../resources/js/api.js';
import { initPostForms } from '../../resources/js/post-form.js';
import { loadPosts, loadPost } from '../../resources/js/posts.js';
import { escapeHtml } from '../../resources/js/ui.js';

beforeEach(() => {
    localStorage.clear();
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
                <button id="clearDraftBtn" type="button">Очистити чернетку</button>
                <button id="submitPostBtn" type="submit">Опублікувати</button>
            </form>
        </div>
        <div id="editPostModal">
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
    expect(document.getElementById('viewPostHeader').textContent).toBe('Не вдалося завантажити статтю');
    const error = document.getElementById('viewPostDescription').textContent;
    expect(error).not.toContain('Previous article');
    expect(error).toContain(status === 401 ? 'Потрібна авторизація' : status === 404 ? 'Статтю не знайдено' : 'Помилка завантаження');
});
