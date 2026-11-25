import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ReportStatus } from '../core/models';
import { EmptyState } from './empty-state/empty-state';
import { ErrorMessage } from './error-message/error-message';
import { Spinner } from './spinner/spinner';
import { StatusBadge } from './status-badge/status-badge';

@Component({
  imports: [StatusBadge, Spinner, EmptyState, ErrorMessage],
  template: `
    <app-status-badge [status]="status()" />
    <app-spinner label="Wczytywanie sprawozdań" />
    <app-empty-state heading="Pusto" description="Nic tu nie ma">
      <button class="action">Dodaj</button>
    </app-empty-state>
    <app-error-message message="Nie działa" [showRetry]="true" (retry)="retries = retries + 1" />
  `,
})
class Host {
  readonly status = signal<ReportStatus>('processing');
  retries = 0;
}

describe('shared', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('StatusBadge pokazuje polską etykietę i status jako atrybut', async () => {
    const { fixture, el } = await render();
    const badge = el.querySelector('app-status-badge')!;
    expect(badge.textContent?.trim()).toBe('Przetwarzanie');
    expect(badge.getAttribute('data-status')).toBe('processing');

    fixture.componentInstance.status.set('error');
    await fixture.whenStable();
    expect(badge.textContent?.trim()).toBe('Błąd');
  });

  it('Spinner ma rolę status i opis', async () => {
    const { el } = await render();
    const spinner = el.querySelector('app-spinner')!;
    expect(spinner.getAttribute('role')).toBe('status');
    expect(spinner.textContent).toContain('Wczytywanie sprawozdań');
  });

  it('EmptyState pokazuje nagłówek, opis i akcje', async () => {
    const { el } = await render();
    const empty = el.querySelector('app-empty-state')!;
    expect(empty.querySelector('.heading')?.textContent).toBe('Pusto');
    expect(empty.querySelector('.description')?.textContent).toBe('Nic tu nie ma');
    expect(empty.querySelector('.actions .action')).toBeTruthy();
  });

  it('ErrorMessage pokazuje komunikat i emituje retry', async () => {
    const { fixture, el } = await render();
    const error = el.querySelector('app-error-message')!;
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.textContent).toContain('Nie działa');

    error.querySelector('button')!.click();
    expect(fixture.componentInstance.retries).toBe(1);
  });
});
