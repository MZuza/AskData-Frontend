import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, lastValueFrom, toArray } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ChatResponse, PagedResult, Report, ReportDetails, SimilarPair } from '../models';
import { ReportsService } from '../services/reports.service';
import { MOCK_API_CONFIG } from './mock-api.config';
import { mockApiInterceptor } from './mock-api.interceptor';

describe('mockApiInterceptor', () => {
  const api = environment.apiUrl;
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([mockApiInterceptor])),
        provideHttpClientTesting(),
        { provide: MOCK_API_CONFIG, useValue: { latencyMs: 0, processingMs: 0 } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  // Żadne żądanie do API nie powinno dotrzeć do prawdziwego backendu.
  afterEach(() => backend.verify());

  function list(params: Record<string, string | number> = {}): Promise<PagedResult<Report>> {
    return firstValueFrom(http.get<PagedResult<Report>>(`${api}/reports`, { params }));
  }

  function ask(question: string): Promise<ChatResponse> {
    return firstValueFrom(http.post<ChatResponse>(`${api}/chat`, { question }));
  }

  it('zwraca stronę sprawozdań, od najnowszych', async () => {
    const page = await list();
    expect(page.totalCount).toBe(5);
    expect(page.items[0].id).toBe('r_05');
    expect(page.items[0]).not.toHaveProperty('sections');
  });

  it('filtruje po grupie i wyszukiwanym tekście', async () => {
    expect((await list({ group: 'L3' })).totalCount).toBe(2);
    expect((await list({ q: 'nowak' })).items.map((r) => r.id)).toEqual(['r_02']);
  });

  it('stronicuje wyniki', async () => {
    const page = await list({ page: 2, pageSize: 2 });
    expect(page.items).toHaveLength(2);
    expect(page.totalPages).toBe(3);
  });

  it('zwraca szczegóły albo 404 w formacie ApiError', async () => {
    const details = await firstValueFrom(http.get<ReportDetails>(`${api}/reports/r_01`));
    expect(details.sections.length).toBeGreaterThan(0);

    await expect(firstValueFrom(http.get(`${api}/reports/brak`))).rejects.toMatchObject({
      status: 404,
      error: { errors: [{ code: 'not_found' }] },
    });
  });

  it('wgrywa PDF (z postępem) i po czasie przetwarzania oznacza go jako gotowy', async () => {
    const reports = TestBed.inject(ReportsService);
    const file = new File(['%PDF-1.4'], 'Lewandowski_lab5.pdf', { type: 'application/pdf' });

    const events = await lastValueFrom(reports.upload([file]).pipe(toArray()));
    const done = events.at(-1);

    expect(events.filter((e) => e.state === 'progress').map((e) => e.percent)).toEqual([
      25, 50, 75, 100,
    ]);
    expect(done?.state === 'done' && done.reports[0].status).toBe('processing');

    const uploaded = (await list({ q: 'lewandowski_lab5' })).items[0];
    expect(uploaded.status).toBe('ready');
    expect(uploaded.author).toBe('Lewandowski');
  });

  it('odrzuca pliki, które nie są PDF', async () => {
    const body = new FormData();
    body.append('files', new File(['x'], 'notatki.docx'));

    await expect(firstValueFrom(http.post(`${api}/reports`, body))).rejects.toMatchObject({
      status: 400,
      error: { errors: [{ code: 'invalid_pdf' }] },
    });
  });

  it('usuwa sprawozdanie', async () => {
    await firstValueFrom(http.delete(`${api}/reports/r_01`));
    await expect(firstValueFrom(http.get(`${api}/reports/r_01`))).rejects.toMatchObject({
      status: 404,
    });
  });

  it('odpowiada na pytanie o wnioski studenta ze źródłem i stroną', async () => {
    const res = await ask('Jakie wnioski przedstawił Kowalski?');
    expect(res.conversationId).toBeTruthy();
    expect(res.sources).toEqual([expect.objectContaining({ reportId: 'r_01', page: 7 })]);
  });

  it('wskazuje sprawozdania bez sekcji analizy wyników', async () => {
    const res = await ask('Które sprawozdania nie mają analizy wyników?');
    expect(res.sources.map((s) => s.reportId)).toEqual(['r_03']);
  });

  it('zwraca podobne pary powyżej progu', async () => {
    const pairs = await firstValueFrom(
      http.get<SimilarPair[]>(`${api}/reports/similar`, { params: { minScore: 0.9 } }),
    );
    expect(pairs.map((p) => [p.a.id, p.b.id])).toEqual([['r_01', 'r_02']]);
  });

  it('przepuszcza żądania spoza API', () => {
    http.get('/assets/config.json').subscribe();
    backend.expectOne('/assets/config.json').flush({});
  });
});
