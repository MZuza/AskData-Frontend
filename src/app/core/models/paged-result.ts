/** Strona wyników – zgodna z `AskData.Shared.Abstractions.Queries.PagedResult<T>`. */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** Parametry stronicowania (query `page`, `pageSize`). */
export interface PageQuery {
  page?: number;
  pageSize?: number;
}
