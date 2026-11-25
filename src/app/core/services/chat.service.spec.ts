import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ChatResponse, Source } from '../models';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  const url = `${environment.apiUrl}/chat`;
  const source: Source = { reportId: 'r1', filename: 'r1.pdf', page: 4, fragment: 'Wnioski…' };
  let service: ChatService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChatService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function answer(conversationId = 'c1'): ChatResponse {
    return { conversationId, answer: 'Odpowiedź', sources: [source] };
  }

  it('dodaje pytanie od razu, a odpowiedź ze źródłami po jej nadejściu', () => {
    service.send('  Jakie wnioski?  ', { reportIds: ['r1'] }).subscribe();

    expect(service.messages().map((m) => [m.role, m.content])).toEqual([
      ['user', 'Jakie wnioski?'],
    ]);
    expect(service.pending()).toBe(true);

    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      question: 'Jakie wnioski?',
      conversationId: null,
      reportIds: ['r1'],
    });
    req.flush(answer());

    const [, reply] = service.messages();
    expect(reply.role).toBe('assistant');
    expect(reply.content).toBe('Odpowiedź');
    expect(reply.sources).toEqual([source]);
    expect(service.pending()).toBe(false);
  });

  it('kolejne pytanie wysyła conversationId z poprzedniej odpowiedzi', () => {
    service.send('Pierwsze').subscribe();
    http.expectOne(url).flush(answer('c42'));

    service.send('Drugie').subscribe();
    expect(http.expectOne(url).request.body.conversationId).toBe('c42');
  });

  it('ignoruje puste pytanie', () => {
    service.send('   ').subscribe();
    expect(service.messages()).toEqual([]);
    expect(service.pending()).toBe(false);
  });

  it('przy błędzie ustawia komunikat i kończy oczekiwanie', () => {
    service.send('Pytanie').subscribe({ error: () => undefined });
    http
      .expectOne(url)
      .flush(
        { errors: [{ code: 'llm_unavailable', message: 'Model jest niedostępny.' }] },
        { status: 503, statusText: 'Service Unavailable' },
      );

    expect(service.error()).toBe('Model jest niedostępny.');
    expect(service.pending()).toBe(false);
    expect(service.messages()).toHaveLength(1);
  });

  it('reset zaczyna nową rozmowę', () => {
    service.send('Pierwsze').subscribe();
    http.expectOne(url).flush(answer('c1'));

    service.reset();
    expect(service.messages()).toEqual([]);

    service.send('Nowe').subscribe();
    expect(http.expectOne(url).request.body.conversationId).toBeNull();
  });
});
