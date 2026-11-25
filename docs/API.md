# Kontrakt API – AskData

> **Status:** konwencje (adres, `/v1`, błędy, stronicowanie, logowanie) są wzięte z istniejącego backendu.
> Endpointy sprawozdań, czatu i podobieństwa to **propozycja frontendu, do uzgodnienia z backendem**.
> Każda zmiana tutaj → aktualizacja modeli w `src/app/core/models/` i mocków w `src/app/core/mocks/`.

Backend: **.NET**, repo `AskData-Backend` (modularny monolit, Postgres w Dockerze na porcie `5435`).

Bazowy adres: `environment.apiUrl`

- dev: `http://localhost:5555/v1` (profil `http` z `launchSettings.json`, Swagger: `http://localhost:5555/swagger`)
- prod: `/v1`

Format: JSON, pola w `camelCase`, daty w ISO 8601. CORS w backendzie: dowolne origin.

---

## Konwencje backendu (już istnieją)

### Błędy

Każda odpowiedź `4xx/5xx` (`ErrorResponse`):

```json
{ "errors": [{ "code": "invalid_credentials", "message": "Nieprawidłowy e-mail lub hasło." }] }
```

Frontend: `ApiError` + `errorMessage()` w `core/models/api-error.ts`.

### Stronicowanie

Listy zwracają `PagedResult<T>`, query `page` (od 1) i `pageSize`:

```json
{ "items": [], "page": 1, "pageSize": 20, "totalCount": 0, "totalPages": 0 }
```

### Logowanie (moduł Accounts, `v1/accounts`)

| Metoda | Ścieżka                      | Opis                                               |
| ------ | ---------------------------- | -------------------------------------------------- |
| `POST` | `/accounts/sign-in`          | `{ email, password }` → `JsonWebToken` (anonimowy) |
| `POST` | `/accounts/register`         | rejestracja                                        |
| `POST` | `/accounts/reset-password`   | reset hasła                                        |
| `GET`  | `/accounts/me`               | `{ id, email, userName, roles[], createdAt }`      |
| `PUT`  | `/accounts/change-user-name` | `{ userName }`                                     |
| `GET`  | `/accounts`                  | `PagedResult<{ id, email, userName, createdAt }>`  |

`JsonWebToken`:

```json
{ "accessToken": "eyJ…", "expiresAt": 1764072000, "userId": "…", "email": "…", "roles": ["…"] }
```

Pozostałe endpointy wymagają nagłówka `Authorization: Bearer <accessToken>`.

> Do sprawdzenia w backendzie: jednostka `expiresAt` (sekundy czy ms) oraz dokładne body `register`.

Health: `GET /health/live`, `GET /health/ready`.

---

## Sprawozdania (propozycja)

### `POST /reports`

Wgranie jednego lub wielu plików PDF. `multipart/form-data`, pole `files` (powtarzane).

Odpowiedź `201`: `Report[]` – nowo utworzone sprawozdania ze statusem `processing`.

### `GET /reports`

Query: `group`, `status`, `q` (wyszukiwanie po autorze/temacie/nazwie pliku), `page`, `pageSize`.

Odpowiedź `200`: `PagedResult<Report>`, gdzie `Report`:

```json
{
  "id": "r_01",
  "filename": "Kowalski_lab3.pdf",
  "status": "ready",
  "uploadedAt": "2026-11-25T10:15:00Z",
  "author": "Jan Kowalski",
  "topic": "Wyznaczanie współczynnika lepkości",
  "group": "L3",
  "pageCount": 8,
  "error": null
}
```

`status`: `"processing" | "ready" | "error"`. Pola `author`, `topic`, `group`, `pageCount` mogą być `null`, dopóki status nie jest `ready`. `error` – komunikat, gdy `status = "error"`.

### `GET /reports/groups`

Lista wszystkich grup laboratoryjnych (do filtra listy), posortowana.

Odpowiedź `200`: `string[]`, np. `["L3", "L4"]`

### `GET /reports/{id}`

Szczegóły odczytanej treści.

Odpowiedź `200`: `ReportDetails` = `Report` +

```json
{
  "authors": [{ "name": "Jan Kowalski", "studentId": "123456" }],
  "date": "2026-11-10",
  "sections": [{ "title": "Wstęp", "pageStart": 1, "pageEnd": 2, "content": "..." }],
  "tables": [
    {
      "caption": "Tabela 1. Wyniki pomiarów",
      "page": 4,
      "headers": ["Lp.", "t [s]", "h [cm]"],
      "rows": [["1", "2.31", "10.0"]]
    }
  ],
  "conclusions": "...",
  "flags": { "hasResultsAnalysis": true, "hasConclusions": true }
}
```

### `GET /reports/{id}/file`

Oryginalny plik PDF (`application/pdf`). Frontend wyświetla go w `<iframe>` z `#page=N`.

Frontend pobiera plik przez `HttpClient` jako blob (więc z nagłówkiem `Authorization`) i pokazuje go przez `URL.createObjectURL` w `<iframe>` – backend nie musi robić podpisanych linków. Wystarczy, że endpoint zwraca bajty PDF; `Content-Type` frontend i tak ustawia na `application/pdf`. Brak pliku → `404`.

### `DELETE /reports/{id}`

Odpowiedź `204`.

---

## Czat (propozycja)

### `POST /chat`

```json
{
  "question": "Jakie wnioski przedstawił Jan Kowalski?",
  "reportIds": ["r_01"],
  "group": null,
  "conversationId": "c_abc"
}
```

- `reportIds` – opcjonalne; brak = wszystkie sprawozdania.
- `group` – opcjonalne; zawęża do grupy laboratoryjnej.
- `conversationId` – opcjonalne; `null` = nowa rozmowa.

Odpowiedź `200`:

```json
{
  "conversationId": "c_abc",
  "answer": "Student stwierdził, że ... (markdown)",
  "sources": [
    {
      "reportId": "r_01",
      "filename": "Kowalski_lab3.pdf",
      "page": 7,
      "fragment": "Na podstawie pomiarów stwierdzono, że ..."
    }
  ]
}
```

`sources` zawsze obecne (puste tylko, gdy model nie znalazł informacji).

**Później:** `POST /chat/stream` – Server-Sent Events: zdarzenia `token` (`{ "text": "..." }`), na końcu `sources` i `done`.

---

## Podobieństwo (propozycja)

### `GET /reports/similar`

Query: `minScore` (0–1, domyślnie 0.8), `group`.

Odpowiedź `200`:

```json
[
  {
    "a": { "id": "r_01", "filename": "Kowalski_lab3.pdf", "author": "Jan Kowalski" },
    "b": { "id": "r_07", "filename": "Nowak_lab3.pdf", "author": "Anna Nowak" },
    "score": 0.93
  }
]
```

---

## Proponowane kody błędów

`snake_case`, jak w backendzie (`invalid_credentials`): `not_found`, `no_files`, `invalid_pdf`, `file_too_large`, `report_not_ready`, `llm_unavailable`.

## Otwarte pytania do backendu

- Typ `id` sprawozdania – `Guid` jak w Accounts? (frontend traktuje go jako string, więc zadziała)
- Maksymalny rozmiar pliku i liczba plików na jeden upload? (frontend na razie blokuje pliki > 20 MB)
- Czy historia rozmów jest trzymana po stronie backendu?
- Kiedy streaming odpowiedzi czatu?
