import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { UploadProgress } from '../models';
import { paged, report } from '../testing/fixtures';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const base = `${environment.apiUrl}/reports`;
  let service: ReportsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadList(...ids: string[]): void {
    service.load().subscribe();
    http.expectOne(base).flush(paged(ids.map((id) => report(id))));
  }

  it('load wysyła niepuste filtry i zapisuje stronę wyników', () => {
    service.load({ group: 'L3', q: '', page: 2 }).subscribe();
    expect(service.loading()).toBe(true);

    const req = http.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('group')).toBe('L3');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.has('q')).toBe(false);

    req.flush(paged([report('r1', 'ready', 'L3'), report('r2', 'processing')]));

    expect(service.reports().map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(service.totalCount()).toBe(2);
    expect(service.hasProcessing()).toBe(true);
    expect(service.loading()).toBe(false);
  });

  it('load ustawia komunikat błędu z odpowiedzi backendu', () => {
    service.load().subscribe({ error: () => undefined });
    http
      .expectOne(base)
      .flush(
        { errors: [{ code: 'boom', message: 'Coś poszło nie tak.' }] },
        { status: 500, statusText: 'Server Error' },
      );

    expect(service.error()).toBe('Coś poszło nie tak.');
    expect(service.loading()).toBe(false);
  });

  it('load w tle nie zmienia stanu ładowania ani błędu', () => {
    service.load({}, { background: true }).subscribe({ error: () => undefined });
    expect(service.loading()).toBe(false);
    http.expectOne(base).flush(null, { status: 500, statusText: 'Server Error' });
    expect(service.error()).toBeNull();
  });

  it('loadGroups pobiera grupy do filtra', () => {
    service.loadGroups().subscribe();
    http.expectOne(`${base}/groups`).flush(['L3', 'L4']);
    expect(service.groups()).toEqual(['L3', 'L4']);
  });

  it('get pobiera szczegóły sprawozdania', () => {
    let topic: string | null = null;
    service.get('r1').subscribe((d) => (topic = d.topic));
    http.expectOne(`${base}/r1`).flush({ ...report('r1'), topic: 'Lepkość' });
    expect(topic).toBe('Lepkość');
  });

  it('upload wysyła pliki jako multipart i raportuje postęp', () => {
    loadList('old');
    const events: UploadProgress[] = [];
    const file = new File(['%PDF-1.4'], 'nowe.pdf', { type: 'application/pdf' });

    service.upload([file]).subscribe((e) => events.push(e));

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect((req.request.body as FormData).getAll('files')).toHaveLength(1);

    req.event({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });
    req.flush([report('new', 'processing')]);

    expect(events).toEqual([
      { state: 'progress', percent: 50 },
      { state: 'done', reports: [report('new', 'processing')] },
    ]);
    expect(service.reports().map((r) => r.id)).toEqual(['new', 'old']);
    expect(service.totalCount()).toBe(2);
  });

  it('remove usuwa sprawozdanie z listy', () => {
    loadList('r1', 'r2');

    service.remove('r1').subscribe();
    const req = http.expectOne(`${base}/r1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(service.reports().map((r) => r.id)).toEqual(['r2']);
    expect(service.totalCount()).toBe(1);
  });

  it('getFile pobiera PDF jako blob typu application/pdf', async () => {
    let file: Blob | undefined;
    service.getFile('r1').subscribe((blob) => (file = blob));
    const req = http.expectOne(`${base}/r1/file`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['%PDF-1.4'], { type: 'application/octet-stream' }));

    expect(file?.type).toBe('application/pdf');
  });

  it('fileUrl koduje identyfikator', () => {
    expect(service.fileUrl('a/b')).toBe(`${base}/a%2Fb/file`);
  });
});
