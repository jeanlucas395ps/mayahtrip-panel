import { Component, input } from '@angular/core';

@Component({
  selector: 'mt-card',
  template: `<ng-content />`,
  styleUrl: './card.css',
  host: {
    '[class.mt-card--sem-padding]': 'semPadding()',
    '[class.mt-card--elevado]': 'elevado()',
  },
})
export class Card {
  readonly semPadding = input(false);
  readonly elevado = input(false);
}
