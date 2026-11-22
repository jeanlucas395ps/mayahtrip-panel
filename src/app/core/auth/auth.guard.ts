import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectEstaAutenticado } from '../state/auth/auth.selectors';

/** Protege tudo fora de `/entrar` e `/legado` — sem sessão, volta para o login. */
export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  if (store.selectSignal(selectEstaAutenticado)()) return true;

  return router.createUrlTree(['/entrar'], { queryParams: { continuar: state.url } });
};
