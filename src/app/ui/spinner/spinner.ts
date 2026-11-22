import { Component, input } from '@angular/core';

@Component({
  selector: 'mt-spinner',
  template: `<span class="spinner" [style.width.px]="tamanho()" [style.height.px]="tamanho()" role="status" [attr.aria-label]="rotulo()"></span>`,
  styleUrl: './spinner.css',
})
export class Spinner {
  readonly tamanho = input(24);
  readonly rotulo = input('Carregando');
}
