import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { environment } from '../../../environments/environment';

interface NavLink {
  path: string;
  label: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly links: NavLink[] = [
    { path: '/reports', label: 'Sprawozdania' },
    { path: '/chat', label: 'Czat' },
    { path: '/similar', label: 'Podobieństwo' },
  ];

  /** Pokazuje znacznik, że aplikacja działa na danych testowych. */
  protected readonly useMocks = environment.useMocks;
}
