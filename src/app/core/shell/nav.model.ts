import type { NomeIcone } from '../../ui/icon/icon';

export interface ItemNav {
  rotuloChave: string;
  rota: string;
  icone: NomeIcone;
  /** `false` enquanto a tela ainda vive só no painel clássico (`/legado`). */
  implementado: boolean;
}

export interface GrupoNav {
  tituloChave: string;
  itens: ItemNav[];
}

/** Espelha `GRUPOS` do painel legado (`legacy/navegacao.ts`) — mesma ordem e
 * agrupamento, migrando item por item conforme `plan/reconstrucao-painel-plan.md`. */
export const NAV: readonly GrupoNav[] = [
  {
    tituloChave: 'shell.grupoPrincipal',
    itens: [
      { rotuloChave: 'shell.navInicio', rota: '/inicio', icone: 'inicio', implementado: true },
      { rotuloChave: 'shell.navAdministradores', rota: '/administradores', icone: 'escudo', implementado: true },
      { rotuloChave: 'shell.navSaude', rota: '/legado', icone: 'pulso', implementado: false },
    ],
  },
  {
    tituloChave: 'shell.grupoViagens',
    itens: [
      { rotuloChave: 'shell.navViagens', rota: '/viagens', icone: 'mala', implementado: true },
      { rotuloChave: 'shell.navUsuarios', rota: '/usuarios', icone: 'usuario', implementado: true },
      { rotuloChave: 'shell.navPro', rota: '/legado', icone: 'estrela', implementado: false },
      { rotuloChave: 'shell.navLugares', rota: '/lugares', icone: 'pino', implementado: true },
      { rotuloChave: 'shell.navLugaresRelevantes', rota: '/lugares-relevantes', icone: 'estrela', implementado: true },
      { rotuloChave: 'shell.navGeografia', rota: '/geografia/paises', icone: 'globo', implementado: true },
      { rotuloChave: 'shell.navPublicacoes', rota: '/legado', icone: 'imagem', implementado: false },
      { rotuloChave: 'shell.navDenuncias', rota: '/legado', icone: 'bandeira', implementado: false },
    ],
  },
  {
    tituloChave: 'shell.grupoConteudo',
    itens: [
      { rotuloChave: 'shell.navMaya', rota: '/legado', icone: 'conversa', implementado: false },
      { rotuloChave: 'shell.navMala', rota: '/legado', icone: 'bolsa', implementado: false },
      { rotuloChave: 'shell.navHub', rota: '/legado', icone: 'camadas', implementado: false },
    ],
  },
  {
    tituloChave: 'shell.grupoPagamentos',
    itens: [
      { rotuloChave: 'shell.navFinanceiro', rota: '/legado', icone: 'grafico', implementado: false },
      { rotuloChave: 'shell.navPlanos', rota: '/legado', icone: 'etiqueta', implementado: false },
      { rotuloChave: 'shell.navCupons', rota: '/legado', icone: 'ticket', implementado: false },
      { rotuloChave: 'shell.navPagamentos', rota: '/legado', icone: 'cartao', implementado: false },
      { rotuloChave: 'shell.navAssinaturas', rota: '/legado', icone: 'repetir', implementado: false },
      { rotuloChave: 'shell.navEstorno', rota: '/legado', icone: 'desfazer', implementado: false },
      { rotuloChave: 'shell.navMetodos', rota: '/legado', icone: 'carteira', implementado: false },
      { rotuloChave: 'shell.navLogs', rota: '/legado', icone: 'lista', implementado: false },
      { rotuloChave: 'shell.navExpiracao', rota: '/legado', icone: 'relogio', implementado: false },
    ],
  },
  {
    tituloChave: 'shell.grupoSistema',
    itens: [
      { rotuloChave: 'shell.navFilas', rota: '/legado', icone: 'camadas', implementado: false },
      { rotuloChave: 'shell.navAjustes', rota: '/legado', icone: 'controles', implementado: false },
    ],
  },
] as const;
