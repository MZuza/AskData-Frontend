# Plan pracy – AskData Frontend

Zasada: frontend nie czeka na backend. Wszystko budujemy najpierw na mockach (`environment.useMocks`) za tym samym interfejsem serwisów, a kontrakt API trzymamy w [API.md](API.md).

Kolejność: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Etapy 3–6 działają w pełni na mockach.

Legenda: `- [ ]` do zrobienia, `- [x]` zrobione.

---

## Etap 0 – Pliki projektu

- [x] `CLAUDE.md` – kontekst projektu i konwencje
- [x] `docs/PLAN.md` – ten plan
- [x] `docs/API.md` – proponowany kontrakt API
- [ ] Uzgodnić `docs/API.md` z osobą od backendu

## Etap 1 – Fundamenty: modele, serwisy, mocki

- [ ] `core/models/report.ts` – `Report`, `ReportStatus`, `ReportDetails`, `ReportSection`, `ReportTable`
- [ ] `core/models/chat.ts` – `ChatMessage`, `ChatRequest`, `ChatResponse`, `Source`
- [ ] `core/models/similarity.ts` – `SimilarPair`
- [ ] `core/services/reports.service.ts` – upload, list, get, delete, URL pliku PDF
- [ ] `core/services/chat.service.ts` – wysyłanie pytania, historia w signals
- [ ] `core/services/similarity.service.ts`
- [ ] `environment.useMocks` (dev: `true`, prod: `false`)
- [ ] `core/mocks/mock-api.interceptor.ts` + fikcyjne dane (opóźnienia, przejście `processing → ready`)
- [ ] Testy serwisów (`HttpTestingController`)

## Etap 2 – Layout i nawigacja

- [ ] Header: linki Sprawozdania / Czat / Podobieństwo (`routerLinkActive`)
- [ ] Trasy: `''` → `reports`, `reports`, `reports/:id`, `chat`, `similar` (lazy)
- [ ] Usunąć lub zamienić placeholder `Home`
- [ ] Zmienne w `styles.scss`: spacing, radius, kolory statusów (opcjonalnie dark mode)
- [ ] `shared/`: `StatusBadge`, `Spinner`, `EmptyState`, `ErrorMessage`

## Etap 3 – Sprawozdania: upload i lista (`pages/reports`)

- [ ] `shared/FileDropzone` – drag & drop, tylko `.pdf`, wiele plików, limit rozmiaru
- [ ] Pasek postępu uploadu (`reportProgress`)
- [ ] Tabela: plik, autor, temat, grupa, status, data, akcje
- [ ] Usuwanie z potwierdzeniem
- [ ] Polling statusu dla `processing` (co ~3 s, stop gdy wszystko gotowe)
- [ ] Filtrowanie / wyszukiwanie (autor, grupa, temat)

## Etap 4 – Podgląd sprawozdania (`pages/report-detail`)

- [ ] Metadane (autor, temat, grupa, data, liczba stron)
- [ ] Sekcje (rozwijane), tabele wyników jako `<table>`, wnioski
- [ ] Flagi braków (np. „brak sekcji analizy wyników”)
- [ ] Podgląd PDF: `<iframe>` + `#page=N` (później ewentualnie `ngx-extended-pdf-viewer`)
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
