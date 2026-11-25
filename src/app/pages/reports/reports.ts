import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  finalize,
  interval,
  map,
  merge,
  switchMap,
} from 'rxjs';

import { ReportFilters, ReportStatus, errorMessage } from '../../core/models';
import { ReportsService } from '../../core/services/reports.service';
import { plural } from '../../core/utils/plural';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { ErrorMessage } from '../../shared/error-message/error-message';
import { FileDropzone } from '../../shared/file-dropzone/file-dropzone';
import { Spinner } from '../../shared/spinner/spinner';
import { ReportsTable } from './reports-table/reports-table';

export const PAGE_SIZE = 20;
export const POLL_INTERVAL_MS = 3000;

const STATUSES: { value: ReportStatus; label: string }[] = [
  { value: 'ready', label: 'Gotowe' },
  { value: 'processing', label: 'Przetwarzane' },
  { value: 'error', label: 'Z błędem' },
];

type QueryKey = 'q' | 'group' | 'status' | 'page';

/** Wgrywanie i lista sprawozdań. Filtry i strona są w adresie (`?q=&group=&status=&page=`). */
@Component({
  selector: 'app-reports',
  imports: [EmptyState, ErrorMessage, FileDropzone, ReportsTable, Spinner],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly service = inject(ReportsService);

  // Query params (withComponentInputBinding).
  readonly q = input<string>();
  readonly group = input<string>();
  readonly status = input<string>();
  readonly page = input<string>();

  protected readonly statuses = STATUSES;

  protected readonly filters = computed<ReportFilters>(() => ({
    q: this.q() || undefined,
    group: this.group() || undefined,
    status: STATUSES.find((s) => s.value === this.status())?.value,
    page: this.currentPage(),
    pageSize: PAGE_SIZE,
  }));
  protected readonly hasFilters = computed(() => !!(this.q() || this.group() || this.status()));
  protected readonly currentPage = computed(() =>
    Math.max(1, Math.floor(Number(this.page())) || 1),
  );
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.service.totalCount() / PAGE_SIZE)),
  );
  protected readonly summary = computed(() => {
    const n = this.service.totalCount();
    return `${n} ${plural(n, 'sprawozdanie', 'sprawozdania', 'sprawozdań')}`;
  });

  /** Trwające wgrywanie: liczba plików i procent. */
  protected readonly upload = signal<{ count: number; percent: number } | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);

  private readonly reload$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  constructor() {
    // Lista: przy zmianie filtrów w adresie i po „Spróbuj ponownie”.
    merge(toObservable(this.filters), this.reload$.pipe(map(() => this.filters())))
      .pipe(
        switchMap((filters) => this.service.load(filters).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(),
      )
      .subscribe();

    // Dopóki coś się przetwarza – odświeżaj listę w tle. Potem odśwież grupy do filtra.
    toObservable(this.service.hasProcessing)
      .pipe(
        switchMap((processing) =>
          processing
            ? interval(POLL_INTERVAL_MS).pipe(
                exhaustMap(() =>
                  this.service
                    .load(this.filters(), { background: true })
                    .pipe(catchError(() => EMPTY)),
                ),
              )
            : this.service.loadGroups().pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();

    this.search$
      .pipe(
        debounceTime(300),
        map((value) => value.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((q) => this.setQuery({ q }));
  }

  protected plural = plural;

  protected onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  protected onSelect(key: 'group' | 'status', event: Event): void {
    this.setQuery({ [key]: (event.target as HTMLSelectElement).value });
  }

  protected goToPage(page: number): void {
    this.setQuery({ page });
  }

  protected clearFilters(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  protected reload(): void {
    this.reload$.next();
  }

  protected onFiles(files: File[]): void {
    const count = files.length;
    this.actionError.set(null);
    this.upload.set({ count, percent: 0 });

    this.service
      .upload(files)
      .pipe(
        finalize(() => this.upload.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (progress) => {
          if (progress.state === 'progress') {
            this.upload.set({ count, percent: progress.percent });
          }
        },
        error: (err: unknown) => this.actionError.set(errorMessage(err)),
      });
  }

  protected onRemove(id: string): void {
    this.actionError.set(null);
    this.deletingId.set(id);

    this.service
      .remove(id)
      .pipe(
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (err: unknown) =>
          this.actionError.set(`Nie udało się usunąć sprawozdania. ${errorMessage(err)}`),
      });
  }

  /** Zmienia parametry w adresie; każda zmiana filtra wraca na 1. stronę. */
  private setQuery(changes: Partial<Record<QueryKey, string | number>>): void {
    const queryParams: Params = { page: null };
    for (const [key, value] of Object.entries(changes)) {
      queryParams[key] = value === '' || value === 1 ? null : value;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
