# Kontrakt API – AskData

> **Status: propozycja frontendu, do uzgodnienia z backendem.**
> Każda zmiana tutaj → aktualizacja modeli w `src/app/core/models/` i mocków w `src/app/core/mocks/`.

Bazowy adres: `environment.apiUrl` (dev: `http://localhost:8080/api`, prod: `/api`).
Format: JSON, pola w `camelCase`, daty w ISO 8601, identyfikatory jako string.

---

## Sprawozdania

### `POST /reports`

Wgranie jednego lub wielu plików PDF. `multipart/form-data`, pole `files` (powtarzane).

Odpowiedź `201`: `Report[]` – nowo utworzone sprawozdania ze statusem `processing`.

### `GET /reports`

Lista sprawozdań. Opcjonalne query: `group`, `status`, `q` (wyszukiwanie po autorze/temacie).

Odpowiedź `200`: `Report[]`

```json
[
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
]
```

`status`: `"processing" | "ready" | "error"`. Pola `author`, `topic`, `group`, `pageCount` mogą być `null`, dopóki status nie jest `ready`. `error` – komunikat, gdy `status = "error"`.

### `GET /reports/{id}`

Szczegóły odczytanej treści.

Odpowiedź `200`: `ReportDetails` = `Report` +

```json
{
  "authors": [{ "name": "Jan Kowalski", "studentId": "123456" }],
  "date": "2026-11-10",
  "sections": [
    { "title": "Wstęp", "pageStart": 1, "pageEnd": 2, "content": "..." }
  ],
  "tables": [
    {
      "caption": "Tabela 1. Wyniki pomiarów",
      "page": 4,
      "headers": ["Lp.", "t [s]", "h [cm]"],
      "rows": [["1", "2.31", "10.0"]]
    }
  ],
  "conclusions": "...",
  "flags": {
    "hasResultsAnalysis": true,
    "hasConclusions": true
  }
}
```

### `GET /reports/{id}/file`

Oryginalny plik PDF (`application/pdf`). Frontend otwiera go w `<iframe>` z `#page=N`.

### `DELETE /reports/{id}`

Odpowiedź `204`.

---

## Czat

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
- `conversationId` – opcjonalne; brak = nowa rozmowa.

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

`sources` zawsze obecne (może być puste tylko, gdy model odpowiada, że nie znalazł informacji).

**Później:** `POST /chat/stream` – Server-Sent Events: zdarzenia `token` (`{ "text": "..." }`), na końcu `sources` i `done`.

---

## Podobieństwo

### `GET /reports/similar`

Opcjonalne query: `minScore` (0–1, domyślnie 0.8), `group`.

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

## Błędy

Każdy błąd `4xx/5xx`:

```json
{ "message": "Plik nie jest prawidłowym PDF", "code": "INVALID_PDF" }
```

Przykładowe kody: `INVALID_PDF`, `FILE_TOO_LARGE`, `NOT_FOUND`, `REPORT_NOT_READY`, `LLM_UNAVAILABLE`.

## Otwarte pytania do backendu

- Port dev (8080 czy 8000 dla FastAPI)?
- Maksymalny rozmiar pliku i liczba plików na jeden upload?
- Czy historia rozmów jest trzymana po stronie backendu?
- Kiedy streaming?
