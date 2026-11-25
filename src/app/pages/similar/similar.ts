import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EmptyState } from '../../shared/empty-state/empty-state';

/** Pary sprawozdań o podobnej treści (etap 6). */
@Component({
  selector: 'app-similar',
  imports: [EmptyState],
  templateUrl: './similar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Similar {}
