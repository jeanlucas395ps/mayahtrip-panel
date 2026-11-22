import { createSelector } from '@ngrx/store';
import { selectToken } from './auth.reducer';

export const selectEstaAutenticado = createSelector(selectToken, (token) => token !== null && token !== '');
