import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Komunikat błędu, opcjonalnie z przyciskiem „Spróbuj ponownie”. */
@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.html',
  styleUrl: './error-message.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'alert' },
})
export class ErrorMessage {
  readonly message = input.required<string>();
  readonly showRetry = input(false);
  readonly retry = output<void>();
}
