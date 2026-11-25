import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../environments/environment';
import { REPORT_POLL_INTERVAL_MS } from '../../core/services/reports.service';
import { details } from '../../core/testing/fixtures';
import { ReportDetail } from './report-detail';

describe('ReportDetail', () => {
  const base = `${environment.apiUrl}/reports`;
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(
          [{ path: 'reports/:id', component: ReportDetail }],
          withComponentInputBinding(),
        ),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    // jsdom nie implementuje URL.createObjectURL.
    URL.createObjectURL = vi.fn(() => 'blob:mock-pdf');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  async function open(url: string): Promise<void> {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
  }

  async function stable(): Promise<void> {
    await harness.fixture.whenStable();
  }

  function el(): HTMLElement {
    return harness.routeNativeElement!;
  }

  function flushFile(id: string): void {
    http.expectOne(`${base}/${id}/file`).flush(new Blob(['%PDF-1.4']));
  }

  function iframeSrc(): string | undefined {
    return el().querySelector('iframe')?.getAttribute('src') ?? undefined;
  }

  it('pokazuje odczytane dane i PDF na pierwszej stronie', async () => {
    await open('/reports/r1');
    http.expectOne(`${base}/r1`).flush(details('r1'));
    await stable();
    flushFile('r1');
    await stable();

    const text = el().textContent!;
    expect(el().querySelector('h1')?.textContent).toBe('Wahadło matematyczne');
    expect(text).toContain('Jan Kowalski');
    expect(text).toContain('(100001)');
    expect(text).toContain('Tabela 1');
    expect(text).toContain('Wynik zgodny z teorią.');
    expect(el().querySelectorAll('details')).toHaveLength(2);
    expect(el().querySelector('.warnings')).toBeNull();
    expect(iframeSrc()).toBe('blob:mock-pdf#page=1');
  });

  it('link „s. N” przy sekcji otwiera PDF na tej stronie bez ponownego pobierania pliku', async () => {
    await open('/reports/r1');
    http.expectOne(`${base}/r1`).flush(details('r1'));
    await stable();
    flushFile('r1');
    await stable();

    const link = [...el().querySelectorAll<HTMLAnchorElement>('.page-link')].find(
      (a) => a.textContent?.trim() === 's. 5–6',
    )!;
    link.click();
    await stable();

    expect(TestBed.inject(Router).url).toBe('/reports/r1?page=5');
    expect(iframeSrc()).toBe('blob:mock-pdf#page=5');
    expect(link.classList).toContain('active');
  });

  it('ogranicza ?page do liczby stron', async () => {
    await open('/reports/r1?page=99');
    http.expectOne(`${base}/r1`).flush(details('r1'));
    await stable();
    flushFile('r1');
    await stable();

    expect(iframeSrc()).toBe('blob:mock-pdf#page=6');
  });

  it('pokazuje braki w sprawozdaniu', async () => {
    await open('/reports/r1');
    http.expectOne(`${base}/r1`).flush(
      details('r1', {
        conclusions: null,
        flags: { hasResultsAnalysis: false, hasConclusions: false },
      }),
    );
    await stable();
    flushFile('r1');
    await stable();

    const warnings = el().querySelector('.warnings')?.textContent;
    expect(warnings).toContain('Brak sekcji z analizą wyników');
    expect(warnings).toContain('Brak wniosków');
  });

  it('odpytuje ponownie, dopóki sprawozdanie jest przetwarzane', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    await open('/reports/r1');
    http.expectOne(`${base}/r1`).flush(details('r1', { status: 'processing', sections: [] }));
    await stable();
    flushFile('r1');
    expect(el().textContent).toContain('jeszcze przetwarzane');

    vi.advanceTimersByTime(REPORT_POLL_INTERVAL_MS);
    http.expectOne(`${base}/r1`).flush(details('r1'));
    await stable();

    expect(el().textContent).toContain('Wynik zgodny z teorią.');
    vi.advanceTimersByTime(REPORT_POLL_INTERVAL_MS * 2);
    http.expectNone(`${base}/r1`);
  });

  it('pokazuje błąd 404 z możliwością ponowienia', async () => {
    await open('/reports/brak');
    http
      .expectOne(`${base}/brak`)
      .flush(
        { errors: [{ code: 'not_found', message: 'Nie znaleziono sprawozdania.' }] },
        { status: 404, statusText: 'Not Found' },
      );
    await stable();
    expect(el().textContent).toContain('Nie znaleziono sprawozdania.');

    el().querySelector<HTMLButtonElement>('app-error-message button')!.click();
    http.expectOne(`${base}/brak`).flush(details('brak'));
    await stable();
    flushFile('brak');
    expect(el().querySelector('h1')?.textContent).toBe('Wahadło matematyczne');
  });

  it('pokazuje stan „Brak pliku PDF”, gdy pliku nie ma', async () => {
    await open('/reports/r1');
    http.expectOne(`${base}/r1`).flush(details('r1'));
    await stable();
    http.expectOne(`${base}/r1/file`).flush(new Blob([]), { status: 404, statusText: 'Not Found' });
    await stable();

    expect(el().textContent).toContain('Brak pliku PDF');
    expect(el().querySelector('iframe')).toBeNull();
  });
});
