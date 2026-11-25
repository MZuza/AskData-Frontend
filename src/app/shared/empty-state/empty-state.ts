import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Pusty stan widoku. Przyciski / linki akcji wstawia się jako zawartość. */
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly heading = input.required<string>();
  readonly description = input<string>();
}
