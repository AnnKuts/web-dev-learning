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
    const headerInputId = prefix === 'post' ? 'postHeader' : 'editPostHeader';
    const headerErrorId = prefix === 'post' ? 'postHeaderError' : 'editPostHeaderError';
    const descInputId = prefix === 'post' ? 'postDescription' : 'editPostDescription';
    const descErrorId = prefix === 'post' ? 'postDescriptionError' : 'editPostDescriptionError';

    if (!header || header.length < 5) {
        setFieldError(headerInputId, headerErrorId, `Заголовок занадто короткий (потрібно від 5 до 100 символів, зараз: ${header.length}).`);
        isValid = false;
    } else if (header.length > 100) {
        setFieldError(headerInputId, headerErrorId, `Заголовок занадто довгий (максимум 100 символів, зараз: ${header.length}).`);
        isValid = false;
    } else {
        clearFieldError(headerInputId, headerErrorId);
    }

    if (!description || description.length < 20) {
        setFieldError(descInputId, descErrorId, `Контент занадто короткий (потрібно щонайменше 20 символів, зараз: ${description.length}).`);
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

    const headerVal = document.getElementById(headerInputId)?.value || '';
    const descVal = document.getElementById(descInputId)?.value || '';
    const headerCounter = document.getElementById(headerCounterId);
    const descCounter = document.getElementById(descCounterId);

    if (headerCounter) {
        headerCounter.innerText = `${headerVal.length} / 100`;
        headerCounter.className = (headerVal.length > 0 && (headerVal.length < 5 || headerVal.length > 100))
            ? 'text-xs text-rose-500 font-medium'
            : 'text-xs text-slate-400';
    }

    if (descCounter) {
        descCounter.innerText = `${descVal.length} символів (мін. 20)`;
        descCounter.className = (descVal.length > 0 && descVal.length < 20)
            ? 'text-xs text-rose-500 font-medium'
            : 'text-xs text-slate-400';
    }
}
