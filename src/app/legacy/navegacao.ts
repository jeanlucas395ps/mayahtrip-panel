export const GRUPOS = [
  { titulo: 'gPrincipal', itens: ['inicio', 'administradores', 'saude'] },
  { titulo: 'gViagens', itens: ['viagens', 'usuarios', 'pro', 'lugares', 'lugaresRelevantes', 'geografia', 'publicacoes', 'denuncias'] },
  { titulo: 'gConteudo', itens: ['maya', 'mala', 'hub'] },
  { titulo: 'gPagamentos', itens: ['financeiro', 'planos', 'cupons', 'pagamentos', 'assinaturas', 'estorno', 'metodos', 'logs', 'expiracao'] },
  { titulo: 'gSistema', itens: ['filas', 'ajustes'] },
] as const;

export type TelaMenu = (typeof GRUPOS)[number]['itens'][number];

/** `lugar` é a ficha dedicada — não aparece no menu lateral. */
export type TelaPainel = TelaMenu | 'lugar';
