import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ADMIN } from '../http/api-base';

interface RespostaEntrar {
  accessToken: string;
}

/** `/v1/admin/sign-in` e `/v1/admin/logout` — mesmo contrato do painel legado. */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  entrar(email: string, senha: string) {
    return this.http.post<RespostaEntrar>(`${API_ADMIN}/sign-in`, { email, senha });
  }

  sair() {
    return this.http.post<void>(`${API_ADMIN}/logout`, {});
  }
}
