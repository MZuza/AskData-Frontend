import { HttpParams } from '@angular/common/http';

/** Zamienia obiekt filtrów na `HttpParams`, pomijając puste wartości. */
export function toHttpParams(query: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
