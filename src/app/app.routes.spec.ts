import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';

describe('routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
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
    expect(text()).toContain('r_01');
  });

  it('pokazuje stronę 404 dla nieznanego adresu', async () => {
    await harness.navigateByUrl('/nie-ma-takiej');
    expect(text()).toContain('Nie ma takiej strony');
  });
});
