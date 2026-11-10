@php
    $isPost = ($prefix ?? 'post') === 'post';
    $headerId = $isPost ? 'postHeader' : 'editPostHeader';
    $headerCounterId = $isPost ? 'headerCounter' : 'editHeaderCounter';
    $headerErrorId = $isPost ? 'postHeaderError' : 'editPostHeaderError';

    $descId = $isPost ? 'postDescription' : 'editPostDescription';
    $descCounterId = $isPost ? 'descCounter' : 'editDescCounter';
    $descErrorId = $isPost ? 'postDescriptionError' : 'editPostDescriptionError';

    $tagsContainerId = $isPost ? 'postTagCheckboxes' : 'editPostTagCheckboxes';
    $tagsErrorId = $isPost ? 'postTagsError' : 'editPostTagsError';
@endphp

<div>
    <div class="flex justify-between items-center mb-1">
        <label for="{{ $headerId }}" class="block text-sm font-medium text-slate-700">
            Заголовок (title) <span class="text-rose-500">*</span>
        </label>
        <span id="{{ $headerCounterId }}" class="text-xs text-slate-400">0 / 100</span>
    </div>
    <input type="text" id="{{ $headerId }}" name="header" required minlength="5" maxlength="100"
        class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition"
        placeholder="{{ $isPost ? 'Введіть заголовок статті (5–100 символів)...' : '' }}">
    <p id="{{ $headerErrorId }}" class="text-xs text-rose-600 font-medium mt-1 hidden"></p>
</div>

<div>
    <div class="flex justify-between items-center mb-1">
        <label for="{{ $descId }}" class="block text-sm font-medium text-slate-700">
            Контент статті (content) <span class="text-rose-500">*</span>
        </label>
        <span id="{{ $descCounterId }}" class="text-xs text-slate-400">0 символів (мін. 20)</span>
    </div>
    <textarea id="{{ $descId }}" name="description" rows="5" required minlength="20"
        class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition"
        placeholder="{{ $isPost ? 'Текст статті (не менше 20 символів)...' : '' }}"></textarea>
    <p id="{{ $descErrorId }}" class="text-xs text-rose-600 font-medium mt-1 hidden"></p>
</div>

<div>
    <label class="block text-sm font-medium text-slate-700 mb-1">Теги (tags)</label>
    <div id="{{ $tagsContainerId }}" class="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50"></div>
    <p id="{{ $tagsErrorId }}" class="text-xs text-rose-600 font-medium mt-1 hidden"></p>
</div>
<div>
    <div class="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <label for="{{ $prefix }}Images" class="block text-sm font-medium text-slate-700">
            Зображення
        </label>
        <div class="flex items-center gap-2">
            <span id="{{ $prefix }}ImageCount" class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                0 / 5 зображень
            </span>
            <button type="button" id="{{ $prefix }}ClearImagesBtn"
                class="hidden text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 rounded cursor-pointer transition">
                Видалити всі
            </button>
        </div>
    </div>

    <div id="{{ $prefix }}ImageDropzone"
        class="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-4 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30">
        <input type="file" id="{{ $prefix }}Images" accept="image/jpeg,image/png,image/webp" multiple class="sr-only">
        <div class="flex flex-col items-center justify-center gap-2">
            <button type="button" id="{{ $prefix }}SelectImagesBtn"
                class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-2xs ring-1 ring-slate-200 hover:bg-indigo-50 hover:ring-indigo-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition cursor-pointer">
                <i class="fa-solid fa-images text-indigo-500" aria-hidden="true"></i>
                <span>Обрати фотографії</span>
            </button>
            <p class="text-xs text-slate-500">
                Перетягніть файли сюди або натисніть кнопку вище &bull; До 5 зображень (JPEG, PNG, WebP, до 5 МБ кожне)
            </p>
        </div>
    </div>

    <p id="{{ $prefix }}ImagesError" role="alert" class="hidden text-xs text-rose-600 font-medium mt-1.5"></p>

    <div id="{{ $prefix }}ImagePreview" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-live="polite"></div>
    @unless($isPost)
        <div id="editPostExistingImages" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"></div>
    @endunless
</div>
<p id="{{ $prefix }}FormError" role="alert" class="hidden rounded-lg bg-rose-50 p-3 text-sm text-rose-600"></p>
