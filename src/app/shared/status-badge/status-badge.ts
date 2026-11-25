import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ReportStatus } from '../../core/models';

const LABELS: Record<ReportStatus, string> = {
  processing: 'Przetwarzanie',
  ready: 'Gotowe',
  error: 'Błąd',
};

/** Etykieta statusu przetwarzania sprawozdania. */
@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-status]': 'status()' },
})
export class StatusBadge {
  readonly status = input.required<ReportStatus>();
  protected readonly label = computed(() => LABELS[this.status()]);
}
