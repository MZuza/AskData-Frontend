import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, expand, map, merge, switchMap, tap, timer } from 'rxjs';

import { ReportDetails, errorMessage } from '../../core/models';
import { REPORT_POLL_INTERVAL_MS, ReportsService } from '../../core/services/reports.service';
import { ErrorMessage } from '../../shared/error-message/error-message';
import { PdfViewer } from '../../shared/pdf-viewer/pdf-viewer';
import { Spinner } from '../../shared/spinner/spinner';
import { StatusBadge } from '../../shared/status-badge/status-badge';

/**
 * Odczytana treść sprawozdania obok oryginalnego PDF.
 * `?page=N` w adresie otwiera PDF na danej stronie (linki „s. N” przy sekcjach i tabelach).
 */
@Component({
  selector: 'app-report-detail',
  imports: [DatePipe, ErrorMessage, PdfViewer, RouterLink, Spinner, StatusBadge],
  templateUrl: './report-detail.html',
  styleUrl: './report-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDetail {
  private readonly reports = inject(ReportsService);

  /** Parametr trasy `reports/:id`. */
  readonly id = input.required<string>();
  /** Query param `?page=N`. */
  readonly page = input<string>();

  protected readonly report = signal<ReportDetails | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly currentPage = computed(() => {
    const page = Math.floor(Number(this.page())) || 1;
    const max = this.report()?.pageCount ?? Number.POSITIVE_INFINITY;
    return Math.min(Math.max(1, page), max);
  });

  protected readonly warnings = computed(() => {
    const report = this.report();
    if (report?.status !== 'ready') {
      return [];
    }
    const warnings: string[] = [];
    if (!report.flags.hasResultsAnalysis) {
      warnings.push('Brak sekcji z analizą wyników');
    }
    if (!report.flags.hasConclusions) {
      warnings.push('Brak wniosków');
    }
    return warnings;
  });

  private readonly reload$ = new Subject<void>();

  constructor() {
    // Wczytaj sprawozdanie; dopóki jest przetwarzane – odpytuj co kilka sekund.
    merge(toObservable(this.id), this.reload$.pipe(map(() => this.id())))
      .pipe(
        switchMap((id) => {
          this.error.set(null);
          if (this.report()?.id !== id) {
            this.report.set(null);
          }
          return this.reports.get(id).pipe(
            expand((report) =>
              report.status === 'processing'
                ? timer(REPORT_POLL_INTERVAL_MS).pipe(switchMap(() => this.reports.get(id)))
                : EMPTY,
            ),
            tap((report) => this.report.set(report)),
            catchError((err: unknown) => {
              this.error.set(errorMessage(err));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected reload(): void {
    this.reload$.next();
  }

  protected pageRange(start: number, end: number): string {
    return start === end ? `s. ${start}` : `s. ${start}–${end}`;
  }
}
