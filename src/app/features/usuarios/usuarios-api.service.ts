import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ADMIN } from '../../core/http/api-base';

export interface UsuarioDoApp {
  id: string;
  name: string;
  username: string;
  email: string;
  countryId: string | null;
  countryName: string | null;
  locale: string;
  currency: string;
  planCode: string;
  emailVerified: boolean;
  createdAt: string;
  status: 'pending' | 'active' | 'inactive';
  deleted: boolean;
  entrada: 'google' | 'senha' | 'ambos';
}

export interface FiltroUsuarios {
  q?: string;
  ativo?: string;
  verificado?: string;
  entrada?: string;
  pais?: string;
  cadastroDe?: string;
  cadastroAte?: string;
}

/** `PANEL/04-usuarios.md` — `/v1/admin/users`. Sem paginação de servidor
 * hoje (a rota devolve a lista inteira filtrada); ver `TECH.md` quando isso
 * mudar. */
@Injectable({ providedIn: 'root' })
export class UsuariosApiService {
  private readonly http = inject(HttpClient);

  listar(filtro: FiltroUsuarios) {
    const params: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(filtro)) {
      if (valor) params[chave] = valor;
    }
    return this.http.get<UsuarioDoApp[]>(`${API_ADMIN}/users`, { params });
  }

  porId(id: string) {
    return this.http.get<UsuarioDoApp>(`${API_ADMIN}/users/${id}`);
  }

  definirAtivo(id: string, ativo: boolean) {
    return this.http.post<UsuarioDoApp>(`${API_ADMIN}/users/${id}/${ativo ? 'activate' : 'deactivate'}`, {});
  }

  excluir(id: string) {
    return this.http.delete<void>(`${API_ADMIN}/users/${id}`);
  }

  restaurar(id: string) {
    return this.http.post<UsuarioDoApp>(`${API_ADMIN}/users/${id}/restore`, {});
  }
}
