export const getPaginationParams = (query, defaults = {}) => {
  const defaultPage = defaults.page ?? 1;
  const defaultLimit = defaults.limit ?? 12;
  const maxLimit = defaults.maxLimit ?? 50;

  const page = Math.max(
    1,
    Number.parseInt(query.page ?? `${defaultPage}`, 10) || defaultPage,
  );
  const requestedLimit =
    Number.parseInt(query.limit ?? `${defaultLimit}`, 10) || defaultLimit;
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const buildPaginationMeta = ({ page, limit, totalItems }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};
