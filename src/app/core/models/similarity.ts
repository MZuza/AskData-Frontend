/** Skrócona informacja o sprawozdaniu w parze podobnych. */
export interface ReportRef {
  id: string;
  filename: string;
  author: string | null;
}

/** Para sprawozdań o podobnej treści (`GET /reports/similar`). */
export interface SimilarPair {
  a: ReportRef;
  b: ReportRef;
  /** 0–1 */
  score: number;
}

export interface SimilarityQuery {
  /** 0–1, domyślnie po stronie backendu 0.8. */
  minScore?: number;
  group?: string;
}
