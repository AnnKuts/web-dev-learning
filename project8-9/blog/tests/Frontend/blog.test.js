import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

const stored = new Map();
globalThis.localStorage = {
    getItem: key => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
    removeItem: key => stored.delete(key),
};
const { saveArticleDraft, restoreArticleDraft, DRAFT_STORAGE_KEY } = await import('../../resources/js/storage.js');
const { fetchAllTags, readResponse } = await import('../../resources/js/api.js');
const { initPostForms } = await import('../../resources/js/post-form.js');
const { escapeHtml } = await import('../../resources/js/ui.js');
let elements;
let checkboxes;

beforeEach(() => {
    stored.clear();
    elements = new Map();
    checkboxes = [{ value: '18', checked: true }];
    globalThis.document = {
        getElementById(id) {
            if (!elements.has(id)) {
                elements.set(id, {
                    id, value: '', innerText: '', textContent: '', disabled: false,
                    dataset: { loaded: 'true' },
                    classList: { add() {}, remove() {} },
                    listeners: {},
                    addEventListener(event, handler) { this.listeners[event] = handler; },
                    querySelector() { return document.getElementById(`${id}Submit`); },
                });
            }
            return elements.get(id);
        },
        querySelectorAll(selector) {
            if (!selector.startsWith('#postTagCheckboxes')) return [];
            return selector.endsWith(':checked') ? checkboxes.filter(checkbox => checkbox.checked) : checkboxes;
        },
    };
    mock.method(globalThis, 'setTimeout', () => 0);
});

afterEach(() => mock.restoreAll());

function fillDraft() {
    document.getElementById('postHeader').value = 'Valid header';
    document.getElementById('postDescription').value = 'A description longer than twenty characters.';
    saveArticleDraft();
}

test('clearing all fields and tags removes the old draft', () => {
    fillDraft();
    document.getElementById('postHeader').value = '';
    document.getElementById('postDescription').value = '';
    checkboxes[0].checked = false;
    saveArticleDraft();
    restoreArticleDraft();
    assert.equal(localStorage.getItem(DRAFT_STORAGE_KEY), null);
    assert.equal(document.getElementById('postHeader').value, '');
});

test('restores text and tags, without overwriting new text when tags arrive later', () => {
    fillDraft();
    document.getElementById('postHeader').value = '';
    checkboxes[0].checked = false;
    restoreArticleDraft();
    assert.equal(document.getElementById('postHeader').value, 'Valid header');
    assert.equal(checkboxes[0].checked, true);
    document.getElementById('postHeader').value = 'New text';
    restoreArticleDraft(true);
    assert.equal(document.getElementById('postHeader').value, 'New text');
});

test('typing before tags load preserves saved tag selection', () => {
    fillDraft();
    document.getElementById('postTagCheckboxes').dataset.loaded = 'false';
    checkboxes = [];
    document.getElementById('postHeader').value = 'New text';
    saveArticleDraft();
    assert.deepEqual(JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY)).tags, [18]);
});

test('fetches every tag page and stops at last_page', async () => {
    const urls = [];
    mock.method(globalThis, 'fetch', async url => {
        urls.push(url);
        return Response.json({ data: [{ id: urls.length }], meta: { last_page: 3 } });
    });
    assert.deepEqual(await fetchAllTags(), [{ id: 1 }, { id: 2 }, { id: 3 }]);
    assert.deepEqual(urls, ['/api/tags?page=1', '/api/tags?page=2', '/api/tags?page=3']);
});

for (const status of [401, 403, 422, 'network']) {
    test(`failed publication (${status}) preserves fields, tags and draft`, async () => {
        fillDraft();
        initPostForms(() => assert.fail('Must not refresh after an error'));
        mock.method(globalThis, 'fetch', async () => {
            if (status === 'network') throw new TypeError('Failed to fetch');
            return Response.json({ message: 'Rejected', errors: { 'tags.0': ['Обраний тег не існує.'] } }, { status });
        });
        await document.getElementById('newPostForm').listeners.submit({ preventDefault() {} });
        assert.equal(document.getElementById('postHeader').value, 'Valid header');
        assert.equal(checkboxes[0].checked, true);
        assert.ok(localStorage.getItem(DRAFT_STORAGE_KEY));
        assert.equal(document.getElementById('newPostFormSubmit').disabled, false);
        if (status === 422) assert.equal(document.getElementById('postTagsError').innerText, 'Обраний тег не існує.');
    });
}

test('successful publication clears the draft and resets the form', async () => {
    fillDraft();
    let savedPage;
    initPostForms(page => { savedPage = page; });
    mock.method(globalThis, 'fetch', async () => Response.json({ data: { id: 1 } }, { status: 201 }));
    await document.getElementById('newPostForm').listeners.submit({ preventDefault() {} });
    assert.equal(localStorage.getItem(DRAFT_STORAGE_KEY), null);
    assert.equal(document.getElementById('postHeader').value, '');
    assert.equal(checkboxes[0].checked, false);
    assert.equal(savedPage, 1);
});

test('HTTP errors are rejected, including non-JSON responses and empty DELETE responses', async () => {
    for (const status of [401, 403, 500]) {
        await assert.rejects(readResponse(new Response('Error', { status })), error => error.status === status);
    }
    assert.deepEqual(await readResponse(new Response(null, { status: 204 })), {});
});

test('HTML escaping neutralizes user content inside templates', () => {
    assert.equal(escapeHtml('<img src="x" onerror="alert(1)">'), '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
});

test('edit validation displays tags.* errors without losing values or the creation draft', async () => {
    fillDraft();
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    initPostForms(() => assert.fail('Must not refresh after an error'));
    document.getElementById('editPostHeader').value = 'Edited header';
    document.getElementById('editPostDescription').value = 'An edited description longer than twenty characters.';
    mock.method(globalThis, 'fetch', async () => Response.json({
        errors: { 'tags.0': ['Обраний тег не існує.'] },
    }, { status: 422 }));
    await document.getElementById('editPostForm').listeners.submit({ preventDefault() {} });
    assert.equal(document.getElementById('editPostTagsError').innerText, 'Обраний тег не існує.');
    assert.equal(document.getElementById('editPostHeader').value, 'Edited header');
    assert.equal(localStorage.getItem(DRAFT_STORAGE_KEY), draft);
});

test('client validation blocks publication of invalid fields', async () => {
    initPostForms(() => assert.fail('Must not refresh invalid fields'));
    document.getElementById('postHeader').value = '1234';
    document.getElementById('postDescription').value = 'Short';
    mock.method(globalThis, 'fetch', () => assert.fail('Must not send invalid fields'));
    await document.getElementById('newPostForm').listeners.submit({ preventDefault() {} });
    assert.ok(document.getElementById('postHeaderError').innerText);
    assert.ok(document.getElementById('postDescriptionError').innerText);
    assert.ok(localStorage.getItem(DRAFT_STORAGE_KEY));
});

test('post cards show a short excerpt and open the full article safely', async () => {
    const { loadPosts, loadPost } = await import('../../resources/js/posts.js');
    const description = `<b>Текст</b> ${'🙂'.repeat(250)}\nПовний текст статті`;
    const post = {
        id: 7, header: '<script>Заголовок</script>', description,
        created_at: '2026-01-01T12:00:00Z', user: { username: 'Anna' },
        tags: [{ tag_name: 'Laravel' }],
    };
    const detail = { ...post, header: 'Актуальний заголовок', description: description + '\nОновлено на сервері' };
    const urls = [];
    mock.method(globalThis, 'fetch', async url => {
        urls.push(url);
        return Response.json({ data: url === '/api/posts/7' ? detail : [post] });
    });
    await loadPosts(1);
    const card = document.getElementById('postsList').innerHTML;
    const excerpt = Array.from(description.replace(/\s+/g, ' ')).slice(0, 240).join('') + '…';
    assert.ok(card.includes(escapeHtml(excerpt)));
    assert.ok(card.includes(escapeHtml(post.header)));
    assert.ok(!card.includes('Повний текст статті'));
    assert.ok(card.includes('Читати повністю'));

    assert.ok(card.includes('href="/posts/7"'));
    await loadPost(7);
    assert.equal(document.getElementById('viewPostDescription').textContent, detail.description);
    assert.equal(document.getElementById('viewPostHeader').textContent, detail.header);
    assert.deepEqual(urls, ['/api/posts?page=1', '/api/posts/7']);
    assert.equal(document.getElementById('viewPostTags').textContent, '#Laravel');
});

for (const status of [401, 403, 404, 'network']) {
    test(`article detail API error (${status}) clears the previous article and shows an error`, async () => {
        const { loadPost } = await import('../../resources/js/posts.js');
        document.getElementById('viewPostDescription').textContent = 'Previous article';
        mock.method(globalThis, 'fetch', async url => {
            assert.equal(url, '/api/posts/7');
            assert.equal(document.getElementById('viewPostHeader').textContent, 'Завантаження статті…');
            if (status === 'network') throw new TypeError('Failed to fetch');
            return Response.json({ message: 'Rejected' }, { status });
        });
        await loadPost(7);
        assert.equal(document.getElementById('viewPostDescription').textContent, '');
        assert.equal(document.getElementById('viewPostHeader').textContent, 'Не вдалося завантажити статтю');
        const error = document.getElementById('viewPostDescription').innerHTML;
        assert.ok(error.includes(status === 401 ? 'Потрібна авторизація' : status === 404 ? 'Статтю не знайдено' : 'Помилка завантаження'));
    });
}
