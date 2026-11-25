import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EmptyState } from '../../shared/empty-state/empty-state';

/** Rozmowa ze sprawozdaniami (etap 5). */
@Component({
  selector: 'app-chat',
  imports: [EmptyState],
  templateUrl: './chat.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chat {}
