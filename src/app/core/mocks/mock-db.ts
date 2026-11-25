import { Injectable, inject } from '@angular/core';

import {
  ChatRequest,
  ChatResponse,
  PagedResult,
  Report,
  ReportDetails,
  ReportFilters,
  ReportSection,
  SimilarPair,
  SimilarityQuery,
  Source,
} from '../models';
import { MOCK_API_CONFIG } from './mock-api.config';
import { seedReports, seedSimilarPairs } from './mock-data';
import { mockReportPdf } from './mock-pdf';

interface StoredReport {
  details: ReportDetails;
  /** Kiedy (ms, `Date.now()`) sprawozdanie ma przejść do `ready`. */
  readyAt: number;
  file: Blob | null;
}

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_MIN_SCORE = 0.8;

/** Stan fikcyjnego backendu w pamięci przeglądarki (znika po odświeżeniu strony). */
@Injectable({ providedIn: 'root' })
export class MockDb {
  private readonly config = inject(MOCK_API_CONFIG);
  private readonly reports = new Map<string, StoredReport>(
    seedReports().map((details) => [details.id, { details, readyAt: 0, file: null }]),
  );
  private readonly pairs = seedSimilarPairs();
  private nextReportId = 100;
  private nextConversationId = 1;

  list(filters: ReportFilters): PagedResult<Report> {
    this.advance();
    const q = filters.q?.trim().toLocaleLowerCase('pl');
    const matching = this.all()
      .filter(
        (d) =>
          (!filters.group || d.group === filters.group) &&
          (!filters.status || d.status === filters.status) &&
          (!q ||
            [d.author, d.topic, d.filename].some((v) => v?.toLocaleLowerCase('pl').includes(q))),
      )
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE);
    return {
      items: matching.slice((page - 1) * pageSize, page * pageSize).map(toReport),
      page,
      pageSize,
      totalCount: matching.length,
      totalPages: Math.ceil(matching.length / pageSize),
    };
  }

  groups(): string[] {
    this.advance();
    const groups = this.all()
      .map((d) => d.group)
      .filter((g): g is string => !!g);
    return [...new Set(groups)].sort((a, b) => a.localeCompare(b, 'pl'));
  }

  get(id: string): ReportDetails | null {
    this.advance();
    const stored = this.reports.get(id);
    return stored ? clone(stored.details) : null;
  }

  /** Wgrany plik albo – dla danych przykładowych – wygenerowany PDF z treścią sprawozdania. */
  file(id: string): Blob | null {
    const stored = this.reports.get(id);
    if (!stored) {
      return null;
    }
    if (stored.file) {
      return stored.file;
    }
    return stored.details.status === 'ready' ? mockReportPdf(stored.details) : null;
  }

  add(files: File[]): Report[] {
    const now = Date.now();
    return files.map((file) => {
      const id = `r_${this.nextReportId++}`;
      const details: ReportDetails = {
        id,
        filename: file.name,
        status: 'processing',
        uploadedAt: new Date(now).toISOString(),
        author: null,
        topic: null,
        group: null,
        pageCount: null,
        error: null,
        authors: [],
        date: null,
        sections: [],
        tables: [],
        conclusions: null,
        flags: { hasResultsAnalysis: false, hasConclusions: false },
      };
      this.reports.set(id, { details, readyAt: now + this.config.processingMs, file });
      return toReport(details);
    });
  }

  remove(id: string): boolean {
    return this.reports.delete(id);
  }

  similar(query: SimilarityQuery): SimilarPair[] {
    const minScore = query.minScore ?? DEFAULT_MIN_SCORE;
    return this.pairs
      .filter((pair) => pair.score >= minScore)
      .filter((pair) => {
        const a = this.reports.get(pair.a.id)?.details;
        const b = this.reports.get(pair.b.id)?.details;
        return !!a && !!b && (!query.group || (a.group === query.group && b.group === query.group));
      })
      .sort((x, y) => y.score - x.score)
      .map(clone);
  }

  /** Bardzo uproszczona „odpowiedź modelu” – wystarczy do budowy UI czatu. */
  chat(request: ChatRequest): ChatResponse {
    this.advance();
    const conversationId = request.conversationId ?? `c_${this.nextConversationId++}`;
    const question = request.question.toLocaleLowerCase('pl');

    let scope = this.all().filter(
      (d) =>
        d.status === 'ready' &&
        (!request.reportIds?.length || request.reportIds.includes(d.id)) &&
        (!request.group || d.group === request.group),
    );
    const named = scope.filter((d) => mentionsAuthor(question, d));
    if (named.length) {
      scope = named;
    }

    if (!scope.length) {
      return {
        conversationId,
        answer: 'Nie znalazłem gotowych sprawozdań w wybranym zakresie.',
        sources: [],
      };
    }

    const { answer, sources } = question.includes('analiz')
      ? answerMissingAnalysis(scope)
      : answerFromSections(scope, question.includes('wnios'));

    return {
      conversationId,
      answer: `${answer}\n\n_Odpowiedź testowa z mock API._`,
      sources,
    };
  }

  /** Przełącza sprawozdania, którym minął czas „przetwarzania”, na `ready`. */
  private advance(): void {
    const now = Date.now();
    for (const stored of this.reports.values()) {
      if (stored.details.status === 'processing' && stored.readyAt <= now) {
        stored.details = processed(stored.details);
      }
    }
  }

  private all(): ReportDetails[] {
    return [...this.reports.values()].map((stored) => stored.details);
  }
}

function answerMissingAnalysis(scope: ReportDetails[]): { answer: string; sources: Source[] } {
  const missing = scope.filter((d) => !d.flags.hasResultsAnalysis);
  if (!missing.length) {
    return { answer: 'Wszystkie wybrane sprawozdania mają sekcję z analizą wyników.', sources: [] };
  }
  return {
    answer:
      'Sekcji z analizą wyników nie znalazłem w:\n\n' +
      missing.map((d) => `- **${d.filename}** (${d.author ?? 'autor nieznany'})`).join('\n'),
    sources: missing.map((d) => ({
      reportId: d.id,
      filename: d.filename,
      page: 1,
      fragment: `Sekcje: ${d.sections.map((s) => s.title).join(', ')}`,
    })),
  };
}

function answerFromSections(
  scope: ReportDetails[],
  wantsConclusions: boolean,
): { answer: string; sources: Source[] } {
  const lines: string[] = [];
  const sources: Source[] = [];
  for (const d of scope.slice(0, 3)) {
    const section: ReportSection | undefined = wantsConclusions
      ? d.sections.find((s) => /wnios/i.test(s.title))
      : d.sections[0];
    const who = d.author ?? d.filename;
    if (!section) {
      lines.push(`**${who}** – w sprawozdaniu nie znalazłem sekcji z wnioskami.`);
      continue;
    }
    lines.push(`**${who}** – ${section.content}`);
    sources.push({
      reportId: d.id,
      filename: d.filename,
      page: section.pageStart,
      fragment: section.content,
    });
  }
  return { answer: lines.join('\n\n'), sources };
}

/** Czy pytanie wspomina imię lub nazwisko autora (także odmienione, np. „Kowalskiego”). */
function mentionsAuthor(question: string, report: ReportDetails): boolean {
  return report.authors.some((author) =>
    author.name
      .toLocaleLowerCase('pl')
      .split(/\s+/)
      .some((part) => part.length > 2 && question.includes(part)),
  );
}

/** Wypełnia wgrane sprawozdanie przykładową „odczytaną” treścią. */
function processed(d: ReportDetails): ReportDetails {
  const name = d.filename.replace(/\.pdf$/i, '').split(/[_\-\s]+/)[0] || 'Student';
  const sections: ReportSection[] = [
    { title: 'Wstęp', pageStart: 1, pageEnd: 1, content: 'Opis celu ćwiczenia i podstaw teorii.' },
    {
      title: 'Wyniki i analiza',
      pageStart: 2,
      pageEnd: 2,
      content: 'Wyniki pomiarów zestawiono w tabeli i porównano z wartościami tablicowymi.',
    },
    {
      title: 'Wnioski',
      pageStart: 3,
      pageEnd: 3,
      content: 'Otrzymane wyniki są zgodne z oczekiwaniami w granicach niepewności pomiarowej.',
    },
  ];
  return {
    ...d,
    status: 'ready',
    author: name,
    topic: 'Sprawozdanie wgrane w trybie testowym',
    group: 'L1',
    pageCount: 3,
    authors: [{ name, studentId: null }],
    sections,
    tables: [
      {
        caption: 'Tabela 1. Wyniki pomiarów',
        page: 2,
        headers: ['Lp.', 'Wartość'],
        rows: [
          ['1', '1,00'],
          ['2', '1,02'],
        ],
      },
    ],
    conclusions: sections[2].content,
    flags: { hasResultsAnalysis: true, hasConclusions: true },
  };
}

function toReport(d: ReportDetails): Report {
  const { id, filename, status, uploadedAt, author, topic, group, pageCount, error } = d;
  return { id, filename, status, uploadedAt, author, topic, group, pageCount, error };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
