/**
 * Builds a standard Laravel-compatible pagination structure
 */
function paginate({ data, total, page = 1, perPage = 15, baseUrl = '' }) {
  const currentPage = Math.max(1, parseInt(page, 10));
  const limit = Math.max(1, parseInt(perPage, 10));
  const lastPage = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? null : (currentPage - 1) * limit + 1;
  const to = total === 0 ? null : Math.min(currentPage * limit, total);

  return {
    current_page: currentPage,
    data,
    first_page_url: `${baseUrl}?page=1`,
    from,
    last_page: lastPage,
    last_page_url: `${baseUrl}?page=${lastPage}`,
    links: [
      {
        url: currentPage > 1 ? `${baseUrl}?page=${currentPage - 1}` : null,
        label: '&laquo; Previous',
        active: false,
      },
      ...Array.from({ length: lastPage }, (_, i) => ({
        url: `${baseUrl}?page=${i + 1}`,
        label: String(i + 1),
        active: i + 1 === currentPage,
      })),
      {
        url: currentPage < lastPage ? `${baseUrl}?page=${currentPage + 1}` : null,
        label: 'Next &raquo;',
        active: false,
      },
    ],
    next_page_url: currentPage < lastPage ? `${baseUrl}?page=${currentPage + 1}` : null,
    path: baseUrl,
    per_page: limit,
    prev_page_url: currentPage > 1 ? `${baseUrl}?page=${currentPage - 1}` : null,
    to,
    total,
  };
}

module.exports = {
  paginate,
};
