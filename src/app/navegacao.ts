export const GRUPOS = [
  { titulo: 'gCasa', itens: ['inicio', 'financeiro', 'saude'] },
  { titulo: 'gGente', itens: ['usuarios', 'administradores'] },
  { titulo: 'gProduto', itens: ['lugares', 'viagens', 'mala', 'publicacoes', 'denuncias', 'hub'] },
  { titulo: 'gConta', itens: ['planos', 'cupons', 'pro', 'pagamentos', 'assinaturas', 'estorno', 'metodos', 'logs', 'expiracao'] },
  { titulo: 'gSistema', itens: ['maya', 'filas', 'ajustes'] },
] as const;

export type TelaPainel = (typeof GRUPOS)[number]['itens'][number];
