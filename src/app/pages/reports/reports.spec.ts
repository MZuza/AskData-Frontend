import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../environments/environment';
import { paged, report } from '../../core/testing/fixtures';
import { FileDropzone } from '../../shared/file-dropzone/file-dropzone';
import { REPORT_POLL_INTERVAL_MS } from '../../core/services/reports.service';
import { Reports } from './reports';

describe('Reports', () => {
  const base = `${environment.apiUrl}/reports`;
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'reports', component: Reports }], withComponentInputBinding()),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  async function open(url = '/reports'): Promise<void> {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    http.expectOne(`${base}/groups`).flush(['L3', 'L4']);
  }

  function expectList() {
    return http.expectOne((r) => r.method === 'GET' && r.url === base);
  }

  async function stable(): Promise<void> {
    await harness.fixture.whenStable();
  }

  function el(): HTMLElement {
    return harness.routeNativeElement!;
  }

  function rows(): string[] {
    return [...el().querySelectorAll('tbody tr')].map(
      (tr) => tr.querySelector('td')?.textContent?.trim() ?? '',
    );
  }

  it('wczytuje listę i pokazuje wiersze z liczbą sprawozdań', async () => {
    await open();
    expectList().flush(paged([report('r1'), report('r2')]));
    await stable();

    expect(rows()).toEqual(['r1.pdf', 'r2.pdf']);
    expect(el().querySelector('.summary')?.textContent).toContain('2 sprawozdania');
    expect(el().querySelectorAll('select option')).toHaveLength(1 + 2 + 1 + 3);
  });

  it('przekazuje filtry z adresu do API', async () => {
    await open('/reports?q=nowak&group=L3&status=ready&page=2');
    const req = expectList();
    req.flush(paged([]));

    const params = req.request.params;
    expect(params.get('q')).toBe('nowak');
    expect(params.get('group')).toBe('L3');
    expect(params.get('status')).toBe('ready');
    expect(params.get('page')).toBe('2');
    expect(params.get('pageSize')).toBe('20');
  });

  it('zmiana filtra zapisuje się w adresie i wraca na 1. stronę', async () => {
    await open('/reports?page=3');
    expectList().flush(paged([report('r1')]));
    await stable();

    const select = el().querySelector<HTMLSelectElement>('select')!;
    select.value = 'L4';
    select.dispatchEvent(new Event('change'));
    await stable();

    expect(TestBed.inject(Router).url).toBe('/reports?group=L4');
    expect(expectList().request.params.get('group')).toBe('L4');
  });

  it('pokazuje pusty stan i „Brak wyników” przy filtrach', async () => {
    await open();
    expectList().flush(paged([]));
    await stable();
    expect(el().textContent).toContain('Brak sprawozdań');

    await harness.navigateByUrl('/reports?q=xyz');
    expectList().flush(paged([]));
    await stable();
    expect(el().textContent).toContain('Brak wyników');
  });

  it('przy błędzie pozwala spróbować ponownie', async () => {
    await open();
    expectList().flush(
      { errors: [{ code: 'boom', message: 'Serwer nie odpowiada.' }] },
      { status: 500, statusText: 'Server Error' },
    );
    await stable();
    expect(el().textContent).toContain('Serwer nie odpowiada.');

    el().querySelector<HTMLButtonElement>('app-error-message button')!.click();
    expectList().flush(paged([report('r1')]));
    await stable();
    expect(rows()).toEqual(['r1.pdf']);
  });

  it('odświeża listę w tle, dopóki coś się przetwarza', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    await open();
    expectList().flush(paged([report('r1', 'processing')]));
    await stable();

    vi.advanceTimersByTime(REPORT_POLL_INTERVAL_MS);
    expectList().flush(paged([report('r1', 'ready')]));
    await stable();

    // Po zakończeniu przetwarzania: odświeżenie grup, koniec pollingu.
    http.expectOne(`${base}/groups`).flush(['L1']);
    vi.advanceTimersByTime(REPORT_POLL_INTERVAL_MS * 2);
    http.expectNone((r) => r.url === base);
    expect(el().querySelector('app-status-badge')?.textContent?.trim()).toBe('Gotowe');
  });

  it('usuwa sprawozdanie po potwierdzeniu', async () => {
    await open();
    expectList().flush(paged([report('r1'), report('r2')]));
    await stable();

    el().querySelector<HTMLButtonElement>('[aria-label="Usuń r1.pdf"]')!.click();
    await stable();
    [...el().querySelectorAll<HTMLButtonElement>('.confirm button')]
      .find((b) => b.textContent?.trim() === 'Tak')!
      .click();

    const req = http.expectOne(`${base}/r1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await stable();

    expect(rows()).toEqual(['r2.pdf']);
  });

  it('wgrywa pliki z dropzone i dodaje je na górę listy', async () => {
    await open();
    expectList().flush(paged([report('r1')]));
    await stable();

    const dropzone = harness.fixture.debugElement.query(By.directive(FileDropzone))
      .componentInstance as FileDropzone;
    dropzone.filesSelected.emit([new File(['%PDF'], 'nowe.pdf', { type: 'application/pdf' })]);
    await stable();
    expect(el().querySelector('.upload-progress')?.textContent).toContain('Wgrywanie 1 pliku');

    http
      .expectOne((r) => r.method === 'POST' && r.url === base)
      .flush([report('new', 'processing')]);
    await stable();

    expect(rows()).toEqual(['new.pdf', 'r1.pdf']);
    expect(el().querySelector('.upload-progress')).toBeNull();
  });
});
