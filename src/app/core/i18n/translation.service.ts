import { Injectable, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectLocale } from '../state/ui/ui.reducer';
import { UiActions } from '../state/ui/ui.actions';
import { DICIONARIO_ADMINISTRADORES } from './dicionarios/administradores';
import { DICIONARIO_AUTH } from './dicionarios/auth';
import { DICIONARIO_COMUM } from './dicionarios/comum';
import { DICIONARIO_DASHBOARD } from './dicionarios/dashboard';
import { DICIONARIO_GEOGRAFIA } from './dicionarios/geografia';
import { DICIONARIO_LUGARES } from './dicionarios/lugares';
import { DICIONARIO_LUGARES_RELEVANTES } from './dicionarios/lugares-relevantes';
import { DICIONARIO_SHELL } from './dicionarios/shell';
import { DICIONARIO_VIAGENS } from './dicionarios/viagens';
import { DICIONARIO_USUARIOS } from './dicionarios/usuarios';
import { LOCALES, type Locale } from './locale.model';

type Dicionario = Record<Locale, Record<string, string>>;

const DICIONARIOS: Dicionario[] = [
  DICIONARIO_COMUM,
  DICIONARIO_SHELL,
  DICIONARIO_AUTH,
  DICIONARIO_DASHBOARD,
  DICIONARIO_ADMINISTRADORES,
  DICIONARIO_USUARIOS,
  DICIONARIO_GEOGRAFIA,
  DICIONARIO_LUGARES,
  DICIONARIO_LUGARES_RELEVANTES,
  DICIONARIO_VIAGENS,
];

function mesclar(dicionarios: Dicionario[]): Record<Locale, Record<string, string>> {
  const resultado = Object.fromEntries(LOCALES.map((locale) => [locale, {}])) as Record<Locale, Record<string, string>>;
  for (const dicionario of dicionarios) {
    for (const locale of LOCALES) Object.assign(resultado[locale], dicionario[locale]);
  }
  return resultado;
}

const TEXTOS = mesclar(DICIONARIOS);

/**
 * Tradução do painel novo (4 idiomas — `ARCHITECTURE.md` §3). Cada feature
 * ganha seu próprio arquivo em `dicionarios/` em vez de um dicionário único
 * gigante; este serviço só junta tudo e resolve pelo idioma ativo no store.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly store = inject(Store);

  readonly locale = this.store.selectSignal(selectLocale);
  readonly textosDoIdioma = computed(() => TEXTOS[this.locale()]);

  /** Resolve `chave` no idioma ativo; cai para pt-BR e, por fim, para a própria chave. */
  t(chave: string): string {
    return this.textosDoIdioma()[chave] ?? TEXTOS['pt-BR'][chave] ?? chave;
  }

  definirLocale(locale: Locale): void {
    this.store.dispatch(UiActions.idiomaDefinido({ locale }));
  }
}
