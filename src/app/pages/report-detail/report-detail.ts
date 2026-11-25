import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyState } from '../../shared/empty-state/empty-state';

/** Podgląd odczytanej treści sprawozdania i pliku PDF (etap 4). */
@Component({
  selector: 'app-report-detail',
  imports: [EmptyState, RouterLink],
  templateUrl: './report-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDetail {
  /** Parametr trasy `reports/:id` (przez `withComponentInputBinding`). */
  readonly id = input.required<string>();
}
