import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ADMIN, API_PUBLICA } from '../../core/http/api-base';
import type { PaginaDe } from '../geografia/geografia-api.service';

export type StatusLugar = 'active' | 'archived';
export type IdiomaCatalogo = 'pt-BR' | 'pt-PT' | 'en' | 'es';

export interface LugarResumo {
  id: string;
  slug: string;
  name: string;
  status: StatusLugar;
  cityName: string | null;
}

export interface TraducaoLugar {
  locale: IdiomaCatalogo;
  name: string | null;
  description: string | null;
}

export interface EnderecoLugar {
  line1: string | null;
  neighborhood: string | null;
  postalCode: string | null;
  cityId: string | null;
}

export interface HorarioLugar {
  weekday: number;
  openingTime: string | null;
  closingTime: string | null;
  isClosed: boolean;
}

export interface PrecoLugar {
  currency: string | null;
  priceLevel: number | null;
  minimumPrice: number | null;
  maximumPrice: number | null;
}

export interface VisitaLugar {
  recommendedDurationMinutes: number | null;
  bestTimeToVisit: string | null;
  accessibilityInformation: string | null;
}

export interface ReferenciaLugar {
  provider: string;
  externalId: string;
  externalUrl: string | null;
  providerMetadata: Record<string, unknown> | null;
}

export interface MidiaLugar {
  id: string;
  mediaType: string;
  attribution: string | null;
  sortOrder: number | null;
}

export interface LugarCompleto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cityId: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteUrl: string | null;
  phone: string | null;
  status: StatusLugar;
  translations: TraducaoLugar[];
  categoryIds: string[];
  addresses: EnderecoLugar[];
  openingHours: HorarioLugar[];
  prices: PrecoLugar[];
  visitInformation: VisitaLugar[];
  externalReferences: ReferenciaLugar[];
  averageRating: number | null;
  totalReviews: number;
  media: MidiaLugar[];
}

export type CorpoLugar = Omit<LugarCompleto, 'id' | 'averageRating' | 'totalReviews' | 'media'>;

export interface CategoriaLugar {
  id: string;
  slug: string;
  parentId: string | null;
  translations: { locale: IdiomaCatalogo; name: string }[];
}

export interface CidadeResumo {
  id: string;
  name: string;
  countryName: string | null;
}

/** `TECH.md` §4.2 — `/v1/admin/places`, `/v1/admin/place-categories`. */
@Injectable({ providedIn: 'root' })
export class LugaresApiService {
  private readonly http = inject(HttpClient);

  listar(pagina: number, busca?: string, status?: StatusLugar) {
    const params: Record<string, string> = { page: String(pagina) };
    if (busca?.trim()) params['q'] = busca.trim();
    if (status) params['status'] = status;
    return this.http.get<PaginaDe<LugarResumo>>(`${API_ADMIN}/places`, { params });
  }

  ficha(id: string) {
    return this.http.get<LugarCompleto>(`${API_ADMIN}/places/${id}`);
  }

  criar(corpo: CorpoLugar) {
    return this.http.post<LugarCompleto>(`${API_ADMIN}/places`, corpo);
  }

  editar(id: string, corpo: CorpoLugar) {
    return this.http.patch<LugarCompleto>(`${API_ADMIN}/places/${id}`, corpo);
  }

  arquivar(id: string) {
    return this.http.post<LugarCompleto>(`${API_ADMIN}/places/${id}/archive`, {});
  }

  unificar(id: string, origemId: string) {
    return this.http.post<LugarCompleto>(`${API_ADMIN}/places/${id}/merge`, { origemId });
  }

  enviarMidia(id: string, arquivo: File, atribuicao?: string, ordem?: number) {
    const dados = new FormData();
    dados.set('arquivo', arquivo);
    const params: Record<string, string> = {};
    if (atribuicao?.trim()) params['atribuicao'] = atribuicao.trim();
    if (ordem !== undefined) params['ordem'] = String(ordem);
    return this.http.post<MidiaLugar>(`${API_ADMIN}/places/${id}/media`, dados, { params });
  }

  removerMidia(id: string, mediaId: string) {
    return this.http.delete<void>(`${API_ADMIN}/places/${id}/media/${mediaId}`);
  }

  categorias() {
    return this.http.get<CategoriaLugar[]>(`${API_ADMIN}/place-categories`);
  }

  buscarCidades(busca: string) {
    return this.http.get<CidadeResumo[]>(`${API_ADMIN}/cities`, { params: { q: busca } });
  }

  urlMidia(placeId: string, mediaId: string): string {
    return `${API_PUBLICA}/catalog/places/${placeId}/media/${mediaId}`;
  }
}
