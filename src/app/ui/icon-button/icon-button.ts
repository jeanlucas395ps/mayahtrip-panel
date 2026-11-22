import { Component, input } from '@angular/core';

@Component({
  selector: 'mt-icon-button',
  template: `
    <button class="botao-icone" [class.botao-icone--ativo]="ativo()" [attr.aria-label]="rotulo()" [attr.title]="rotulo()" type="button">
      <ng-content />
    </button>
  `,
  styleUrl: './icon-button.css',
})
export class IconButton {
  readonly rotulo = input.required<string>();
  readonly ativo = input(false);
}
