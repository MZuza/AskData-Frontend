import { HttpErrorResponse } from '@angular/common/http';

/** Pojedynczy błąd z backendu (`AskData.Shared.Abstractions.Exceptions.Error`). */
export interface ApiErrorItem {
  code: string;
  message: string;
}

/** Treść każdej odpowiedzi błędu z backendu (`4xx/5xx`), zgodna z `ErrorResponse`. */
export interface ApiError {
  errors: ApiErrorItem[];
}

/** Wyciąga czytelny komunikat z błędu HTTP (z body `ApiError`, jeśli jest). */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const errors = (err.error as Partial<ApiError> | null)?.errors;
    const messages = Array.isArray(errors)
      ? errors.map((e) => e.message).filter((m) => typeof m === 'string' && m.length > 0)
      : [];
    if (messages.length) {
      return messages.join(' ');
    }
    if (err.status === 0) {
      return 'Brak połączenia z serwerem.';
    }
    return `Błąd serwera (${err.status}).`;
  }
  return 'Wystąpił nieoczekiwany błąd.';
}
