import { NgTemplateOutlet } from '@angular/common';
import { Component, ContentChild, input, output, TemplateRef } from '@angular/core';
import { EmptyState } from '../empty-state/empty-state';
import { Spinner } from '../spinner/spinner';

export interface ColunaTabela<T> {
  chave: string;
  titulo: string;
  alinhamento?: 'start' | 'center' | 'end';
  largura?: string;
  render?: (linha: T) => string;
}

/**
 * Tabela genérica do kit. Colunas simples renderizam texto (`render`
 * opcional); para uma célula com badge, avatar ou menu, a tela consumidora
 * passa `<ng-template #acoesLinha let-linha>` — ver `DataTable.acoesTemplate`.
 */
@Component({
  selector: 'mt-data-table',
  imports: [NgTemplateOutlet, EmptyState, Spinner],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable<T> {
  readonly colunas = input.required<ColunaTabela<T>[]>();
  readonly linhas = input.required<T[]>();
  readonly carregando = input(false);
  readonly tituloVazio = input('Nada por aqui ainda.');
  readonly linhaClicada = output<T>();

  @ContentChild('acoesLinha') acoesTemplate?: TemplateRef<{ $implicit: T }>;
  /** Célula fixa antes das colunas normais — miniatura de capa, por exemplo
   * (país, cidade, lugar). Opcional; sem ela a tabela não reserva espaço. */
  @ContentChild('capaLinha') capaTemplate?: TemplateRef<{ $implicit: T }>;

  valorDe(linha: T, coluna: ColunaTabela<T>): string {
    if (coluna.render) return coluna.render(linha);
    const valor = (linha as Record<string, unknown>)[coluna.chave];
    return valor === null || valor === undefined ? '' : String(valor);
  }
}
