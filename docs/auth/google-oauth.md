# Вхід через Google

Реалізація для [`project8-9/blog`](../../project8-9/blog/) використовує Laravel Socialite 5.31, OAuth authorization code flow з PKCE та OIDC scopes `openid email profile`. Наявні `/api/login`, `/api/register`, `/api/logout`, Sanctum, політики та API статей збережено. Облікові дані Google потрібно налаштувати вручну; жодні змінні Railway чи наявний `.env` не змінювалися.

## Як працює вхід

1. Кнопка **Continue with Google** у формах входу та реєстрації викликає `POST /auth/google/start` з CSRF-токеном. Кнопки з'являються, коли налаштовано всі три параметри Google.
2. Сервер створює п'ятихвилинний контекст у сесії та перенаправляє браузер на Google. Socialite створює `state` і PKCE challenge.
3. `GET /auth/google/callback` перевіряє сесію, час дії та `state`. Socialite перевіряє й споживає state, обмінює authorization code з PKCE verifier через серверний запит і отримує ідентичність з Google userinfo через HTTPS. Дані не беруться з email чи ID, переданих браузером; довільні JWT не декодуються нашим кодом.
4. Ідентичність визначається за стабільним `sub`, збереженим у `users.google_id`. Перевіряються формат і наявність `sub`, збіг із Socialite ID, коректний email та строгий `email_verified=true`. Повторний вхід за `sub` не змінює локальний email, навіть якщо email у Google змінився.
5. Новий користувач отримує `password=null`. Якщо email уже належить іншому запису (включно з видаленим), автоматичне створення або зв'язування заборонено. Видалений акаунт не відновлюється через OAuth.
6. Сервер створює випадковий одноразовий код на 60 секунд. У БД зберігаються лише його SHA-256, SHA-256 ID сесії, ID користувача й строк дії. Браузер переходить на фіксований `/#google_code=...`; сторонні return URL не приймаються. Це не Sanctum bearer token.
7. JavaScript одразу прибирає fragment із історії та надсилає код на CSRF-захищений `POST /auth/google/exchange`. Перевіряються сесія та строк дії. Код споживається атомарно в транзакції; тільки тоді видається Sanctum token у JSON. OAuth-маршрути блокують конкурентні запити однієї сесії та мають rate limit.
8. Токен потрапляє до наявного frontend auth state. Вихід видаляє поточний Sanctum token і очищує локальний стан. OAuth не викликає `Auth::login()`, тому окремої постійної cookie-авторизації не залишається. Вихід із блогу не завершує сесію самого Google.

Google access/refresh tokens не зберігаються. Відповіді з кодами/токенами мають `Cache-Control: no-store`; після callback використовується `Referrer-Policy: no-referrer`. Скасування, недійсний state, невірна ідентичність або збій Google повертають фіксований статус помилки без деталей провайдера. У журнал потрапляє тільки клас помилки.

## Безпечне підключення до існуючого акаунту

Спочатку увійдіть звичайним email/паролем. У меню акаунту натисніть **Підключити Google**, введіть поточний пароль і виберіть власний акаунт Google. Сервер перевіряє реальний, невідкликаний Sanctum token (локальний dev bypass для цього не використовується), пароль та свіжий OAuth callback. На callback повторно перевіряється, що токен чинний. Google identity іншого користувача або заміна вже підключеної identity заборонені. Підключення не видає додаткового токена й не змінює пароль/email. Для Google-only користувача повторне підключення не потрібне; встановлення пароля, відключення Google та відновлення доступу не входять до цієї зміни.

## Google Cloud Console

Відповідно до [документації Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect):

1. Створіть або виберіть проєкт у Google Cloud Console, відкрийте Google Auth Platform.
2. У Branding заповніть назву, контактний email, домен, домашню сторінку та потрібні посилання на політики. Налаштуйте Audience: для зовнішніх користувачів — External. Поки застосунок у Testing, додайте свої Google-акаунти до Test users.
3. У Data Access використайте лише `openid`, `email`, `profile`; доступ до Drive/Gmail та offline access не потрібні.
4. У Clients створіть **OAuth client ID → Web application**. Збережіть client ID та secret у приватному сховищі.
5. У Authorized redirect URIs додайте точні адреси:
   - локально: `http://localhost:8000/auth/google/callback`;
   - Railway: `https://ВАШ-ДОМЕН/auth/google/callback`.
6. Не використовуйте wildcard. Scheme, host, port і path повинні точно збігатися зі значенням `GOOGLE_REDIRECT_URI`. Використовуйте той самий host для відкриття сайту й callback: `localhost` та `127.0.0.1` мають різні cookies. Для серверного Socialite flow JavaScript origins не використовуються.
7. Перед доступом для всіх користувачів переведіть consent screen у відповідний production-режим і виконайте вимоги Google до публікації/верифікації, якщо Console їх показує. Для локального й production середовища бажані окремі OAuth clients.

## Змінні середовища

| Назва | Значення |
|---|---|
| `GOOGLE_CLIENT_ID` | Client ID створеного Web application |
| `GOOGLE_CLIENT_SECRET` | Приватний client secret |
| `GOOGLE_REDIRECT_URI` | Повна точна адреса `/auth/google/callback` цього середовища |

Їх читає [`config/services.php`](../../project8-9/blog/config/services.php), як передбачено [Socialite](https://laravel.com/docs/12.x/socialite). Secret ніколи не передається у frontend.

Локально передайте ці три змінні процесу PHP або додайте вручну лише нові ключі до приватного середовища, зберігши чинні значення. Перевірте, що немає кешованої конфігурації з іншого середовища. У Railway додайте три змінні вручну до сервісу застосунку; жодні `APP_KEY`, DB credentials або deployment workflow для цього не змінюються.

Для перевірки cookie-сесії на Railway потрібні HTTPS, працездатний постійний session store, HttpOnly cookies і SameSite=Lax (або режим, що допускає callback від Google). Перевірте Secure cookies у production. Застосунок уже має таблиці `sessions`, `cache` і `cache_locks`; database session/cache store підтримує цю реалізацію. Для кількох реплік потрібне спільне сховище сесій і блокувань. У production не використовуйте `array` session store. Ці параметри не змінювалися автоматично.

## Міграція та ризики

[`2026_11_11_000000_add_google_authentication.php`](../../project8-9/blog/database/migrations/2026_11_11_000000_add_google_authentication.php) додає nullable unique `users.google_id`, дозволяє `NULL` у `users.password` і створює `oauth_exchanges`. Існуючі користувачі, хеші паролів та статті не перезаписуються. Unique constraint захищає Google identity від дублювання при конкурентних запитах. Наявний unique email також залишається.

Зміна nullable-колонки та створення індексу можуть блокувати таблицю на конкретній production СУБД; спочатку перевірте міграцію на копії даних/стейджингу та зробіть резервну копію. Міграція тут виконувалася лише в ізольованих SQLite-тестах, не на Railway. Після ручного схвалення застосуйте міграції своїм звичайним процесом. `down()` видаляє зв'язки Google та одноразові коди, але залишає password nullable: Google-only користувачі не отримують вигаданих паролів. Відкат після реєстрації Google-only користувачів позбавить їх цього способу входу; плануйте його окремо.

Прострочені exchange records прибираються на наступному успішному Google login callback. Навіть до очищення вони непридатні для входу. Наявна архітектура зберігання Sanctum token у localStorage збережена; захист від XSS залишається важливим для всіх способів входу.

`composer audit --locked` під час реалізації повідомив про 54 advisories у 12 наявних пакетах (зокрема Laravel, Guzzle, Symfony). Ці версії не змінювалися встановленням Socialite; серед шести нових пакетів advisories не було. Це не означає, що весь dependency tree безпечний: перед production rollout потрібен окремий перегляд та сумісне оновлення залежностей.

## Локальна перевірка та перевірка після ручного розгортання

1. Використайте окрему локальну SQLite-базу з тестовими даними, передаючи її через process environment. Не запускайте `migrate:fresh` чи seeders з production connection. Звичайний `php artisan migrate` запускайте лише після перевірки, що поточна конфігурація вказує саме на ізольовану БД. Для ручного OAuth тесту потрібен постійний session store; для автоматичних тестів `phpunit.xml` уже використовує SQLite `:memory:`.
2. Налаштуйте Google client та локальний redirect URI, зберіть frontend через `npm run build`, запустіть `php artisan serve --host=localhost --port=8000`. Для перевірки справжньої авторизації використайте `DEV_AUTH_BYPASS=false` лише в локальному процесі.
3. Відкрийте сайт саме через `http://localhost:8000`, натисніть Google у реєстрації. Після повернення має відображатися користувач, список статей має бути доступний, а URL — без коду чи bearer token.
4. Вийдіть, повторіть Google login: нового користувача не повинно з'явитися. Перевірте відмову від consent, повернення назад і повторний запуск входу.
5. Зареєструйте тестовий email/password акаунт з тим самим email, що Google. Google login до explicit linking має відмовити. Увійдіть із паролем, підключіть Google через меню, вийдіть і перевірте обидва способи входу.
6. Перевірте logout і повторне звернення до захищеного API зі старим токеном: очікується 401. Google-only акаунт не повинен входити з довільним паролем. Перевірте в браузері, що `/auth/google/exchange` є POST з CSRF header, а token приходить тільки у JSON.
7. Після власного розгортання, ручного застосування міграції й налаштування Railway variables повторіть ці кроки на точному HTTPS production-домені з тестовим акаунтом. Google credentials і реальний consent flow тут не перевірялися, бо їх налаштовує власниця проєкту. Навантажувальні тести production не потрібні.

## Змінені файли й автоматичні перевірки

- [`GoogleAuthController.php`](../../project8-9/blog/app/Http/Controllers/GoogleAuthController.php), [`User.php`](../../project8-9/blog/app/Models/User.php), [`web.php`](../../project8-9/blog/routes/web.php), [`services.php`](../../project8-9/blog/config/services.php) — OAuth і конфігурація.
- [`міграція`](../../project8-9/blog/database/migrations/2026_11_11_000000_add_google_authentication.php), [`composer.json`](../../project8-9/blog/composer.json), [`composer.lock`](../../project8-9/blog/composer.lock) — схема та Socialite.
- [`google-auth.js`](../../project8-9/blog/resources/js/google-auth.js), [`auth.js`](../../project8-9/blog/resources/js/auth.js), [`ui.js`](../../project8-9/blog/resources/js/ui.js), [`auth-modals.blade.php`](../../project8-9/blog/resources/views/partials/modals/auth-modals.blade.php), [`app.blade.php`](../../project8-9/blog/resources/views/layouts/app.blade.php) — кнопки, форма linking і browser handoff.
- [`GoogleAuthTest.php`](../../project8-9/blog/tests/Feature/GoogleAuthTest.php), [`google-auth.test.js`](../../project8-9/blog/tests/Frontend/google-auth.test.js) — Google HTTP responses замокано, реальних запитів до Google немає.

Перевірено реєстрацію, повторний вхід за subject, незмінність локального email, колізії email, soft-deleted акаунти, explicit linking, чужу/вже зв'язану identity, відкликаний токен, state, скасування, збій провайдера, unverified email, CSRF, replay, expiry і session binding, існуючий password login, logout та захищений API. Frontend-тести перевіряють обмін коду, CSRF header, видалення fragment і помилку мережі. `php artisan test` — 29 тестів, 243 твердження; `npm test` — 20 тестів; `npm run build` — успішно. Перевірки синтаксису та Pint для нових PHP-файлів також успішні.
