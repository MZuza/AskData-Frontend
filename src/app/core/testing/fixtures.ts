import { PagedResult, Report, ReportDetails, ReportStatus } from '../models';

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

/** Szczegóły gotowego sprawozdania do testów. */
export function details(id: string, overrides: Partial<ReportDetails> = {}): ReportDetails {
  return {
    ...report(id),
    topic: 'Wahadło matematyczne',
    pageCount: 6,
    authors: [{ name: 'Jan Kowalski', studentId: '100001' }],
    date: '2026-11-10',
    sections: [
      { title: 'Wstęp', pageStart: 1, pageEnd: 1, content: 'Cel ćwiczenia.' },
      { title: 'Wnioski', pageStart: 5, pageEnd: 6, content: 'Wynik zgodny z teorią.' },
    ],
    tables: [
      { caption: 'Tabela 1', page: 3, headers: ['l [m]', 'T [s]'], rows: [['0,4', '1,27']] },
    ],
    conclusions: 'Wynik zgodny z teorią.',
    flags: { hasResultsAnalysis: true, hasConclusions: true },
    ...overrides,
  };
}
