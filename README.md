# AskData – Frontend

Frontend aplikacji AskData, zbudowany w [Angular](https://angular.dev) 21 (standalone components, signals, Vitest).

## Wymagania

- Node.js 22 (`^22.12.0`) lub 24+ – wersja zapisana w `.nvmrc`, więc wystarczy `nvm use`
- npm 11+ (starszy npm 10 potrafi wywalić się przy instalacji błędem `edgesOut`; aktualizacja: `npm install -g npm@11`)

## Pierwsze uruchomienie

```bash
npm install
npm start
```

Aplikacja działa pod adresem http://localhost:4200 i przeładowuje się po każdej zmianie w kodzie.

## Skrypty

| Komenda          | Opis                                             |
| ---------------- | ------------------------------------------------ |
| `npm start`      | serwer deweloperski (`ng serve`)                 |
| `npm run build`  | build produkcyjny do `dist/AskData-Frontend`     |
| `npm test`       | testy jednostkowe (Vitest)                       |
| `npm run watch`  | build deweloperski w trybie watch                |

## Struktura projektu

```
src/
├── app/
│   ├── core/          # serwisy i modele używane w całej aplikacji (np. komunikacja z API)
│   ├── shared/        # komponenty, pipe'y i dyrektywy wielokrotnego użytku
│   ├── layout/        # elementy szkieletu strony (header itp.)
│   ├── pages/         # widoki podpinane pod routing
│   ├── app.config.ts  # konfiguracja aplikacji (router, HttpClient)
│   └── app.routes.ts  # definicja ścieżek
├── environments/      # konfiguracja środowisk (adres API)
└── styles.scss        # style globalne i zmienne CSS
```

## Środowiska

Adres backendu ustawiasz w plikach `src/environments/`:

- `environment.development.ts` – używany przez `npm start` (domyślnie `http://localhost:8080/api`)
- `environment.ts` – używany w buildzie produkcyjnym (domyślnie `/api`)

W kodzie importuj zawsze `environments/environment` – Angular sam podmienia plik w trybie deweloperskim.

## Generowanie nowych elementów

```bash
npx ng generate component pages/nazwa-strony
npx ng generate service core/services/nazwa
```
