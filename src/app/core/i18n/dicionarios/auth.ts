import type { Locale } from '../locale.model';

/** Tela de entrada do administrador (`PANEL.md` §2, acesso). */
export const DICIONARIO_AUTH: Record<Locale, Record<string, string>> = {
  'pt-BR': {
    'auth.kicker': 'Painel MayahTrip',
    'auth.titulo': 'Entrar',
    'auth.subtitulo': 'Operar a plataforma: contas, viagens, cobrança e comunidade.',
    'auth.campoEmail': 'E-mail',
    'auth.campoSenha': 'Senha',
    'auth.botaoEntrar': 'Entrar',
    'auth.entrando': 'Entrando…',
    'auth.erroEntrada': 'Não foi possível entrar. Confira o e-mail e a senha.',
    'auth.semConta': 'Conta de administrador, separada da conta do app.',
  },
  'pt-PT': {
    'auth.kicker': 'Painel MayahTrip',
    'auth.titulo': 'Entrar',
    'auth.subtitulo': 'Operar a plataforma: contas, viagens, cobrança e comunidade.',
    'auth.campoEmail': 'E-mail',
    'auth.campoSenha': 'Palavra-passe',
    'auth.botaoEntrar': 'Entrar',
    'auth.entrando': 'A entrar…',
    'auth.erroEntrada': 'Não foi possível entrar. Confirme o e-mail e a palavra-passe.',
    'auth.semConta': 'Conta de administrador, separada da conta da aplicação.',
  },
  en: {
    'auth.kicker': 'MayahTrip panel',
    'auth.titulo': 'Sign in',
    'auth.subtitulo': 'Operate the platform: accounts, trips, billing and community.',
    'auth.campoEmail': 'Email',
    'auth.campoSenha': 'Password',
    'auth.botaoEntrar': 'Sign in',
    'auth.entrando': 'Signing in…',
    'auth.erroEntrada': 'Could not sign in. Check your email and password.',
    'auth.semConta': 'Administrator account, separate from the app account.',
  },
  es: {
    'auth.kicker': 'Panel MayahTrip',
    'auth.titulo': 'Entrar',
    'auth.subtitulo': 'Operar la plataforma: cuentas, viajes, cobros y comunidad.',
    'auth.campoEmail': 'Correo',
    'auth.campoSenha': 'Contraseña',
    'auth.botaoEntrar': 'Entrar',
    'auth.entrando': 'Entrando…',
    'auth.erroEntrada': 'No fue posible entrar. Revisa el correo y la contraseña.',
    'auth.semConta': 'Cuenta de administrador, separada de la cuenta de la app.',
  },
};
