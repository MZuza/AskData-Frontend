import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { details } from './core/testing/fixtures';

describe('routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  function text(): string {
    return harness.routeNativeElement?.textContent ?? '';
  }

  it('przekierowuje stronę główną na listę sprawozdań', async () => {
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/reports');
    expect(text()).toContain('Sprawozdania');
  });

  it.each([
    ['/chat', 'Czat · AskData'],
    ['/similar', 'Podobne sprawozdania · AskData'],
  ])('%s ustawia tytuł karty', async (url, title) => {
    await harness.navigateByUrl(url);
    expect(TestBed.inject(Title).getTitle()).toBe(title);
  });

  it('przekazuje id sprawozdania z adresu do komponentu', async () => {
    await harness.navigateByUrl('/reports/r_01');
    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiUrl}/reports/r_01`)
      .flush(details('r_01'));
    await harness.fixture.whenStable();
    expect(text()).toContain('Wahadło matematyczne');
  });

  it('pokazuje stronę 404 dla nieznanego adresu', async () => {
    await harness.navigateByUrl('/nie-ma-takiej');
    expect(text()).toContain('Nie ma takiej strony');
  });
});
