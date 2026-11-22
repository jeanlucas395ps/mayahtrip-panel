import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';
import { AuthActions } from '../state/auth/auth.actions';
import { selectToken } from '../state/auth/auth.reducer';
import { API_ADMIN } from './api-base';

/** Injeta o Bearer token nas chamadas a `/v1/admin` e força logout em 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  const token = store.selectSignal(selectToken)();

  const requisicao = req.url.startsWith(API_ADMIN) && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requisicao).pipe(
    catchError((erro: HttpErrorResponse) => {
      if (erro.status === 401 && token) store.dispatch(AuthActions.sairConcluido());
      return throwError(() => erro);
    }),
  );
};
