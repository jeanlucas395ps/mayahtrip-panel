import { createFeature, createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';

export const CHAVE_TOKEN_SESSAO = 'painel-token';

export interface AuthState {
  token: string | null;
  email: string | null;
  carregando: boolean;
  erro: string | null;
}

function lerTokenArmazenado(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(CHAVE_TOKEN_SESSAO);
}

const estadoInicial: AuthState = {
  token: lerTokenArmazenado(),
  email: null,
  carregando: false,
  erro: null,
};

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    estadoInicial,
    on(AuthActions.entrarSolicitado, (estado, { email }): AuthState => ({ ...estado, email, carregando: true, erro: null })),
    on(AuthActions.entrarSucesso, (estado, { accessToken }): AuthState => ({ ...estado, token: accessToken, carregando: false, erro: null })),
    on(AuthActions.entrarFalhou, (estado, { mensagem }): AuthState => ({ ...estado, token: null, carregando: false, erro: mensagem })),
    on(AuthActions.sessaoRestaurada, (estado, { accessToken }): AuthState => ({ ...estado, token: accessToken })),
    on(AuthActions.sairConcluido, (): AuthState => ({ token: null, email: null, carregando: false, erro: null })),
  ),
});

export const { selectToken, selectEmail, selectCarregando, selectErro } = authFeature;
