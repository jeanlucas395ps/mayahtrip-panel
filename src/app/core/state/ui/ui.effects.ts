import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs';
import { gravarLocaleArmazenado } from '../../i18n/locale.model';
import { UiActions } from './ui.actions';

@Injectable()
export class UiEffects {
  private readonly actions$ = inject(Actions);

  /** Guarda a escolha de idioma do administrador entre sessões. */
  readonly persistirLocale$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UiActions.idiomaDefinido),
        tap(({ locale }) => gravarLocaleArmazenado(locale)),
      ),
    { dispatch: false },
  );
}
