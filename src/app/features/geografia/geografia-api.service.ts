import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ADMIN, API_PUBLICA } from '../../core/http/api-base';

export interface PaginaDe<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Pais {
  id: string;
  name: string;
  iso2: string | null;
  iso3: string | null;
  citiesCount: number;
  coverStorageKey: string | null;
  isPopular: boolean;
  popularSort: number;
}

export interface CorpoPais {
  name: string;
  iso2?: string;
  iso3?: string;
  isPopular?: boolean;
  popularSort?: number;
}

export interface Cidade {
  id: string;
  name: string;
  countryId: string;
  countryName: string | null;
  latitude: number | null;
  longitude: number | null;
  coverStorageKey: string | null;
  isPopular: boolean;
  popularSort: number;
}

export interface CorpoCidade {
  name: string;
  countryId: string;
  latitude?: number;
  longitude?: number;
  isPopular?: boolean;
  popularSort?: number;
}

export interface CidadeResumo {
  id: string;
  name: string;
  countryName: string | null;
}

/**
 * `TECH.md` §4.2 — `/v1/admin/countries` e `/v1/admin/cities`, paginados
 * pelo servidor. A API hoje não tem `GET /countries/:id` nem `GET
 * /cities/:id` (só lista e edição por id) — a ficha de um país/cidade só
 * existe enquanto o registro já foi visto numa página de lista; ver
 * `GeografiaCacheService` e o bloqueio registrado em
 * `plan/reconstrucao-painel-plan.md`.
 */
@Injectable({ providedIn: 'root' })
export class GeografiaApiService {
  private readonly http = inject(HttpClient);

  listarPaises(pagina: number, busca?: string) {
    const params: Record<string, string> = { page: String(pagina) };
    if (busca?.trim()) params['q'] = busca.trim();
    return this.http.get<PaginaDe<Pais>>(`${API_ADMIN}/countries`, { params });
  }

  criarPais(corpo: CorpoPais) {
    return this.http.post<Pais>(`${API_ADMIN}/countries`, corpo);
  }

  editarPais(id: string, corpo: CorpoPais) {
    return this.http.patch<Pais>(`${API_ADMIN}/countries/${id}`, corpo);
  }

  enviarCapaPais(id: string, arquivo: File) {
    const dados = new FormData();
    dados.set('arquivo', arquivo);
    return this.http.post<Pais>(`${API_ADMIN}/countries/${id}/cover`, dados);
  }

  listarCidades(pagina: number, busca?: string, countryId?: string) {
    const params: Record<string, string> = { page: String(pagina) };
    if (busca?.trim()) params['q'] = busca.trim();
    if (countryId) params['countryId'] = countryId;
    return this.http.get<PaginaDe<Cidade>>(`${API_ADMIN}/cities`, { params });
  }

  /** Busca simples (sem página) — usada no seletor de cidade de um lugar. */
  buscarCidades(busca: string) {
    return this.http.get<CidadeResumo[]>(`${API_ADMIN}/cities`, { params: { q: busca } });
  }

  criarCidade(corpo: CorpoCidade) {
    return this.http.post<Cidade>(`${API_ADMIN}/cities`, corpo);
  }

  editarCidade(id: string, corpo: CorpoCidade) {
    return this.http.patch<Cidade>(`${API_ADMIN}/cities/${id}`, corpo);
  }

  enviarCapaCidade(id: string, arquivo: File) {
    const dados = new FormData();
    dados.set('arquivo', arquivo);
    return this.http.post<Cidade>(`${API_ADMIN}/cities/${id}/cover`, dados);
  }

  urlCapaPais(id: string): string {
    return `${API_PUBLICA}/geography/countries/${id}/cover`;
  }

  urlCapaCidade(id: string): string {
    return `${API_PUBLICA}/geography/cities/${id}/cover`;
  }
}
