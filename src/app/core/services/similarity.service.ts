import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, defer, finalize, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SimilarPair, SimilarityQuery, errorMessage } from '../models';
import { toHttpParams } from './http-params';

/** Pary sprawozdań o podobnej treści. */
@Injectable({ providedIn: 'root' })
export class SimilarityService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reports/similar`;

  private readonly _pairs = signal<SimilarPair[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly pairs = this._pairs.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  load(query: SimilarityQuery = {}): Observable<SimilarPair[]> {
    return defer(() => {
      this._loading.set(true);
      this._error.set(null);
      return this.http.get<SimilarPair[]>(this.url, { params: toHttpParams(query) }).pipe(
        tap({
          next: (pairs) => this._pairs.set(pairs),
          error: (err: unknown) => this._error.set(errorMessage(err)),
        }),
        finalize(() => this._loading.set(false)),
      );
    });
  }
}
