import { Component, input } from '@angular/core';

export type TomBadge = 'sucesso' | 'erro' | 'aviso' | 'info' | 'neutro';

@Component({
  selector: 'mt-badge',
  template: `<ng-content />`,
  styleUrl: './badge.css',
  host: {
    '[class.mt-badge--sucesso]': "tom() === 'sucesso'",
    '[class.mt-badge--erro]': "tom() === 'erro'",
    '[class.mt-badge--aviso]': "tom() === 'aviso'",
    '[class.mt-badge--info]': "tom() === 'info'",
  },
})
export class Badge {
  readonly tom = input<TomBadge>('neutro');
}
