import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ADMIN } from '../../core/http/api-base';

export interface ParticipanteViagem {
  displayName: string;
  partyKind: string;
  role: string | null;
}

export interface Viagem {
  id: string;
  title: string;
  ownerName: string;
  ownerEmail: string;
  destinations: string[];
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
  status: string;
  startMode: string;
  isActive: boolean;
  visibility: 'public' | 'private';
  participants: ParticipanteViagem[];
}

export interface FiltroViagem {
  q?: string;
  owner?: string;
  destination?: string;
  status?: string;
  startMode?: string;
  from?: string;
  to?: string;
  active?: string;
  visibility?: string;
}

/** `PANEL/03-viagens.md` — `/v1/admin/trips`. Lista não paginada hoje. */
@Injectable({ providedIn: 'root' })
export class ViagensApiService {
  private readonly http = inject(HttpClient);

  listar(filtro: FiltroViagem) {
    const params: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(filtro)) {
      if (valor) params[chave] = valor;
    }
    return this.http.get<Viagem[]>(`${API_ADMIN}/trips`, { params });
  }

  ficha(id: string) {
    return this.http.get<Viagem>(`${API_ADMIN}/trips/${id}`);
  }

  definirAtiva(id: string, ativa: boolean) {
    return this.http.post<{ mensagem: string }>(`${API_ADMIN}/trips/${id}/${ativa ? 'activate' : 'deactivate'}`, {});
  }

  definirVisibilidade(id: string, visibility: 'public' | 'private') {
    return this.http.patch<Viagem>(`${API_ADMIN}/trips/${id}/visibility`, { visibility });
  }

  excluir(id: string) {
    return this.http.delete<{ mensagem: string }>(`${API_ADMIN}/trips/${id}`);
  }
}
