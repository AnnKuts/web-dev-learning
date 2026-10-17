# Звіт про виконання практичної роботи №2
> names of files are clickable btw :)

### Крок 1. Підготувати структуру проєкту.

> Створіть папку практикуму (наприклад, `practicum02/`) з файлом `form.php`, що міститиме і HTML-форму, і PHP-обробник (простіше для навчального завдання, ніж окремий `process.php`).

1. Папка практикуму [`project8-9/blog/`](../../project8-9/blog/). Головна сторінка знаходиться у файлі [`welcome.blade.php`](../../project8-9/blog/resources/views/welcome.blade.php), HTML-форми винесені в окремі Blade-шаблони, а JavaScript у модулі.

2. PHP-обробка форми реалізована засобами Laravel:
   - серверна валідація виконується у [`StorePostRequest.php`](../../project8-9/blog/app/Http/Requests/StorePostRequest.php);
   - збереження статті обробляється методом `store()` контролера [`PostController.php`](../../project8-9/blog/app/Http/Controllers/PostController.php);
   - відповідний маршрут `POST /api/posts` визначено у файлі [`api.php`](../../project8-9/blog/routes/api.php).

### Крок 2. Створити HTML-форму.

> Додайте форму (`method="post"`, `action="form.php"`) із полями свого варіанта: текстові поля, число, за потреби `select` або `checkbox`. Для кожного поля додайте відповідні HTML5-атрибути валідації (`required`, `min/max`, `pattern` тощо) згідно з правилами варіанта.

HTML-форма створення статті реалізована у файлі [`post-modal.blade.php`](../../project8-9/blog/resources/views/partials/modals/post-modal.blade.php) (`#newPostForm`), а її поля винесені у [`form-fields.blade.php`](../../project8-9/blog/resources/views/partials/posts/form-fields.blade.php). Вона містить поле `header` з атрибутами `required`, `minlength="5"`, `maxlength="100"`, поле `description` з `required`, `minlength="20"` та чекбокси для вибору тегів, які генеруються функцією `loadTagsForSelects()` у [`tags.js`](../../project8-9/blog/resources/js/tags.js). Замість `action="form.php"` форма надсилає дані асинхронно через JavaScript (`fetch()`) на `POST /api/posts` за допомогою [`post-form.js`](../../project8-9/blog/resources/js/post-form.js).

### Крок 3. Реалізувати серверну обробку й валідацію.

> На початку файлу перевірте, чи форму вже надіслано (`$_SERVER['REQUEST_METHOD'] === 'POST'`). Отримайте значення полів через `$_POST`, для кожного поля виконайте перевірку згідно з правилами свого варіанта (обов'язковість, тип/діапазон, формат через `preg_match` за потреби) і накопичте масив помилок.

POST-запити до `/api/posts` спрямовуються через маршрут у [`api.php`](../../project8-9/blog/routes/api.php) до методу `store()` контролера [`PostController.php`](../../project8-9/blog/app/Http/Controllers/PostController.php). Серверна валідація виконується у [`StorePostRequest.php`](../../project8-9/blog/app/Http/Requests/StorePostRequest.php) для створення статей та [`UpdatePostRequest.php`](../../project8-9/blog/app/Http/Requests/UpdatePostRequest.php) для редагування. Перевіряються довжина заголовка (5–100 символів), контенту (щонайменше 20 символів), коректність масиву тегів та існування їхніх ID у базі даних. У разі помилок Laravel повертає JSON-відповідь зі статусом `422`.

### Крок 4. Показати результат обробки.

> Якщо масив помилок не порожній — повторно виведіть форму, показавши повідомлення про кожну помилку і підставивши вже введені користувачем значення в поля (щоб не змушувати вводити все заново); значення обов'язково виводьте через `htmlspecialchars()`. Якщо помилок немає — виведіть підтвердження з прийнятими даними.

Обробка результатів реалізована у [`post-form.js`](../../project8-9/blog/resources/js/post-form.js) та [`validation.js`](../../project8-9/blog/resources/js/validation.js). У разі помилки серверної валідації (`HTTP 422`) функція `showPostErrors()` відображає повідомлення під відповідними полями, а введені значення зберігаються завдяки асинхронному надсиланню форми через `fetch()`. Для безпечного виведення даних використовуються `textContent`, `innerText` та `escapeHtml()` із [`ui.js`](../../project8-9/blog/resources/js/ui.js). Після успішного створення статті функція `showToast()` показує підтвердження, а `loadPosts()` із [`posts.js`](../../project8-9/blog/resources/js/posts.js) оновлює список статей.

### Крок 5. Додати клієнтську JavaScript-валідацію.

> Додайте невеликий скрипт, що перед відправкою форми перевіряє хоча б одне поле (наприклад, довжину чи формат) і показує повідомлення без перезавантаження сторінки (`addEventListener('submit', ...)` з `event.preventDefault()` у разі помилки).

Клієнтська валідація реалізована у [`validation.js`](../../project8-9/blog/resources/js/validation.js). Функція `validatePostFields()` перевіряє довжину заголовка (5–100 символів) і контенту (мінімум 20 символів), а `setFieldError()` відображає повідомлення про помилки. Обробник `addEventListener('submit', ...)` у [`post-form.js`](../../project8-9/blog/resources/js/post-form.js) використовує `event.preventDefault()` для запобігання стандартному надсиланню форми та блокує `fetch()`-запит, якщо дані некоректні. Помилки автоматично зникають після виправлення полів завдяки обробникам події `input`.

### Крок 6. Реалізувати сценарій localStorage/sessionStorage.

> Відповідно до свого варіанта реалізуйте на JavaScript збереження потрібних даних у `localStorage` чи `sessionStorage` та їх відновлення після перезавантаження сторінки (значення читається й підставляється в поле/елемент інтерфейсу одразу після завантаження сторінки).

Автозбереження чернетки статті реалізовано у [`storage.js`](../../project8-9/blog/resources/js/storage.js). Функція `saveArticleDraft()` зберігає заголовок, контент і вибрані теги в `localStorage` під ключем `article_draft_variant3` при кожній зміні полів. Функція `restoreArticleDraft()` відновлює ці дані після перезавантаження сторінки, зокрема вибрані теги після їх асинхронного завантаження. Функція `clearArticleDraft()` очищує чернетку після успішної публікації або за бажанням користувача. У разі помилки публікації введені дані зберігаються.

### Крок 7. Перевірити роботу.

> Перевірте форму з коректними даними, з некоректними даними для кожного правила валідації (порожнє поле, значення поза діапазоном, неправильний формат) і роботу `localStorage` - значення повинні зберігатися і відновлюватися після перезавантаження сторінки.

<img width="1311" height="933" alt="Screenshot 2026-10-17 at 16 12 00" src="https://github.com/user-attachments/assets/50fc0c46-fdb2-4212-bf22-3bf56ebf3c05" />

*Створення чернетки*

<img width="1311" height="933" alt="Screenshot 2026-10-17 at 16 12 54" src="https://github.com/user-attachments/assets/bfe44d37-f498-4a0b-89e2-973691d4364b" />

*Відновлення чернетки після завантаження знову*

<img width="1142" height="601" alt="Screenshot 2026-10-17 at 16 15 00" src="https://github.com/user-attachments/assets/e36ef8bb-93be-47c1-9a20-21b4cb49dadd" /> 
<img width="880" height="105" alt="Screenshot 2026-10-17 at 16 25 02" src="https://github.com/user-attachments/assets/6ed3fc61-5b5d-41f1-8e8e-02a9eee45dbc" />

*Проходження тестів*

Тести серверної валідації знаходяться у [`AuthModeTest.php`](../../project8-9/blog/tests/Feature/AuthModeTest.php) (метод `test_post_validation_rules_for_variant_3()`), а перевірки клієнтської валідації, обробки помилок і роботи чернетки у [`blog.test.js`](../../project8-9/blog/tests/Frontend/blog.test.js)
