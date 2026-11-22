import type { HttpErrorResponse } from '@angular/common/http';

/** Mesma forma de erro da API em todo o painel (`{ message }`, sem stack — DEVELOPMENT.md §3). */
export function mensagemDoErro(erro: HttpErrorResponse, fallback = 'Erro'): string {
  const corpo = erro.error as { message?: string } | null;
  return corpo?.message ?? fallback;
}
