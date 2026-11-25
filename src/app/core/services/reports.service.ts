import { HttpClient, HttpEventType } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, defer, filter, finalize, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Report,
  ReportDetails,
  ReportFilters,
  UploadProgress,
  errorMessage,
} from '../models';
import { toHttpParams } from './http-params';

/** Sprawozdania: lista (stan w signals), szczegóły, upload, usuwanie. */
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reports`;

  private readonly _reports = signal<Report[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly reports = this._reports.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** Czy któreś sprawozdanie jest jeszcze przetwarzane (do pollingu statusu). */
  readonly hasProcessing = computed(() => this._reports().some((r) => r.status === 'processing'));

  /** Grupy laboratoryjne występujące na liście, posortowane. */
  readonly groups = computed(() =>
    [...new Set(this._reports().map((r) => r.group))]
      .filter((g): g is string => !!g)
      .sort((a, b) => a.localeCompare(b, 'pl')),
  );

  /** Pobiera listę sprawozdań i zapisuje ją w `reports`. */
  load(filters: ReportFilters = {}): Observable<Report[]> {
    return defer(() => {
      this._loading.set(true);
      this._error.set(null);
      return this.http.get<Report[]>(this.baseUrl, { params: toHttpParams(filters) }).pipe(
        tap({
          next: (reports) => this._reports.set(reports),
          error: (err: unknown) => this._error.set(errorMessage(err)),
        }),
        finalize(() => this._loading.set(false)),
      );
    });
  }

  /** Szczegóły odczytanej treści jednego sprawozdania. */
  get(id: string): Observable<ReportDetails> {
    return this.http.get<ReportDetails>(this.reportUrl(id));
  }

  /**
   * Wgrywa pliki PDF. Emituje postęp, a na końcu `done` z utworzonymi sprawozdaniami,
   * które trafiają też na początek listy `reports`.
   */
  upload(files: File[]): Observable<UploadProgress> {
    const body = new FormData();
    for (const file of files) {
      body.append('files', file, file.name);
    }
    return this.http
      .post<Report[]>(this.baseUrl, body, { observe: 'events', reportProgress: true })
      .pipe(
        map((event): UploadProgress | null => {
          if (event.type === HttpEventType.UploadProgress) {
            const percent = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
            return { state: 'progress', percent };
          }
          if (event.type === HttpEventType.Response) {
            return { state: 'done', reports: event.body ?? [] };
          }
          return null;
        }),
        filter((progress): progress is UploadProgress => progress !== null),
        tap((progress) => {
          if (progress.state === 'done') {
            this.upsert(progress.reports);
          }
        }),
      );
  }

  /** Usuwa sprawozdanie i zdejmuje je z listy. */
  remove(id: string): Observable<void> {
    return this.http
      .delete<void>(this.reportUrl(id))
      .pipe(tap(() => this._reports.update((list) => list.filter((r) => r.id !== id))));
  }

  /** Adres oryginalnego pliku PDF (do `<iframe>`). */
  fileUrl(id: string): string {
    return `${this.reportUrl(id)}/file`;
  }

  private reportUrl(id: string): string {
    return `${this.baseUrl}/${encodeURIComponent(id)}`;
  }

  /** Nowe sprawozdania na górę listy, istniejące (po `id`) podmienia w miejscu. */
  private upsert(incoming: Report[]): void {
    this._reports.update((list) => {
      const byId = new Map(incoming.map((r) => [r.id, r]));
      const updated = list.map((r) => byId.get(r.id) ?? r);
      const known = new Set(list.map((r) => r.id));
      const added = incoming.filter((r) => !known.has(r.id));
      return [...added, ...updated];
    });
  }
}
