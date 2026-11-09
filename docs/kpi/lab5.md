# Звіт про виконання практичної роботи №5

Для реалізації використовується наявний проєкт [`project8-9/blog/`](../../project8-9/blog/).

### Крок 1. Підготувати JSON-ендпоінт списку.

> У файлі `api_list.php` підключіть `db.php` (з практикуму №4), виконайте `SELECT * FROM <таблиця>` (за потреби — з фільтром за `$_GET['q']`) і виведіть результат як JSON: `header('Content-Type: application/json'); echo json_encode($rows);`.

Замість `api_list.php` реалізовано маршрут `GET /api/posts` у [`api.php`](../../project8-9/blog/routes/api.php), який викликає метод `index()` контролера [`PostController.php`](../../project8-9/blog/app/Http/Controllers/PostController.php). За допомогою Eloquent контролер отримує статті разом з авторами й тегами, фільтрує їх за параметром `q`, сортує від нових до старих і повертає по 15 записів на сторінку.

JSON-відповідь формується у [`PostResource.php`](../../project8-9/blog/app/Http/Resources/PostResource.php). Вона містить необхідні поля `id`, `title`, `content`, `author`, `published_at`, які відповідають наявним даним `id`, `header`, `description`, `user.username`, `created_at`. Статті передаються в масиві `data`, відомості про пагінацію у `links` і `meta`. Попередні поля відповіді збережено для сумісності з інтерфейсом.

### Крок 2. Підготувати сторінку з контейнером для результатів.

> У `index.html` (або `index.php`) додайте порожній контейнер (наприклад, `<table id="results">` або `<div id="results">`) і поле пошуку `<input id="search">`.

Головна сторінка [`welcome.blade.php`](../../project8-9/blog/resources/views/welcome.blade.php) підключає шаблон [`list.blade.php`](../../project8-9/blog/resources/views/partials/posts/list.blade.php). У ньому розміщені поле пошуку `#postSearch`, контейнер результатів `#postsList` та блок пагінації `#postsPagination`. Самі картки статей не виводяться в Blade, а створюються JavaScript після отримання відповіді сервера.

### Крок 3. Завантажити список через AJAX при відкритті сторінки.

> У `script.js` викличте `fetch('api_list.php')`, перетворіть відповідь методом `.json()` і виведіть отримані дані в контейнер — без жодного PHP-виводу таблиці всередині `index.html`.

У [`app.js`](../../project8-9/blog/resources/js/app.js) обробник `DOMContentLoaded` запускає завантаження статей через `loadPosts()` із [`posts.js`](../../project8-9/blog/resources/js/posts.js). Функція `fetchPosts()` із [`api.js`](../../project8-9/blog/resources/js/api.js) формує адресу `/api/posts?page=1` та виконує `fetch()`-запит; `readResponse()` перевіряє статус і обробляє JSON через `response.json()`.

Отримані статті відображаються в `#postsList` без перезавантаження сторінки. Кожна картка містить заголовок, уривок тексту, автора, дату й теги. Дані перед вставкою в HTML екрануються за допомогою `escapeHtml()` із [`ui.js`](../../project8-9/blog/resources/js/ui.js).

### Крок 4. Реалізувати живий пошук без перезавантаження.

> На подію `input` поля пошуку викликайте `fetch('api_list.php?q=' + encodeURIComponent(значення))`, отримуйте відфільтрований список і перемальовуйте контейнер.

У [`posts.js`](../../project8-9/blog/resources/js/posts.js) для поля `#postSearch` встановлено обробник події `input`, який викликає `loadPosts(1)`. У [`api.js`](../../project8-9/blog/resources/js/api.js) значення пошуку передається параметром `q` через `URLSearchParams`, наприклад: `GET /api/posts?page=1&q=Laravel+AJAX`.

У [`PostController.php`](../../project8-9/blog/app/Http/Controllers/PostController.php) пошук виконується за заголовком статті через умову `where('header', 'like', ...)` до застосування пагінації. Результати одразу оновлюються в `#postsList`; якщо збігів немає, виводиться відповідне повідомлення. `AbortController` скасовує попередній запит під час нового пошуку, щоб застарілі результати не замінювали актуальні.

### Крок 5. Підготувати ендпоінт додавання запису.

> У файлі `api_add.php` прийміть дані з POST-запиту (`$_POST` або JSON-тіло через `php://input`), виконайте `INSERT` через підготовлений запит (практикум №4) і поверніть JSON із доданим записом та кодом `201`.

Замість `api_add.php` використовується маршрут `POST /api/posts` із [`api.php`](../../project8-9/blog/routes/api.php). Дані форми (`header`, `description`, `tags`) перевіряються у [`StorePostRequest.php`](../../project8-9/blog/app/Http/Requests/StorePostRequest.php): заголовок повинен містити 5–100 символів, текст — не менше 20, а вибрані теги мають існувати в базі даних.

Метод `store()` у [`PostController.php`](../../project8-9/blog/app/Http/Controllers/PostController.php) визначає автора та викликає [`PostService.php`](../../project8-9/blog/app/Services/PostService.php), де стаття зберігається через Eloquent у транзакції. Сервер повертає створений запис у форматі JSON зі статусом `201 Created`.

### Крок 6. Додати запис через AJAX без перезавантаження сторінки.

> Обробіть відправлення форми через `event.preventDefault()`, викличте `fetch('api_add.php', {method: 'POST', ...})` і після успіху додайте новий рядок у контейнер (або повторно завантажте список), не перезавантажуючи сторінку.

Форма `#newPostForm` знаходиться в [`post-modal.blade.php`](../../project8-9/blog/resources/views/partials/modals/post-modal.blade.php). Її обробник у [`post-form.js`](../../project8-9/blog/resources/js/post-form.js) викликає `event.preventDefault()`, перевіряє поля й передає дані через `createPost()` з [`api.js`](../../project8-9/blog/resources/js/api.js). Запит надсилається методом `POST` із JSON-тілом та заголовком `Content-Type: application/json`.

Після успішної публікації форма закривається, чернетка очищується, показується повідомлення про успіх, а список статей завантажується повторно. Обробник у [`app.js`](../../project8-9/blog/resources/js/app.js) скидає пошук і фільтр тегів та відкриває першу сторінку; завдяки сортуванню нова стаття відображається першою без перезавантаження документа.

### Крок 7. Обробити помилки мережі та сервера.

> Перевіряйте `response.ok` і використовуйте `.catch()` для мережевих помилок; при невдачі покажіть повідомлення в тому самому контейнері, а не лише в консолі браузера.

У [`api.js`](../../project8-9/blog/resources/js/api.js) функція `readResponse()` перевіряє `response.ok` і обробляє HTTP-помилки, зокрема `401` і `403`. Помилки запитів перехоплюються блоками `try/catch`. У [`posts.js`](../../project8-9/blog/resources/js/posts.js) функція `renderListError()` із [`ui.js`](../../project8-9/blog/resources/js/ui.js) показує повідомлення про невдале завантаження безпосередньо в `#postsList`.

Помилки публікації відображаються у формі через `#postFormError` із [`form-fields.blade.php`](../../project8-9/blog/resources/views/partials/posts/form-fields.blade.php), а помилки валідації (`422`) — під відповідними полями за допомогою `showPostErrors()` із [`validation.js`](../../project8-9/blog/resources/js/validation.js). При невдалому надсиланні введені дані залишаються у формі.

### Крок 8. Перевірити результат в інструментах розробника.

> Відкрийте вкладку Network браузера, переконайтеся, що запити до `api_list.php`/`api_add.php` мають тип `fetch`, а вкладка Elements показує, що DOM оновлюється без повторного завантаження документа.

Перевірку виконано у Chrome DevTools. У вкладці **Network → Fetch/XHR** під час пошуку зафіксовано GET-запити до `/api/posts` із параметрами `page` та `q`, типом `fetch` і статусом `200 OK`. Список статей змінювався без перезавантаження сторінки.

<img width="2048" height="1140" alt="AJAX-пошук статей у вкладці Network" src="https://github.com/user-attachments/assets/6763d689-3a08-4747-9437-a08877b9d351" />
*Перевірка AJAX-пошуку статей у Network*

Під час публікації статті зафіксовано POST-запит до `/api/posts` зі статусом `201 Created`, після якого автоматично виконався GET-запит до `/api/posts?page=1` зі статусом `200 OK`. Обидва запити мали тип `fetch`, а нова стаття з'явилася першою в списку.

<img width="3420" height="1904" alt="POST-запит і оновлення списку в Network" src="https://github.com/user-attachments/assets/be9d5e45-d095-48e0-831e-4eb8163e2da2" />
*Публікація статті через AJAX та оновлення списку*

У вкладці **Elements** перевірено контейнер `#postsList` та розміщені всередині елементи `<article>`, які JavaScript створює після отримання JSON-відповіді. Сторінка при пошуку та публікації не перезавантажувалася.

<img width="2048" height="1140" alt="Контейнер postsList у вкладці Elements" src="https://github.com/user-attachments/assets/d70600ab-c639-4808-96ec-3959fe630259" />
*Перевірка контейнера `#postsList` та карток статей у DOM*

За результатами всі 18 PHP-тестів (`php artisan test`), 18 JavaScript-тестів (`npm test`) і production-збірки (`npm run build`) виконалися успішно. Тести знаходяться у [`tests/Feature/`](../../project8-9/blog/tests/Feature/) та [`tests/Frontend/blog.test.js`](../../project8-9/blog/tests/Frontend/blog.test.js).
