import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { SimilarPair } from '../models';
import { SimilarityService } from './similarity.service';

describe('SimilarityService', () => {
  const url = `${environment.apiUrl}/reports/similar`;
  let service: SimilarityService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SimilarityService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pobiera pary z podanym progiem i zapisuje je', () => {
    const pair: SimilarPair = {
      a: { id: 'r1', filename: 'r1.pdf', author: 'A' },
      b: { id: 'r2', filename: 'r2.pdf', author: 'B' },
      score: 0.95,
    };

    service.load({ minScore: 0.9 }).subscribe();
    expect(service.loading()).toBe(true);

    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.get('minScore')).toBe('0.9');
    req.flush([pair]);

    expect(service.pairs()).toEqual([pair]);
    expect(service.loading()).toBe(false);
  });
});
