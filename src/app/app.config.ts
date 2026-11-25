import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { environment } from '../environments/environment';
import { mockApiInterceptor } from './core/mocks/mock-api.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Bez withFetch(): tylko backend XHR raportuje postęp wysyłania plików.
    provideHttpClient(withInterceptors(environment.useMocks ? [mockApiInterceptor] : [])),
  ],
};
