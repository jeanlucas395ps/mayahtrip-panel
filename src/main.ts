import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { App } from './app/app';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/http/auth.interceptor';
import { AuthEffects } from './app/core/state/auth/auth.effects';
import { authFeature } from './app/core/state/auth/auth.reducer';
import { UiEffects } from './app/core/state/ui/ui.effects';
import { uiFeature } from './app/core/state/ui/ui.reducer';

bootstrapApplication(App, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideStore({ [authFeature.name]: authFeature.reducer, [uiFeature.name]: uiFeature.reducer }),
    provideEffects([AuthEffects, UiEffects]),
  ],
}).catch((erro: unknown) => {
  console.error(erro);
});
