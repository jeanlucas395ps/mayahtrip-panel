import { Component, computed, input } from '@angular/core';

const PALETA = ['#2b207f', '#ff8a5b', '#5bc0eb', '#7cc243', '#f2b84b'] as const;

function corPara(texto: string): string {
  let soma = 0;
  for (let i = 0; i < texto.length; i++) soma += texto.charCodeAt(i);
  return PALETA[soma % PALETA.length];
}

@Component({
  selector: 'mt-avatar',
  template: `
    <span
      class="avatar"
      [style.background]="cor()"
      [style.width.px]="tamanho()"
      [style.height.px]="tamanho()"
      [style.font-size.px]="tamanho() * 0.4"
    >
      {{ iniciais() }}
    </span>
  `,
  styleUrl: './avatar.css',
})
export class Avatar {
  readonly nome = input.required<string>();
  readonly tamanho = input(36);

  readonly iniciais = computed(() => {
    const partes = this.nome().trim().split(/\s+/).filter(Boolean);
    const primeira = partes[0]?.[0] ?? '';
    const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
    return (primeira + ultima).toUpperCase();
  });

  readonly cor = computed(() => corPara(this.nome()));
}
