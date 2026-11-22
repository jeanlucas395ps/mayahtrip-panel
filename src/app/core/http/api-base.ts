declare global {
  interface Window {
    __MAYAHTRIP_API_BASE__?: string;
  }
}

/** Em teste/produção o deploy injeta `window.__MAYAHTRIP_API_BASE__` (ex.: https://api-v2.mayahtrip.com). */
function resolverBaseDaApi(): string {
  if (typeof window !== 'undefined' && window.__MAYAHTRIP_API_BASE__) {
    return window.__MAYAHTRIP_API_BASE__.replace(/\/$/, '');
  }
  return 'http://127.0.0.1:3000';
}

export const API_BASE = resolverBaseDaApi();
/** Rotas de operação (ARCHITECTURE.md: painel fala só com `/v1/admin`). */
export const API_ADMIN = `${API_BASE}/v1/admin`;
/** Rotas públicas da API (`/v1`), só quando a função do painel precisa delas. */
export const API_PUBLICA = `${API_BASE}/v1`;
