export type PaginationQuery = {
  limit?: number;
  offset?: number;
};

export type PaginationMeta = {
  limit: number;
  offset: number;
};

export type PaginatedResult<T> = {
  items: T[];
  page: PaginationMeta;
};

export function normalizePage(query: PaginationQuery): PaginationMeta {
  const limit = Number.isFinite(query.limit) ? Number(query.limit) : 20;
  const offset = Number.isFinite(query.offset) ? Number(query.offset) : 0;

  return {
    limit: Math.min(Math.max(limit, 1), 100),
    offset: Math.max(offset, 0),
  };
}
