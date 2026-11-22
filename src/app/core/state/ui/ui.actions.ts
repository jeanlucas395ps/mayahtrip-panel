import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { Locale } from '../../i18n/locale.model';

export const UiActions = createActionGroup({
  source: 'UI',
  events: {
    'Idioma Definido': props<{ locale: Locale }>(),
    'Barra Lateral Alternada': emptyProps(),
  },
});
