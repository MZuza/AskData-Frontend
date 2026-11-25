import { HttpErrorResponse } from '@angular/common/http';

/** Treść każdej odpowiedzi błędu z backendu (`4xx/5xx`). */
export interface ApiError {
  message: string;
  code: string;
}

/** Wyciąga czytelny komunikat z błędu HTTP (z body `ApiError`, jeśli jest). */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as Partial<ApiError> | null;
    if (body && typeof body.message === 'string') {
      return body.message;
    }
    if (err.status === 0) {
      return 'Brak połączenia z serwerem.';
    }
    return `Błąd serwera (${err.status}).`;
  }
  return 'Wystąpił nieoczekiwany błąd.';
}
