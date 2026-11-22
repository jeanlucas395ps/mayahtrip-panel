import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ADMIN } from '../../core/http/api-base';

export interface Administrador {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface CorpoAdministrador {
  nome: string;
  email: string;
  senha?: string;
}

/** `PANEL/02-administradores.md` — `/v1/admin/administrators`. */
@Injectable({ providedIn: 'root' })
export class AdministradoresApiService {
  private readonly http = inject(HttpClient);

  listar() {
    return this.http.get<Administrador[]>(`${API_ADMIN}/administrators`);
  }

  criar(corpo: CorpoAdministrador) {
    return this.http.post<Administrador>(`${API_ADMIN}/administrators`, corpo);
  }

  editar(id: string, corpo: CorpoAdministrador) {
    return this.http.patch<Administrador>(`${API_ADMIN}/administrators/${id}`, corpo);
  }

  definirAtivo(id: string, ativo: boolean) {
    return this.http.post<Administrador>(`${API_ADMIN}/administrators/${id}/${ativo ? 'activate' : 'deactivate'}`, {});
  }

  excluir(id: string) {
    return this.http.delete<void>(`${API_ADMIN}/administrators/${id}`);
  }
}
