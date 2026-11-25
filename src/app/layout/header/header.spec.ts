import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([{ path: '**', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('pokazuje nazwę aplikacji', () => {
    expect(el.querySelector('.logo')?.textContent).toContain('AskData');
  });

  it('ma linki do głównych widoków', () => {
    const links = [...el.querySelectorAll<HTMLAnchorElement>('.nav a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/reports', '/chat', '/similar']);
  });

  it('oznacza aktywny link', async () => {
    await TestBed.inject(Router).navigateByUrl('/chat');
    await fixture.whenStable();

    const active = el.querySelector('.nav a.active');
    expect(active?.textContent?.trim()).toBe('Czat');
    expect(active?.getAttribute('aria-current')).toBe('page');
  });
});
