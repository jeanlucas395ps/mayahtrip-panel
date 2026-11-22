import { createFeature, createReducer, on } from '@ngrx/store';
import { lerLocaleArmazenado, type Locale } from '../../i18n/locale.model';
import { UiActions } from './ui.actions';

export interface UiState {
  locale: Locale;
  barraLateralRecolhida: boolean;
}

const estadoInicial: UiState = {
  locale: lerLocaleArmazenado(),
  barraLateralRecolhida: false,
};

export const uiFeature = createFeature({
  name: 'ui',
  reducer: createReducer(
    estadoInicial,
    on(UiActions.idiomaDefinido, (estado, { locale }): UiState => ({ ...estado, locale })),
    on(UiActions.barraLateralAlternada, (estado): UiState => ({ ...estado, barraLateralRecolhida: !estado.barraLateralRecolhida })),
  ),
});

export const { selectLocale, selectBarraLateralRecolhida } = uiFeature;
