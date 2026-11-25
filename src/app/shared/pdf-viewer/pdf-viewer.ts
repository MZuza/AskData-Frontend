import { HttpErrorResponse } from '@angular/common/http';
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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, catchError, map, merge, of, switchMap } from 'rxjs';

import { errorMessage } from '../../core/models';
import { ReportsService } from '../../core/services/reports.service';
import { EmptyState } from '../empty-state/empty-state';
import { ErrorMessage } from '../error-message/error-message';
import { Spinner } from '../spinner/spinner';

type ViewerState =
  | { kind: 'loading' }
  | { kind: 'ready'; url: string }
  | { kind: 'missing' }
  | { kind: 'error'; message: string };

interface Frame {
  key: string;
  src: SafeResourceUrl;
}

/**
 * Podgląd oryginalnego PDF w natywnym viewerze przeglądarki.
 * Plik pobierany jest jako blob (z autoryzacją), a strona ustawiana przez `#page=N`.
 */
@Component({
  selector: 'app-pdf-viewer',
  imports: [EmptyState, ErrorMessage, Spinner],
  templateUrl: './pdf-viewer.html',
  styleUrl: './pdf-viewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfViewer {
  private readonly reports = inject(ReportsService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly reportId = input.required<string>();
  readonly page = input(1);
  /** Tytuł ramki dla czytników ekranu. */
  readonly label = input('Podgląd PDF');

  protected readonly state = signal<ViewerState>({ kind: 'loading' });

  /**
   * Ramka jako jednoelementowa lista – `@for` z `track key` tworzy nowy `<iframe>` przy zmianie
   * strony, bo natywne viewery PDF nie reagują na zmianę samego `#page` w istniejącej ramce.
   */
  protected readonly frames = computed<Frame[]>(() => {
    const state = this.state();
    if (state.kind !== 'ready') {
      return [];
    }
    const key = `${state.url}#page=${this.page()}`;
    return [{ key, src: this.sanitizer.bypassSecurityTrustResourceUrl(key) }];
  });

  protected readonly fileHref = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.url : null;
  });

  protected readonly errorText = computed(() => {
    const state = this.state();
    return state.kind === 'error' ? state.message : '';
  });

  private readonly reload$ = new Subject<void>();

  constructor() {
    merge(toObservable(this.reportId), this.reload$.pipe(map(() => this.reportId())))
      .pipe(
        switchMap((id) => {
          this.setState({ kind: 'loading' });
          return this.reports.getFile(id).pipe(
            map((blob): ViewerState => ({ kind: 'ready', url: URL.createObjectURL(blob) })),
            catchError((err: unknown) =>
              of<ViewerState>(
                err instanceof HttpErrorResponse && err.status === 404
                  ? { kind: 'missing' }
                  : { kind: 'error', message: errorMessage(err) },
              ),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.setState(state));

    inject(DestroyRef).onDestroy(() => this.setState({ kind: 'loading' }));
  }

  protected reload(): void {
    this.reload$.next();
  }

  /** Zmienia stan i zwalnia poprzedni URL bloba. */
  private setState(next: ViewerState): void {
    const previous = this.state();
    if (previous.kind === 'ready') {
      URL.revokeObjectURL(previous.url);
    }
    this.state.set(next);
  }
}
