# Plan pracy – AskData Frontend

Zasada: frontend nie czeka na backend. Wszystko budujemy najpierw na mockach (`environment.useMocks`) za tym samym interfejsem serwisów, a kontrakt API trzymamy w [API.md](API.md).

Kolejność: 0 → 1 → 1b → 2 → 3 → 4 → 5 → 6 → 7. Etapy 3–6 działają w pełni na mockach.

Legenda: `- [ ]` do zrobienia, `- [x]` zrobione.

---

## Etap 0 – Pliki projektu

- [x] `CLAUDE.md` – kontekst projektu i konwencje
- [x] `docs/PLAN.md` – ten plan
- [x] `docs/API.md` – proponowany kontrakt API
- [ ] Uzgodnić `docs/API.md` z osobą od backendu

## Etap 1 – Fundamenty: modele, serwisy, mocki ✅

- [x] `core/models/report.ts` – `Report`, `ReportStatus`, `ReportDetails`, `ReportSection`, `ReportTable`, `UploadProgress`
- [x] `core/models/chat.ts` – `ChatMessage`, `ChatRequest`, `ChatResponse`, `ChatContext`, `Source`
- [x] `core/models/similarity.ts` – `SimilarPair`
- [x] `core/models/paged-result.ts`, `api-error.ts` – zgodne z konwencjami backendu (.NET)
- [x] `core/services/reports.service.ts` – load (stronicowanie), get, upload z postępem, remove, fileUrl
- [x] `core/services/chat.service.ts` – wysyłanie pytania, historia i `conversationId` w signals
- [x] `core/services/similarity.service.ts`
- [x] `environment.useMocks` (dev: `true`, prod: `false`), `apiUrl` → backend .NET (`:5555/v1`)
- [x] `core/mocks/` – `MockDb` (w pamięci), `mockApiInterceptor`, dane przykładowe, `MOCK_API_CONFIG`
- [x] Testy serwisów (`HttpTestingController`) i interceptora
- [x] `npm test` i `npm run build` przechodzą

## Etap 1b – Logowanie (backend ma JWT, moduł Accounts)

- [ ] `core/models/auth.ts` – `JsonWebToken`, `Account`, `SignInRequest`
- [ ] `core/services/auth.service.ts` – sign-in, sign-out, `me`, token w `localStorage`, signal `currentUser`
- [ ] `core/auth/auth.interceptor.ts` – `Authorization: Bearer …`, wylogowanie przy `401`
- [ ] `authGuard` + strony `pages/sign-in` (i ewentualnie `register`)
- [ ] Mock `POST /accounts/sign-in` i `GET /accounts/me`
- [ ] Sprawdzić z backendem jednostkę `expiresAt` i body `register`

## Etap 2 – Layout i nawigacja ✅

- [x] Header: linki Sprawozdania / Czat / Podobieństwo (`routerLinkActive`, `aria-current`), znacznik „dane testowe” przy `useMocks`
- [x] Trasy: `''` → `reports`, `reports`, `reports/:id`, `chat`, `similar`, `**` → `NotFound` (lazy, tytuły kart)
- [x] Usunięty placeholder `Home`; strony-zaślepki do wypełnienia w etapach 3–6
- [x] Zmienne w `styles.scss`: kolory (z wersją ciemną przez `prefers-color-scheme`), spacing, radius, focus ring; klasy `.page-header`, `.back-link`, `.btn`, `.btn--primary`, `.visually-hidden`
- [x] `shared/`: `StatusBadge`, `Spinner`, `EmptyState` (input `heading`), `ErrorMessage` (`showRetry` + `retry`)
- [x] Testy: header, trasy (`RouterTestingHarness`), komponenty shared

## Etap 3 – Sprawozdania: upload i lista (`pages/reports`) ✅

- [x] `shared/FileDropzone` – drag & drop + wybór z dysku, tylko `.pdf`, wiele plików, limit 20 MB, lista odrzuconych
- [x] Pasek postępu uploadu – `withFetch()` usunięte z `app.config.ts` (tylko XHR raportuje postęp wysyłania)
- [x] Tabela (`reports-table`): plik (link do podglądu), autor, temat, grupa, status, data, akcje; komunikat błędu odczytu
- [x] Usuwanie z potwierdzeniem w wierszu („Usunąć? Tak / Nie”)
- [x] Polling w tle co 3 s, dopóki coś jest `processing` (bez migania spinnera); potem odświeżenie grup
- [x] Filtry: szukaj (debounce 300 ms), grupa, status – trzymane w adresie (`?q=&group=&status=&page=`)
- [x] Stronicowanie (20 na stronę), stany: ładowanie / błąd z „Spróbuj ponownie” / pusto / brak wyników
- [x] Nowy endpoint `GET /reports/groups` (API.md + mock), `load(…, { background })` w serwisie
- [x] Testy: strona sprawozdań, FileDropzone, `plural`

## Etap 4 – Podgląd sprawozdania (`pages/report-detail`)

- [ ] Metadane (autor, temat, grupa, data, liczba stron)
- [ ] Sekcje (rozwijane), tabele wyników jako `<table>`, wnioski
- [ ] Flagi braków (np. „brak sekcji analizy wyników”)
- [ ] Podgląd PDF: pobranie pliku jako blob (JWT!) → `URL.createObjectURL` → `<iframe>` + `#page=N`; mock zwraca wgrany plik
- [ ] (opcjonalnie) `ngx-extended-pdf-viewer`, jeśli natywny viewer nie wystarczy
- [ ] Obsługa `?page=N` przez `input()` – skok do strony ze źródła czatu

## Etap 5 – Czat (`pages/chat`)

- [ ] Lista wiadomości, pole tekstowe (Enter wysyła, Shift+Enter nowa linia), stan „myśli…”
- [ ] Wybór kontekstu: wszystkie / zaznaczone sprawozdania / grupa
- [ ] Odpowiedź jako markdown (z sanityzacją)
- [ ] Źródła jako chipy „plik.pdf, s. 4” → `reports/:id?page=4`, podgląd cytowanego fragmentu
- [ ] Przykładowe pytania na pustym ekranie
- [ ] Historia rozmowy w `sessionStorage`
- [ ] (później) Streaming odpowiedzi (SSE / `fetch` + `ReadableStream`)

## Etap 6 – Podobne sprawozdania (`pages/similar`)

- [ ] Lista par z wynikiem podobieństwa, sortowanie, próg
- [ ] Widok dwóch sprawozdań obok siebie

## Etap 7 – Dopracowanie i integracja

- [ ] Przełączenie na prawdziwy backend (`useMocks: false`)
- [ ] `proxy.conf.json` dla `/api` w dev (bez CORS)
- [ ] Globalna obsługa błędów HTTP (interceptor + toast)
- [ ] Responsywność i dostępność (focus, aria, kontrast)
- [ ] Stany puste / błędów na każdym widoku
- [ ] Testy kluczowych komponentów (upload, czat, źródła)
- [ ] Aktualizacja `README.md`

---

## Decyzje

- Własne komponenty + SCSS zamiast Angular Material.
- Podgląd PDF: natywny viewer przeglądarki w `<iframe>` na start.
- Stan w signals, bez NgRx.

## Weryfikacja

- Po każdym etapie: `npm test` zielony, `npm run build` bez błędów budżetu, ręczne przejście w `npm start`.
- Scenariusz końcowy: wgraj PDF → `processing` → `ready` → podgląd danych → pytanie w czacie → odpowiedź ze źródłem → klik w źródło otwiera PDF na właściwej stronie.
