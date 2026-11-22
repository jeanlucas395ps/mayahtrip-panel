import { Injectable, signal } from '@angular/core';
import type { Cidade, Pais } from './geografia-api.service';

/**
 * Guarda o último registro visto na lista, por id. Existe só porque a API
 * ainda não tem `GET /countries/:id` / `GET /cities/:id` (ver
 * `geografia-api.service.ts`); quando essa rota existir, a ficha passa a
 * buscar direto e este serviço cai fora.
 */
@Injectable({ providedIn: 'root' })
export class GeografiaCacheService {
  private readonly paises = signal<Map<string, Pais>>(new Map());
  private readonly cidades = signal<Map<string, Cidade>>(new Map());

  registrarPaises(lista: Pais[]): void {
    this.paises.update((mapa) => {
      const novo = new Map(mapa);
      for (const pais of lista) novo.set(pais.id, pais);
      return novo;
    });
  }

  registrarPais(pais: Pais): void {
    this.paises.update((mapa) => new Map(mapa).set(pais.id, pais));
  }

  pais(id: string): Pais | undefined {
    return this.paises().get(id);
  }

  registrarCidades(lista: Cidade[]): void {
    this.cidades.update((mapa) => {
      const novo = new Map(mapa);
      for (const cidade of lista) novo.set(cidade.id, cidade);
      return novo;
    });
  }

  registrarCidade(cidade: Cidade): void {
    this.cidades.update((mapa) => new Map(mapa).set(cidade.id, cidade));
  }

  cidade(id: string): Cidade | undefined {
    return this.cidades().get(id);
  }
}
