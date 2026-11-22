import { Component, input } from '@angular/core';

export type VarianteBotao = 'primario' | 'acento' | 'contorno' | 'fantasma' | 'perigo';
export type TamanhoBotao = 'md' | 'lg';

@Component({
  selector: 'mt-button',
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  readonly variante = input<VarianteBotao>('primario');
  readonly tamanho = input<TamanhoBotao>('md');
  readonly tipo = input<'button' | 'submit'>('button');
  readonly desabilitado = input(false);
  readonly carregando = input(false);
  readonly largoTotal = input(false);
}
