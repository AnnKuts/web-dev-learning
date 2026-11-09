export function renderPagination(container, meta, action, count = 0) {
    if (!container) return;

    const currentPage = Number(meta.current_page) || 1;
    const lastPage = Number(meta.last_page) || 1;
    const total = Number(meta.total ?? count);

    container.innerHTML = `
        <p class="pagination-info">Сторінка <strong>${currentPage}</strong> з ${lastPage} · Всього: ${total}</p>
        <div class="pagination-controls">
            <button type="button" data-action="${action}" data-page="${currentPage - 1}" class="pagination-button" ${currentPage <= 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-left text-xs" aria-hidden="true"></i>
                <span>Попередня</span>
            </button>
            <button type="button" data-action="${action}" data-page="${currentPage + 1}" class="pagination-button" ${currentPage >= lastPage ? 'disabled' : ''}>
                <span>Наступна</span>
                <i class="fa-solid fa-chevron-right text-xs" aria-hidden="true"></i>
            </button>
        </div>
    `;
}
