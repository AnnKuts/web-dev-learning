export function setFieldError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);
    if (input) {
        input.classList.add('border-rose-500', 'bg-rose-50/30');
        input.classList.remove('border-slate-300');
    }
    if (errorEl) {
        errorEl.innerText = message;
        errorEl.classList.remove('hidden');
    }
}

export function clearFieldError(inputId, errorId) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);
    if (input) {
        input.classList.remove('border-rose-500', 'bg-rose-50/30');
        input.classList.add('border-slate-300');
    }
    if (errorEl) {
        errorEl.innerText = '';
        errorEl.classList.add('hidden');
    }
}

export function validatePostFields(header, description, prefix = 'post') {
    let isValid = true;
    const headerLength = Array.from(header).length;
    const descriptionLength = Array.from(description).length;
    const headerInputId = prefix === 'post' ? 'postHeader' : 'editPostHeader';
    const headerErrorId = prefix === 'post' ? 'postHeaderError' : 'editPostHeaderError';
    const descInputId = prefix === 'post' ? 'postDescription' : 'editPostDescription';
    const descErrorId = prefix === 'post' ? 'postDescriptionError' : 'editPostDescriptionError';

    if (!header || headerLength < 5) {
        setFieldError(headerInputId, headerErrorId, `Заголовок занадто короткий (потрібно від 5 до 100 символів, зараз: ${headerLength}).`);
        isValid = false;
    } else if (headerLength > 100) {
        setFieldError(headerInputId, headerErrorId, `Заголовок занадто довгий (максимум 100 символів, зараз: ${headerLength}).`);
        isValid = false;
    } else {
        clearFieldError(headerInputId, headerErrorId);
    }

    if (!description || descriptionLength < 20) {
        setFieldError(descInputId, descErrorId, `Контент занадто короткий (потрібно щонайменше 20 символів, зараз: ${descriptionLength}).`);
        isValid = false;
    } else {
        clearFieldError(descInputId, descErrorId);
    }

    return isValid;
}

export function updateCounters(prefix = 'post') {
    const isPost = prefix === 'post';
    const headerInputId = isPost ? 'postHeader' : 'editPostHeader';
    const descInputId = isPost ? 'postDescription' : 'editPostDescription';
    const headerCounterId = isPost ? 'headerCounter' : 'editHeaderCounter';
    const descCounterId = isPost ? 'descCounter' : 'editDescCounter';

    const headerLength = Array.from(document.getElementById(headerInputId)?.value || '').length;
    const descriptionLength = Array.from(document.getElementById(descInputId)?.value || '').length;
    const headerCounter = document.getElementById(headerCounterId);
    const descCounter = document.getElementById(descCounterId);

    if (headerCounter) {
        headerCounter.innerText = `${headerLength} / 100`;
        headerCounter.className = (headerLength > 0 && (headerLength < 5 || headerLength > 100))
            ? 'text-xs text-rose-500 font-medium'
            : 'text-xs text-slate-400';
    }

    if (descCounter) {
        descCounter.innerText = `${descriptionLength} символів (мін. 20)`;
        descCounter.className = (descriptionLength > 0 && descriptionLength < 20)
            ? 'text-xs text-rose-500 font-medium'
            : 'text-xs text-slate-400';
    }
}

export function clearPostErrors(prefix) {
    clearFieldError(`${prefix}Header`, `${prefix}HeaderError`);
    clearFieldError(`${prefix}Description`, `${prefix}DescriptionError`);
    clearFieldError(`${prefix}TagCheckboxes`, `${prefix}TagsError`);
}

export function showPostErrors(prefix, errors) {
    if (errors.header) setFieldError(`${prefix}Header`, `${prefix}HeaderError`, errors.header.join(' '));
    if (errors.description) setFieldError(`${prefix}Description`, `${prefix}DescriptionError`, errors.description.join(' '));
    const tagErrors = Object.entries(errors)
        .filter(([field]) => field === 'tags' || field.startsWith('tags.'))
        .flatMap(([, messages]) => messages);
    if (tagErrors.length) setFieldError(`${prefix}TagCheckboxes`, `${prefix}TagsError`, [...new Set(tagErrors)].join(' '));
}
