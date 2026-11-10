# Коментарі та зображення в Блозі UA

## Що реалізовано

- Під статтею авторизовані користувачі можуть додавати коментарі, редагувати й видаляти власні. Коментарі впорядковані за датою та ID, по 20 на сторінку. Після публікації новий коментар з'являється без перезавантаження сторінки. Текст вставляється у сторінку з HTML-екрануванням.
- Користувач може завантажити, замінити або видалити власний аватар у меню профілю. За відсутності фото показується ініціал або стандартний значок. Аватар відображається в шапці, біля авторів статей і коментарів. Облікові записи Google користуються тією самою функцією.
- До статті можна додати до п'яти зображень під час створення або редагування, переглянути їх перед відправленням, позначити наявні для видалення та відкрити зображення з галереї у більшому розмірі. Статті без зображень працюють як раніше.

Інтерфейс: [коментарі](../../project8-9/blog/resources/js/comments.js), [аватари](../../project8-9/blog/resources/js/avatar.js), [форма статті](../../project8-9/blog/resources/js/post-form.js), [сторінка статті](../../project8-9/blog/resources/views/posts/show.blade.php). Використовуються чинні Blade, Tailwind і Sanctum, без нового фронтенд-фреймворку.

## Дані та доступ

[Міграція коментарів](../../project8-9/blog/database/migrations/2026_11_12_000000_create_comments_table.php) додає `comments` з `post_id`, `user_id`, текстом і датами. [Міграція медіа](../../project8-9/blog/database/migrations/2026_11_12_000001_add_media_tables.php) додає необов'язкове `users.avatar_path` і таблицю `post_images` із `post_id`, ключем об'єкта та порядком показу. Обидві міграції доповнюють схему: наявні користувачі й статті не змінюються.

[Comment](../../project8-9/blog/app/Models/Comment.php) належить [Post](../../project8-9/blog/app/Models/Post.php) і [User](../../project8-9/blog/app/Models/User.php); [PostImage](../../project8-9/blog/app/Models/PostImage.php) належить статті. Коментарі завантажуються разом з авторами; зображення завантажуються для деталей статті. Видалення користувача зберігає коментар із позначкою «Видалений користувач». Після м'якого видалення стаття та її коментарі недоступні через звичайні маршрути. Фізичне видалення статті видаляє пов'язані рядки через зовнішні ключі.

[CommentPolicy](../../project8-9/blog/app/Policies/CommentPolicy.php) дозволяє редагувати й видаляти лише власні коментарі. Операції з аватаром доступні лише через `/api/me/avatar`, а зміна зображень статті перевіряє чинну [PostPolicy](../../project8-9/blog/app/Policies/PostPolicy.php). Усі маршрути захищені `auth:sanctum`; створення коментарів та завантаження аватарів обмежено до 10 запитів за хвилину.

## API

Маршрути визначено в [routes/api.php](../../project8-9/blog/routes/api.php). Усі наведені маршрути вимагають Sanctum-токен.

| Метод і шлях | Дія |
| --- | --- |
| `GET /api/posts/{post}/comments?page=N` | Коментарі, 20 на сторінку |
| `POST /api/posts/{post}/comments` | Додати коментар |
| `PUT /api/posts/{post}/comments/{comment}` | Оновити власний коментар |
| `DELETE /api/posts/{post}/comments/{comment}` | Видалити власний коментар |
| `POST /api/me/avatar` | Завантажити або замінити аватар |
| `DELETE /api/me/avatar` | Видалити власний аватар |
| `POST /api/posts` | Необов'язковий масив файлів `images[]` |
| `PUT /api/posts/{post}` | Необов'язкові `images[]` та `remove_images[]` |

Форма надсилає файл через `multipart/form-data`; для оновлення з файлами використовується `POST` з `_method=PUT`. Звичайні JSON-запити до статей залишилися чинними. Список статей зберігає попередню структуру; деталі статті додатково повертають `images`. Ресурси: [CommentResource](../../project8-9/blog/app/Http/Resources/CommentResource.php), [PostResource](../../project8-9/blog/app/Http/Resources/PostResource.php), [UserResource](../../project8-9/blog/app/Http/Resources/UserResource.php).

Коментар: від 1 до 2000 символів. Аватар: JPEG, PNG або WebP до 2 МБ. Зображення статті: ті самі формати, до 5 МБ кожне та максимум 5 на статтю. Laravel перевіряє вміст файлу, а [ImageService](../../project8-9/blog/app/Services/ImageService.php) повторно визначає тип із байтів, обмежує кількість пікселів, зменшує довгу сторону до 512 або 1600 пікселів та зберігає WebP з випадковим іменем. Бінарні дані не записуються в PostgreSQL. [PostMediaService](../../project8-9/blog/app/Services/PostMediaService.php) відкочує запис статті та видаляє нові файли в разі помилки; старі файли видаляються після успішного запису змін.

## Зберігання локально та на Railway

Окремий диск `images` налаштовано в [config/filesystems.php](../../project8-9/blog/config/filesystems.php). Локально він використовує `storage/app/images` і тимчасові підписані посилання Laravel. Для S3 встановлено [Flysystem AWS S3](../../project8-9/blog/composer.json); для обробки зображень потрібне розширення PHP `gd`, також зазначене в Composer. У production потрібно вказати `IMAGE_DISK_DRIVER=s3`; файли тоді зберігатимуться в Railway Storage Bucket і переживатимуть повторні розгортання. Секрети залишаються на сервері. Зображення віддаються через підписані URL на одну годину, тож публічний доступ до bucket не потрібен. Той, хто отримав таке посилання, може відкрити файл до закінчення строку його дії.

[Документація Railway](https://docs.railway.com/storage-buckets) підтверджує, що bucket приватний, підтримує S3 API та підписані URL. У проекті Railway створіть Storage Bucket у потрібному середовищі. У вкладці Credentials перевірте назву bucket, endpoint, регіон і формат URL. Для нових bucket зазвичай використовується virtual-hosted URL; для старих може знадобитися path-style.

У змінних **сервісу застосунку** вручну задайте посилання на змінні bucket (назву сервісу bucket підставте свою):

```text
IMAGE_DISK_DRIVER=s3
IMAGE_BUCKET=${{Bucket.BUCKET}}
IMAGE_ACCESS_KEY_ID=${{Bucket.ACCESS_KEY_ID}}
IMAGE_SECRET_ACCESS_KEY=${{Bucket.SECRET_ACCESS_KEY}}
IMAGE_REGION=${{Bucket.REGION}}
IMAGE_ENDPOINT=${{Bucket.ENDPOINT}}
IMAGE_PATH_STYLE=false
```

`IMAGE_PATH_STYLE=true` потрібне лише тоді, коли саме ваш bucket вимагає path-style. `RAILWAY_BUCKET_NAME` не є назвою для S3 API — використовуйте `BUCKET`. Не записуйте значення ключів у Git, HTML, JavaScript, скриншоти чи URL. Не змінюйте `DB_*`, `APP_KEY`, `FILESYSTEM_DISK` або Google OAuth-змінні для цієї функції.

Для локального запуску S3-змінні не потрібні. Залиште `IMAGE_DISK_DRIVER` невказаною або задайте `local`, встановіть залежності (`composer install`, `npm install`) і запустіть застосунок. Підписані локальні URL потребують робочого `APP_URL`, що відповідає адресі застосунку. Перевірте додавання й видалення аватара та зображень статті, а також відкриття галереї.

## Міграції, перевірка й обмеження

Автоматичного запуску міграцій на production і розгортання в межах цієї роботи немає. Перед власноручним розгортанням налаштуйте bucket та зробіть резервну копію бази. Після схвалення окремо застосуйте **лише звичайні нові міграції** (`php artisan migrate --force`) у належному середовищі. Не використовуйте `migrate:fresh`, `migrate:refresh` або `db:wipe`. Спочатку перевірте функції в окремому середовищі, а потім завантажте тестове зображення, перевірте його URL і повторіть перевірку після нового розгортання. Налаштування bucket для production не перевірялися без ваших облікових даних.

Автоматичні тести використовують ізольовану SQLite-базу й `Storage::fake('images')`: [CommentTest](../../project8-9/blog/tests/Feature/CommentTest.php), [AvatarTest](../../project8-9/blog/tests/Feature/AvatarTest.php), [PostImageTest](../../project8-9/blog/tests/Feature/PostImageTest.php), а також наявні тести авторизації, OAuth, статей і тегів. Команди: `php artisan test`, `npm test`, `npm run build` та `vendor/bin/pint --test` для змінених PHP-файлів.

Обмеження: немає вкладених коментарів, реакцій, вкладень до коментарів і зображень із Google. Підписані URL діють одну годину; сторінку, залишену відкритою довше, треба оновити для нового URL. Фізичне видалення записів поза звичайним API не очищає об'єкти bucket автоматично. Неуспішне видалення старого файлу після запису змін може залишити зайвий об'єкт; така помилка журналюється.
