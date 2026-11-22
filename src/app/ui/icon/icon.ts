import { Component, input } from '@angular/core';

/**
 * Ícones de linha, 24×24, traço 1.8, família única — `DESIGN_SYSTEM.md`
 * "Regra do Ícone Uniforme". O pacote definitivo do produto segue
 * `A DEFINIR` (`DESIGN.md` §A DEFINIR); este é o provisório do painel,
 * construído com formas simples para não arriscar glifo errado.
 */
export type NomeIcone =
  | 'inicio'
  | 'escudo'
  | 'pulso'
  | 'mala'
  | 'usuario'
  | 'estrela'
  | 'pino'
  | 'globo'
  | 'imagem'
  | 'bandeira'
  | 'conversa'
  | 'bolsa'
  | 'camadas'
  | 'grafico'
  | 'etiqueta'
  | 'ticket'
  | 'cartao'
  | 'repetir'
  | 'desfazer'
  | 'carteira'
  | 'lista'
  | 'relogio'
  | 'controles'
  | 'sair'
  | 'cheveron-baixo'
  | 'cheveron-esquerda'
  | 'menu'
  | 'busca'
  | 'fechar';

@Component({
  selector: 'mt-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.css',
})
export class Icon {
  readonly nome = input.required<NomeIcone>();
}
