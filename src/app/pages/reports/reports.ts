import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EmptyState } from '../../shared/empty-state/empty-state';

/** Wgrywanie i lista sprawozdań (etap 3). */
@Component({
  selector: 'app-reports',
  imports: [EmptyState],
  templateUrl: './reports.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports {}
