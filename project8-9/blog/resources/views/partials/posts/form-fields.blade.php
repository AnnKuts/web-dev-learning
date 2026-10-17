@php
    $isPost = ($prefix ?? 'post') === 'post';
    $headerId = $isPost ? 'postHeader' : 'editPostHeader';
    $headerCounterId = $isPost ? 'headerCounter' : 'editHeaderCounter';
    $headerErrorId = $isPost ? 'postHeaderError' : 'editPostHeaderError';

    $descId = $isPost ? 'postDescription' : 'editPostDescription';
    $descCounterId = $isPost ? 'descCounter' : 'editDescCounter';
    $descErrorId = $isPost ? 'postDescriptionError' : 'editPostDescriptionError';

    $tagsContainerId = $isPost ? 'postTagCheckboxes' : 'editPostTagCheckboxes';
    $tagsErrorId = $isPost ? 'postTagsError' : null;
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
    @if($tagsErrorId)
        <p id="{{ $tagsErrorId }}" class="text-xs text-rose-600 font-medium mt-1 hidden"></p>
    @endif
</div>
