import { Component, input } from '@angular/core';

export type TomStatCard = 'roxo' | 'lima' | 'neutro';

@Component({
  selector: 'mt-stat-card',
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css',
})
export class StatCard {
  readonly rotulo = input.required<string>();
  readonly valor = input.required<string | number>();
  /** Percentual de variação; omitido quando não há comparação (ex.: totais acumulados). */
  readonly tendencia = input<number | null>(null);
  readonly tom = input<TomStatCard>('neutro');
}
