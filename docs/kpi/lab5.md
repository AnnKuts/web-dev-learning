# Звіт про виконання практичної роботи №5

### Крок 1. Підготувати JSON-ендпоінт списку.

> У файлі api_list.php підключіть db.php (з практикуму No4), виконайте SELECT * FROM <таблиця>
> (за потреби - з фільтром за $_GET['q']) і виведіть результат як JSON: header('Content-Type:
> application/json'); echo json_encode($rows);.

Для варіанта №3 «Блог/CMS для статей» використовується наявний Laravel-проєкт [`project8-9/blog/`](../../project8-9/blog/). Роль `api_list.php` виконує маршрут `GET /api/posts` із [`api.php`](../../project8-9/blog/routes/api.php), який викликає метод `index()` у [`PostController.php`](../../project8-9/blog/app/Http/Controllers/PostController.php). Контролер отримує статті разом з авторами й тегами через Eloquent, застосовує пошук за параметром `q` та повертає по 15 записів на сторінку. Статті впорядковані за датою створення від нових до старих, а за однакової дати — за `id` у спадному порядку.

JSON формується у [`PostResource.php`](../../project8-9/blog/app/Http/Resources/PostResource.php). Кожна стаття містить поля варіанта: `id`, `title` (наявне поле `header`), `content` (`description`), `author` (ім’я користувача `user.username`) та `published_at` (`created_at`, оскільки стаття публікується одразу після створення). Масив статей знаходиться у полі `data`, а дані пагінації — у `links` і `meta`. Старі поля відповіді та теги збережені для сумісності з наявним інтерфейсом; змінювати структуру бази даних не потрібно. Доступ до API залишається захищеним через `auth:sanctum`.

### Крок 2. Підготувати сторінку з контейнером для результатів.

> У `index.html` (або `index.php`) додайте порожній контейнер
> (наприклад, `<table id="results">` або `<div id="results">`)
> і поле пошуку `<input id="search">`.

Головна сторінка [`welcome.blade.php`](../../project8-9/blog/resources/views/welcome.blade.php) підключає шаблон [`list.blade.php`](../../project8-9/blog/resources/views/partials/posts/list.blade.php). У ньому розміщені поле пошуку `#postSearch` типу `search`, порожній контейнер `#postsList` для карток статей і контейнер `#postsPagination` для навігації між сторінками. Підпис поля вказує, що пошук виконується за заголовком. Атрибут `aria-live="polite"` дозволяє допоміжним технологіям повідомляти про оновлення списку. Картки статей не виводяться через Blade: їх створює JavaScript після отримання JSON.

### Крок 3. Завантажити список через AJAX при відкритті сторінки.

> У script.js викличте fetch('api_list.php'), перетворіть відповідь методом .json() і виведіть
> отримані дані в контейнер - без жодного PHP-виводу таблиці всередині index.html.

У [`app.js`](../../project8-9/blog/resources/js/app.js) обробник `DOMContentLoaded` викликає `refreshCurrentTab()`, який для вкладки статей запускає `loadPosts()` із [`posts.js`](../../project8-9/blog/resources/js/posts.js). Функція показує стан завантаження й викликає `fetchPosts()` із [`api.js`](../../project8-9/blog/resources/js/api.js). Запит `fetch('/api/posts?page=1', ...)` отримує дані, а `readResponse()` читає JSON методом `response.json()` і перевіряє статус відповіді.

Після отримання даних `loadPosts()` формує картки в `#postsList` та кнопки пагінації в `#postsPagination`. У картці відображаються заголовок, уривок тексту, автор, дата публікації й теги; повний текст доступний на окремій сторінці статті. Текстові дані перед вставкою в HTML екрануються через `escapeHtml()` із [`ui.js`](../../project8-9/blog/resources/js/ui.js). Якщо користувач не авторизований, у контейнері з’являється повідомлення з пропозицією увійти.

### Крок 4. Реалізувати живий пошук без перезавантаження.

> На подію input поля пошуку викликайте fetch('api_list.php?q=' +
> encodeURIComponent(значення)), отримуйте відфільтрований список і перемальовуйте
> контейнер.

Функція `initPosts()` у [`posts.js`](../../project8-9/blog/resources/js/posts.js) підписує поле `#postSearch` на подію `input`. Кожна зміна значення викликає `loadPosts(1)`, щоб почати показ результатів із першої сторінки. Функція зчитує пошуковий текст, а `fetchPosts()` у [`api.js`](../../project8-9/blog/resources/js/api.js) додає його до URL як параметр `q` через `URLSearchParams`, який виконує URL-кодування. Наприклад, пошук `Laravel AJAX` надсилає запит `GET /api/posts?page=1&q=Laravel+AJAX`.

У методі `index()` контролера [`PostController.php`](../../project8-9/blog/app/Http/Controllers/PostController.php) параметр `q` перевіряється як рядок і використовується в умові `where('header', 'like', '%' . $query . '%')`. Пошук виконується на сервері за заголовками всіх статей до застосування пагінації. Порожній пошук повертає звичайний список, а відсутність збігів показується повідомленням у `#postsList`. Перехід між сторінками зберігає поточний пошук. `AbortController` скасовує попередній запит, щоб під час швидкого введення застаріла відповідь не замінила актуальні результати.

### Крок 5. Підготувати ендпоінт додавання запису.

> У файлі api_add.php прийміть дані з POST-запиту ($_POST або JSON-тіло через php://input),
> виконайте INSERT через підготовлений запит (практикум №4) і поверніть JSON із доданим записом
> та кодом 201.

Роль `api_add.php` виконує маршрут `POST /api/posts` у [`api.php`](../../project8-9/blog/routes/api.php). Він передає запит методу `store()` у [`PostController.php`](../../project8-9/blog/app/Http/Controllers/PostController.php). Форма надсилає JSON із наявними полями `header`, `description` і масивом `tags`. Правила у [`StorePostRequest.php`](../../project8-9/blog/app/Http/Requests/StorePostRequest.php) перевіряють довжину заголовка (5–100 символів), тексту (щонайменше 20 символів) та існування вибраних тегів.

Контролер визначає автора через `auth()->id()` і викликає `create()` сервісу [`PostService.php`](../../project8-9/blog/app/Services/PostService.php). Стаття та її зв’язки з тегами зберігаються в транзакції; Eloquent використовує параметризовані запити. Після збереження контролер повертає створений запис через `PostResource` у полі `data` JSON-відповіді та явно встановлює HTTP-статус `201`.

### Крок 6. Додати запис через AJAX без перезавантаження сторінки.

> Обробіть відправлення форми через event.preventDefault(), викличте fetch('api_add.php',
> {method: 'POST', ...}), і після успіху додайте новий рядок у контейнер (або повторно
> завантажте список), не перезавантажуючи сторінку.

Форма `#newPostForm` розміщена у [`post-modal.blade.php`](../../project8-9/blog/resources/views/partials/modals/post-modal.blade.php). У [`post-form.js`](../../project8-9/blog/resources/js/post-form.js) обробник події `submit` викликає `event.preventDefault()`, перевіряє поля та передає дані функції `createPost()` із [`api.js`](../../project8-9/blog/resources/js/api.js). Вона використовує `fetch()` із `method: 'POST'`, заголовком `Content-Type: application/json` і тілом `JSON.stringify(data)`.

Після успішної відповіді форма очищує чернетку, закриває модальне вікно, показує підтвердження та викликає `onSaved(1)`. Обробник у [`app.js`](../../project8-9/blog/resources/js/app.js) очищує пошук і завантажує першу сторінку списку. Завдяки сортуванню на сервері нова стаття з’являється на початку списку, навіть якщо до публікації був активний фільтр або інша сторінка пагінації. Якщо публікація відбулася зі сторінки окремої статті, у [`show.blade.php`](../../project8-9/blog/resources/views/posts/show.blade.php) відкривається секція `#publishedPosts` зі списком. Усі ці дії оновлюють DOM без перезавантаження документа.

### Крок 7. Обробити помилки мережі та сервера.

> Перевіряйте response.ok і використовуйте .catch() для мережевих помилок; при невдачі
> покажіть повідомлення в тому самому контейнері, а не лише в консолі браузера.

Функція `readResponse()` у [`api.js`](../../project8-9/blog/resources/js/api.js) перевіряє `response.ok` і створює помилку для невдалого HTTP-статусу. Для `401` та `403` передбачені повідомлення про авторизацію й відсутність дозволу; інші помилки використовують повідомлення сервера або код статусу. Мережеві помилки `fetch()` та помилки HTTP перехоплюються блоками `try/catch`.

У [`posts.js`](../../project8-9/blog/resources/js/posts.js) помилка завантаження чи пошуку передається функції `renderListError()` із [`ui.js`](../../project8-9/blog/resources/js/ui.js), яка виводить повідомлення безпосередньо в `#postsList`. У [`post-form.js`](../../project8-9/blog/resources/js/post-form.js) помилка публікації або редагування відображається в області `#postFormError` чи `#editPostFormError` шаблону [`form-fields.blade.php`](../../project8-9/blog/resources/views/partials/posts/form-fields.blade.php). Помилки валідації зі статусом `422` додатково показуються біля відповідних полів через `showPostErrors()` із [`validation.js`](../../project8-9/blog/resources/js/validation.js). Введені дані залишаються у формі, а кнопка надсилання знову стає доступною.

### Крок 8. Перевірити результат в інструментах розробника.

> Відкрийте вкладку Network браузера, переконайтеся, що запити до api_list.php/api_add.php
> мають тип fetch, а вкладка Elements показує, що DOM оновлюється без повторного завантаження
> документа.

Перевірку виконано в Chrome DevTools за допомогою вкладок Network та Elements. Оскільки проєкт реалізовано на Laravel, замість окремих PHP-файлів використовуються API-маршрути /api/posts.
У вкладці Network із фільтром Fetch/XHR зафіксовано GET-запити до /api/posts із параметрами page та q. Усі зафіксовані запити пошуку мали тип fetch і повернули HTTP-статус 200 OK. Під час введення тексту список статей оновлювався без перезавантаження сторінки.

<img width="2048" height="1140" alt="image" src="https://github.com/user-attachments/assets/6763d689-3a08-4747-9437-a08877b9d351" />
Виконання AJAX-запитів під час пошуку статей

Після створення статті зафіксовано POST-запит до /api/posts зі статусом 201 Created. Після нього автоматично виконався GET-запит до /api/posts?page=1 зі статусом 200 OK. Обидва запити мали тип fetch. Нова стаття відобразилася на початку списку без повного перезавантаження сторінки.

<img width="3420" height="1904" alt="image" src="https://github.com/user-attachments/assets/be9d5e45-d095-48e0-831e-4eb8163e2da2" />
POST-запит створення статті та подальше оновлення списку через GET-запит.

У вкладці Elements перевірено контейнер #postsList, усередині якого розміщені елементи <article> з картками статей. Вміст контейнера формується JavaScript після отримання JSON-відповіді сервера. Оновлення списку виконується без повторного завантаження HTML-документа

<img width="2048" height="1140" alt="image" src="https://github.com/user-attachments/assets/d70600ab-c639-4808-96ec-3959fe630259" />
Перевірка контейнера #postsList та елементів статей у DOM (Elements)

Під час перевірки реалізації успішно виконані 18 наявних PHP-тестів (`php artisan test`), 18 JavaScript-тестів (`npm test`) і production-збірка (`npm run build`).
