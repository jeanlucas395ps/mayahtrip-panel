import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Entrar Solicitado': props<{ email: string; senha: string }>(),
    'Entrar Sucesso': props<{ accessToken: string }>(),
    'Entrar Falhou': props<{ mensagem: string }>(),
    'Sessao Restaurada': props<{ accessToken: string }>(),
    'Sair Solicitado': emptyProps(),
    'Sair Concluido': emptyProps(),
  },
});
