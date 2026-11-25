import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Wskaźnik ładowania z opisem dla czytników ekranu. */
@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status' },
})
export class Spinner {
  readonly label = input('Ładowanie…');
}
