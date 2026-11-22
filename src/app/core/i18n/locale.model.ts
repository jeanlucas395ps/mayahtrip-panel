/** Os quatro idiomas da interface (ARCHITECTURE.md §3, Painel). Não criar outro. */
export type Locale = 'pt-BR' | 'pt-PT' | 'en' | 'es';

export const LOCALES: readonly Locale[] = ['pt-BR', 'pt-PT', 'en', 'es'];

export const ROTULO_LOCALE: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  'pt-PT': 'Português (Portugal)',
  en: 'English',
  es: 'Español',
};

export const LOCALE_PADRAO: Locale = 'pt-BR';

const CHAVE_ARMAZENAMENTO = 'painel-idioma';

export function lerLocaleArmazenado(): Locale {
  if (typeof localStorage === 'undefined') return LOCALE_PADRAO;
  const valor = localStorage.getItem(CHAVE_ARMAZENAMENTO);
  return (LOCALES as string[]).includes(valor ?? '') ? (valor as Locale) : LOCALE_PADRAO;
}

export function gravarLocaleArmazenado(locale: Locale): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CHAVE_ARMAZENAMENTO, locale);
}
