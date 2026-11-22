import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ADMIN } from '../../core/http/api-base';
import type { StatusLugar } from '../lugares/lugares-api.service';

export interface LugarRelevante {
  placeId: string;
  name: string;
  cityName: string | null;
  status: StatusLugar;
  sortOrder: number;
  totalReviews: number;
}

/** `TECH.md` §4.2 — carrossel "em alta" do app, `/v1/admin/relevant-places`. */
@Injectable({ providedIn: 'root' })
export class LugaresRelevantesApiService {
  private readonly http = inject(HttpClient);

  listar() {
    return this.http.get<LugarRelevante[]>(`${API_ADMIN}/relevant-places`);
  }

  adicionar(placeId: string, sortOrder?: number) {
    return this.http.post<LugarRelevante>(`${API_ADMIN}/relevant-places`, { placeId, sortOrder });
  }

  remover(placeId: string) {
    return this.http.delete<void>(`${API_ADMIN}/relevant-places/${placeId}`);
  }
}
