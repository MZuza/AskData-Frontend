# AskData – Frontend

## O projekcie

AskData to narzędzie dla prowadzących zajęcia: wgrywają sprawozdania studenckie w PDF, aplikacja odczytuje ich treść (autor, temat, grupa, sekcje, tabele z wynikami, wnioski), a prowadzący rozmawia z nimi w języku naturalnym (RAG) – pyta o treść, porównuje sprawozdania, szuka podobnych. **Każda odpowiedź ma źródło: sprawozdanie + strona.**

To repo to **tylko frontend** (Angular). Backend jest rozwijany osobno przez drugą osobę z zespołu w repo `../AskData-Backend`: **.NET**, API na `http://localhost:5555/v1` (Swagger: `/swagger`), logowanie JWT, Postgres w Dockerze (`docker compose up -d`, port 5435). Frontend pracuje na mockach (`environment.useMocks`), dopóki backend nie udostępni endpointów.

- Plan pracy i postęp: [docs/PLAN.md](docs/PLAN.md)
- Kontrakt API frontend ↔ backend: [docs/API.md](docs/API.md)

## Stack

Angular 21 (standalone components, signals), TypeScript 5.9, SCSS, Vitest (`@angular/build:unit-test`), Prettier (`printWidth: 100`, single quotes).

## Komendy

```bash
npm start        # dev server, http://localhost:4200
npm test         # testy (Vitest)
npm run build    # build produkcyjny (sprawdza budżety: initial 500 kB, styl komponentu 4 kB)
```

## Struktura

```
src/app/
├── core/
│   ├── models/     # typy danych (Report, ChatMessage, Source…) – zgodne z docs/API.md
│   ├── services/   # komunikacja z API, stan w signals
│   ├── mocks/      # interceptor z fikcyjnym API (environment.useMocks)
│   └── testing/    # wspólne dane do testów
├── shared/         # komponenty wielokrotnego użytku (StatusBadge, FileDropzone…)
├── layout/         # header i szkielet strony
├── pages/          # widoki podpięte pod routing (lazy loadComponent)
├── app.config.ts
└── app.routes.ts
```

## Konwencje

- Komponenty standalone, bez NgModule. Nazwy klas bez sufiksu `Component` (np. `Header`, `Home`), pliki `nazwa.ts/.html/.scss/.spec.ts`.
- Serwisy: `nazwa.service.ts` / `NazwaService`, stan w prywatnych signals wystawianych przez `asReadonly()`, metody zwracają leniwe `Observable` (`defer`).
- Format błędów i list jak w backendzie: `ApiError` (`{ errors: [{ code, message }] }`, kody `snake_case`) i `PagedResult<T>`.
- Mocki: nowy endpoint → obsługa w `core/mocks/mock-api.interceptor.ts` + dane w `MockDb`.
- `inject()` zamiast wstrzykiwania przez konstruktor.
- Stan: signals (`signal`, `computed`, `input()`, `output()`); bez NgRx.
- Szablony: nowy control flow (`@if`, `@for`, `@switch`).
- Każda strona to lazy route w `app.routes.ts` (`loadComponent`). Parametry trasy i query (np. `?page=4`) trafiają do `input()` dzięki `withComponentInputBinding()`.
- Adres API zawsze z `environments/environment` (`environment.apiUrl`); nigdy nie wpisywać adresów na sztywno.
- Style: zmienne CSS z `src/styles.scss`, styl komponentu < 4 kB.
- Teksty UI po polsku.
- Testy Vitest obok plików; serwisy testowane przez `HttpTestingController`.
- Formatowanie: Prettier.

## Zasady pracy

- Przed rozpoczęciem pracy sprawdź w [docs/PLAN.md](docs/PLAN.md), na jakim etapie jest projekt.
- Po skończeniu zadania odhacz je w `docs/PLAN.md` (`- [x]`).
- Zmiana kształtu danych lub endpointu → najpierw aktualizacja `docs/API.md`, potem modele w `core/models/` i mocki.
- Przed uznaniem etapu za skończony: `npm test` i `npm run build` bez błędów.
