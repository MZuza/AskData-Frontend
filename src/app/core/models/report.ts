import { PageQuery } from './paged-result';

/** Etap przetwarzania sprawozdania po stronie backendu. */
export type ReportStatus = 'processing' | 'ready' | 'error';

/** Sprawozdanie na liście (`GET /reports`). Pola opisowe są `null`, dopóki status ≠ `ready`. */
export interface Report {
  id: string;
  filename: string;
  status: ReportStatus;
  /** ISO 8601 */
  uploadedAt: string;
  author: string | null;
  topic: string | null;
  group: string | null;
  pageCount: number | null;
  /** Komunikat błędu, gdy `status === 'error'`. */
  error: string | null;
}

export interface ReportAuthor {
  name: string;
  studentId: string | null;
}

export interface ReportSection {
  title: string;
  pageStart: number;
  pageEnd: number;
  content: string;
}

export interface ReportTable {
  caption: string | null;
  page: number;
  headers: string[];
  rows: string[][];
}

export interface ReportFlags {
  hasResultsAnalysis: boolean;
  hasConclusions: boolean;
}

/** Pełna odczytana treść sprawozdania (`GET /reports/{id}`). */
export interface ReportDetails extends Report {
  authors: ReportAuthor[];
  /** Data z treści sprawozdania (YYYY-MM-DD), jeśli udało się ją odczytać. */
  date: string | null;
  sections: ReportSection[];
  tables: ReportTable[];
  conclusions: string | null;
  flags: ReportFlags;
}

/** Filtry i stronicowanie listy sprawozdań (query params `GET /reports`). */
export interface ReportFilters extends PageQuery {
  group?: string;
  status?: ReportStatus;
  /** Wyszukiwanie po autorze / temacie. */
  q?: string;
}

/** Postęp wgrywania plików emitowany przez `ReportsService.upload`. */
export type UploadProgress =
  { state: 'progress'; percent: number } | { state: 'done'; reports: Report[] };
