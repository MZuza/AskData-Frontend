import { PagedResult, Report, ReportStatus } from '../models';

/** Minimalne sprawozdanie do testów. */
export function report(id: string, status: ReportStatus = 'ready', group = 'L1'): Report {
  return {
    id,
    filename: `${id}.pdf`,
    status,
    uploadedAt: '2026-11-25T10:00:00Z',
    author: status === 'ready' ? `Autor ${id}` : null,
    topic: status === 'ready' ? `Temat ${id}` : null,
    group: status === 'ready' ? group : null,
    pageCount: status === 'ready' ? 5 : null,
    error: null,
  };
}

export function paged<T>(items: T[], page = 1, pageSize = 20): PagedResult<T> {
  return {
    items,
    page,
    pageSize,
    totalCount: items.length,
    totalPages: Math.ceil(items.length / pageSize),
  };
}
