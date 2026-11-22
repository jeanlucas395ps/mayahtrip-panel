import { Injectable, signal } from '@angular/core';

export type TomToast = 'sucesso' | 'erro' | 'neutro';

export interface ToastItem {
  id: number;
  mensagem: string;
  tom: TomToast;
  acaoRotulo?: string;
  aoAgir?: () => void;
}

interface OpcoesToast {
  tom?: TomToast;
  acaoRotulo?: string;
  aoAgir?: () => void;
  /** DESIGN_SYSTEM.md: remoção oferece Desfazer no toast por 3,2s. */
  duracaoMs?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private contador = 0;
  readonly itens = signal<ToastItem[]>([]);

  mostrar(mensagem: string, opcoes: OpcoesToast = {}): void {
    const id = ++this.contador;
    this.itens.update((lista) => [...lista, { id, mensagem, tom: opcoes.tom ?? 'neutro', acaoRotulo: opcoes.acaoRotulo, aoAgir: opcoes.aoAgir }]);
    setTimeout(() => this.remover(id), opcoes.duracaoMs ?? 3200);
  }

  remover(id: number): void {
    this.itens.update((lista) => lista.filter((item) => item.id !== id));
  }
}
