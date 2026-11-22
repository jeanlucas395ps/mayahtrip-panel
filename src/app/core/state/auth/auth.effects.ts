import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthApiService } from '../../auth/auth-api.service';
import { AuthActions } from './auth.actions';
import { CHAVE_TOKEN_SESSAO } from './auth.reducer';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly entrar$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.entrarSolicitado),
      switchMap(({ email, senha }) =>
        this.api.entrar(email, senha).pipe(
          map(({ accessToken }) => AuthActions.entrarSucesso({ accessToken })),
          // Mensagem fixa e traduzida no componente (`auth.erroEntrada`), igual
          // ao painel legado: não repete o texto cru que a API devolver.
          catchError(() => of(AuthActions.entrarFalhou({ mensagem: 'auth.erroEntrada' }))),
        ),
      ),
    ),
  );

  readonly persistirAoEntrar$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.entrarSucesso),
        tap(({ accessToken }) => sessionStorage.setItem(CHAVE_TOKEN_SESSAO, accessToken)),
      ),
    { dispatch: false },
  );

  readonly navegarAoEntrar$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.entrarSucesso),
        tap(() => this.router.navigateByUrl('/inicio')),
      ),
    { dispatch: false },
  );

  readonly sair$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.sairSolicitado),
      switchMap(() =>
        this.api.sair().pipe(
          map(() => AuthActions.sairConcluido()),
          // Falha ao avisar o servidor não deve travar o admin na sessão local.
          catchError(() => of(AuthActions.sairConcluido())),
        ),
      ),
    ),
  );

  readonly limparAoSair$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.sairConcluido),
        tap(() => {
          sessionStorage.removeItem(CHAVE_TOKEN_SESSAO);
          this.router.navigateByUrl('/entrar');
        }),
      ),
    { dispatch: false },
  );
}
