import { InjectionToken } from '@angular/core';

export interface MockApiConfig {
  /** Sztuczne opóźnienie odpowiedzi (ms). */
  latencyMs: number;
  /** Po ilu ms wgrane sprawozdanie przechodzi z `processing` do `ready`. */
  processingMs: number;
}

export const MOCK_API_CONFIG = new InjectionToken<MockApiConfig>('MOCK_API_CONFIG', {
  providedIn: 'root',
  factory: () => ({ latencyMs: 400, processingMs: 5000 }),
});
