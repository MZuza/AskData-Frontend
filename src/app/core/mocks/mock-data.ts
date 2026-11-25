import { ReportDetails, SimilarPair } from '../models';

/** Fikcyjne sprawozdania – dane osobowe są zmyślone. */
export function seedReports(): ReportDetails[] {
  return [
    {
      id: 'r_01',
      filename: 'Kowalski_lab3.pdf',
      status: 'ready',
      uploadedAt: '2026-11-20T09:12:00Z',
      author: 'Jan Kowalski',
      topic: 'Wyznaczanie współczynnika lepkości metodą Stokesa',
      group: 'L3',
      pageCount: 8,
      error: null,
      authors: [{ name: 'Jan Kowalski', studentId: '100001' }],
      date: '2026-11-10',
      sections: [
        {
          title: 'Wstęp teoretyczny',
          pageStart: 1,
          pageEnd: 2,
          content:
            'Kulka opadająca w cieczy lepkiej osiąga prędkość graniczną, gdy siła ciężkości równoważy siłę wyporu i siłę oporu Stokesa.',
        },
        {
          title: 'Przebieg pomiarów',
          pageStart: 3,
          pageEnd: 3,
          content:
            'Zmierzono czas opadania pięciu kulek stalowych na odcinku 10 cm w cylindrze z gliceryną.',
        },
        {
          title: 'Analiza wyników',
          pageStart: 4,
          pageEnd: 6,
          content:
            'Średni współczynnik lepkości wyniósł 1,41 Pa·s przy niepewności 0,05 Pa·s. Wynik jest zgodny z wartością tablicową w granicach niepewności.',
        },
        {
          title: 'Wnioski',
          pageStart: 7,
          pageEnd: 8,
          content:
            'Metoda Stokesa pozwala wyznaczyć lepkość gliceryny z niepewnością ok. 4%. Największy wpływ na wynik ma pomiar czasu opadania.',
        },
      ],
      tables: [
        {
          caption: 'Tabela 1. Czasy opadania kulek',
          page: 4,
          headers: ['Lp.', 'd [mm]', 't [s]'],
          rows: [
            ['1', '2,00', '3,41'],
            ['2', '2,00', '3,38'],
            ['3', '3,00', '1,52'],
          ],
        },
      ],
      conclusions:
        'Metoda Stokesa pozwala wyznaczyć lepkość gliceryny z niepewnością ok. 4%. Największy wpływ na wynik ma pomiar czasu opadania.',
      flags: { hasResultsAnalysis: true, hasConclusions: true },
    },
    {
      id: 'r_02',
      filename: 'Nowak_lab3.pdf',
      status: 'ready',
      uploadedAt: '2026-11-20T09:15:00Z',
      author: 'Anna Nowak',
      topic: 'Wyznaczanie współczynnika lepkości metodą Stokesa',
      group: 'L3',
      pageCount: 7,
      error: null,
      authors: [{ name: 'Anna Nowak', studentId: '100002' }],
      date: '2026-11-10',
      sections: [
        {
          title: 'Cel ćwiczenia',
          pageStart: 1,
          pageEnd: 1,
          content: 'Celem ćwiczenia było wyznaczenie lepkości gliceryny metodą opadającej kulki.',
        },
        {
          title: 'Wyniki i analiza',
          pageStart: 3,
          pageEnd: 5,
          content:
            'Otrzymano lepkość 1,38 Pa·s ± 0,06 Pa·s. Rozbieżność z wartością tablicową wynika z temperatury cieczy.',
        },
        {
          title: 'Wnioski',
          pageStart: 6,
          pageEnd: 7,
          content:
            'Wynik jest zgodny z wartością tablicową. Należy kontrolować temperaturę gliceryny, bo lepkość silnie od niej zależy.',
        },
      ],
      tables: [
        {
          caption: 'Tabela 1. Wyniki pomiarów',
          page: 3,
          headers: ['Lp.', 'd [mm]', 't [s]', 'η [Pa·s]'],
          rows: [
            ['1', '2,00', '3,35', '1,37'],
            ['2', '3,00', '1,50', '1,39'],
          ],
        },
      ],
      conclusions:
        'Wynik jest zgodny z wartością tablicową. Należy kontrolować temperaturę gliceryny, bo lepkość silnie od niej zależy.',
      flags: { hasResultsAnalysis: true, hasConclusions: true },
    },
    {
      id: 'r_03',
      filename: 'Wisniewski_lab3.pdf',
      status: 'ready',
      uploadedAt: '2026-11-21T14:02:00Z',
      author: 'Piotr Wiśniewski',
      topic: 'Wahadło matematyczne – wyznaczanie przyspieszenia ziemskiego',
      group: 'L4',
      pageCount: 5,
      error: null,
      authors: [{ name: 'Piotr Wiśniewski', studentId: '100003' }],
      date: '2026-11-12',
      sections: [
        {
          title: 'Wstęp',
          pageStart: 1,
          pageEnd: 1,
          content:
            'Okres drgań wahadła matematycznego zależy od jego długości i przyspieszenia ziemskiego.',
        },
        {
          title: 'Pomiary',
          pageStart: 2,
          pageEnd: 4,
          content: 'Zmierzono czas 20 okresów dla pięciu długości nici od 40 cm do 120 cm.',
        },
        {
          title: 'Wnioski',
          pageStart: 5,
          pageEnd: 5,
          content: 'Otrzymane g = 9,75 m/s² jest bliskie wartości oczekiwanej.',
        },
      ],
      tables: [
        {
          caption: null,
          page: 3,
          headers: ['l [cm]', '20T [s]'],
          rows: [
            ['40', '25,4'],
            ['80', '35,9'],
            ['120', '43,9'],
          ],
        },
      ],
      conclusions: 'Otrzymane g = 9,75 m/s² jest bliskie wartości oczekiwanej.',
      flags: { hasResultsAnalysis: false, hasConclusions: true },
    },
    {
      id: 'r_04',
      filename: 'Zielinska_lab4.pdf',
      status: 'ready',
      uploadedAt: '2026-11-22T11:40:00Z',
      author: 'Maria Zielińska',
      topic: 'Wahadło matematyczne – wyznaczanie przyspieszenia ziemskiego',
      group: 'L4',
      pageCount: 6,
      error: null,
      authors: [
        { name: 'Maria Zielińska', studentId: '100004' },
        { name: 'Tomasz Lewandowski', studentId: '100005' },
      ],
      date: '2026-11-12',
      sections: [
        {
          title: 'Wstęp teoretyczny',
          pageStart: 1,
          pageEnd: 2,
          content: 'Dla małych wychyleń okres wahadła T = 2π√(l/g) nie zależy od amplitudy.',
        },
        {
          title: 'Opracowanie wyników',
          pageStart: 3,
          pageEnd: 5,
          content:
            'Z regresji liniowej T²(l) otrzymano g = 9,81 ± 0,04 m/s². Współczynnik determinacji R² = 0,998.',
        },
      ],
      tables: [
        {
          caption: 'Tabela 2. Okresy drgań',
          page: 3,
          headers: ['l [m]', 'T [s]', 'T² [s²]'],
          rows: [
            ['0,40', '1,27', '1,61'],
            ['0,80', '1,79', '3,20'],
          ],
        },
      ],
      conclusions: null,
      flags: { hasResultsAnalysis: true, hasConclusions: false },
    },
    {
      id: 'r_05',
      filename: 'skan_lab2.pdf',
      status: 'error',
      uploadedAt: '2026-11-23T08:05:00Z',
      author: null,
      topic: null,
      group: null,
      pageCount: null,
      error: 'Nie udało się odczytać tekstu – plik jest skanem bez warstwy tekstowej.',
      authors: [],
      date: null,
      sections: [],
      tables: [],
      conclusions: null,
      flags: { hasResultsAnalysis: false, hasConclusions: false },
    },
  ];
}

/** Pary podobnych sprawozdań (odwołują się do `seedReports`). */
export function seedSimilarPairs(): SimilarPair[] {
  return [
    {
      a: { id: 'r_01', filename: 'Kowalski_lab3.pdf', author: 'Jan Kowalski' },
      b: { id: 'r_02', filename: 'Nowak_lab3.pdf', author: 'Anna Nowak' },
      score: 0.93,
    },
    {
      a: { id: 'r_03', filename: 'Wisniewski_lab3.pdf', author: 'Piotr Wiśniewski' },
      b: { id: 'r_04', filename: 'Zielinska_lab4.pdf', author: 'Maria Zielińska' },
      score: 0.84,
    },
  ];
}
