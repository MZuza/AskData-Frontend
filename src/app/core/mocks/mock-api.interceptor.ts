import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpInterceptorFn,
  HttpParams,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  EMPTY,
  Observable,
  concat,
  concatMap,
  defer,
  from,
  map,
  mergeMap,
  of,
  throwError,
  timer,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiError, ChatRequest, ReportFilters, ReportStatus, SimilarityQuery } from '../models';
import { MOCK_API_CONFIG } from './mock-api.config';
import { MockDb } from './mock-db';

interface MockResult {
  status: number;
  body: unknown;
}

/**
 * Udaje backend dla wszystkich żądań pod `environment.apiUrl` (kontrakt z `docs/API.md`).
 * Pozostałe żądania przepuszcza dalej. Włączany flagą `environment.useMocks`.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const db = inject(MockDb);
  const { latencyMs } = inject(MOCK_API_CONFIG);

  const response$ = defer(() => {
    const result = handle(req, db);
    return timer(latencyMs).pipe(
      mergeMap((): Observable<HttpEvent<unknown>> =>
        result.status >= 400
          ? throwError(
              () =>
                new HttpErrorResponse({
                  status: result.status,
                  statusText: 'Mock API error',
                  error: result.body,
                  url: req.url,
                }),
            )
          : of(new HttpResponse({ status: result.status, body: result.body, url: req.url })),
      ),
    );
  });

  return concat(uploadProgress(req, latencyMs), response$);
};

function handle(req: HttpRequest<unknown>, db: MockDb): MockResult {
  const path = req.url.slice(environment.apiUrl.length).split('?')[0];
  const [resource, id, sub, ...rest] = path.split('/').filter(Boolean).map(decodeURIComponent);

  if (resource === 'reports' && !rest.length) {
    if (id === undefined) {
      if (req.method === 'GET') return ok(db.list(reportFilters(req.params)));
      if (req.method === 'POST') return upload(req, db);
    } else if (id === 'groups' && sub === undefined) {
      if (req.method === 'GET') return ok(db.groups());
    } else if (id === 'similar' && sub === undefined) {
      if (req.method === 'GET') return ok(db.similar(similarityQuery(req.params)));
    } else if (sub === undefined) {
      if (req.method === 'GET') {
        const details = db.get(id);
        return details ? ok(details) : notFound('Nie znaleziono sprawozdania.');
      }
      if (req.method === 'DELETE') {
        return db.remove(id)
          ? { status: 204, body: null }
          : notFound('Nie znaleziono sprawozdania.');
      }
    } else if (sub === 'file' && req.method === 'GET') {
      const file = db.file(id);
      return file ? ok(file) : notFound('Brak pliku PDF dla tego sprawozdania.');
    }
  }

  if (resource === 'chat' && id === undefined && req.method === 'POST') {
    return ok(db.chat(req.body as ChatRequest));
  }

  return notFound(`Mock API nie obsługuje ${req.method} ${path}.`);
}

function upload(req: HttpRequest<unknown>, db: MockDb): MockResult {
  const files =
    req.body instanceof FormData
      ? req.body.getAll('files').filter((f): f is File => f instanceof File)
      : [];
  if (!files.length) {
    return error(400, 'no_files', 'Nie wybrano żadnych plików.');
  }
  const invalid = files.find((f) => !f.name.toLowerCase().endsWith('.pdf'));
  if (invalid) {
    return error(400, 'invalid_pdf', `Plik „${invalid.name}” nie jest plikiem PDF.`);
  }
  return { status: 201, body: db.add(files) };
}

/** Sztuczny postęp wgrywania (25/50/75/100%) dla `POST /reports` z `reportProgress`. */
function uploadProgress(
  req: HttpRequest<unknown>,
  latencyMs: number,
): Observable<HttpEvent<unknown>> {
  if (!req.reportProgress || req.method !== 'POST' || !/\/reports\/?$/.test(req.url)) {
    return EMPTY;
  }
  return from([25, 50, 75, 100]).pipe(
    concatMap((loaded) =>
      timer(latencyMs / 4).pipe(
        map((): HttpEvent<unknown> => ({ type: HttpEventType.UploadProgress, loaded, total: 100 })),
      ),
    ),
  );
}

function reportFilters(params: HttpParams): ReportFilters {
  return {
    group: params.get('group') ?? undefined,
    status: (params.get('status') as ReportStatus | null) ?? undefined,
    q: params.get('q') ?? undefined,
    page: num(params.get('page')),
    pageSize: num(params.get('pageSize')),
  };
}

function similarityQuery(params: HttpParams): SimilarityQuery {
  return { minScore: num(params.get('minScore')), group: params.get('group') ?? undefined };
}

function num(value: string | null): number | undefined {
  const n = value === null ? NaN : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function ok(body: unknown): MockResult {
  return { status: 200, body };
}

function notFound(message: string): MockResult {
  return error(404, 'not_found', message);
}

function error(status: number, code: string, message: string): MockResult {
  const body: ApiError = { errors: [{ code, message }] };
  return { status, body };
}
