import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Report } from '../../../core/models';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

/** Tabela sprawozdań z usuwaniem potwierdzanym w wierszu. */
@Component({
  selector: 'app-reports-table',
  imports: [DatePipe, RouterLink, StatusBadge],
  templateUrl: './reports-table.html',
  styleUrl: './reports-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsTable {
  readonly reports = input.required<Report[]>();
  /** Id sprawozdania, którego usuwanie jest w toku. */
  readonly deletingId = input<string | null>(null);
  readonly remove = output<string>();

  /** Wiersz, w którym pytamy „Usunąć?”. */
  protected readonly confirmingId = signal<string | null>(null);

  protected confirmRemove(id: string): void {
    this.confirmingId.set(null);
    this.remove.emit(id);
  }
}
