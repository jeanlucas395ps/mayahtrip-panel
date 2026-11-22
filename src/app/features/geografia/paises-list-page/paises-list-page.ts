import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService } from '../../../core/i18n/translation.service';
import { mensagemDoErro } from '../../../core/http/erro';
import { Badge } from '../../../ui/badge/badge';
import { Button } from '../../../ui/button/button';
import { Card } from '../../../ui/card/card';
import { DataTable, type ColunaTabela } from '../../../ui/data-table/data-table';
import { Pagination } from '../../../ui/pagination/pagination';
import { ToastService } from '../../../ui/toast/toast.service';
import { GeografiaApiService, type Pais } from '../geografia-api.service';
import { GeografiaCacheService } from '../geografia-cache.service';

@Component({
  selector: 'app-paises-list-page',
  imports: [FormsModule, RouterLink, RouterLinkActive, Card, DataTable, Badge, Button, Pagination],
  templateUrl: './paises-list-page.html',
  styleUrl: './paises-list-page.css',
})
export class PaisesListPage implements OnInit {
  private readonly api = inject(GeografiaApiService);
  private readonly cache = inject(GeografiaCacheService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(TranslationService);

  protected readonly carregando = signal(true);
  protected readonly paises = signal<Pais[]>([]);
  protected readonly pagina = signal(1);
  protected readonly total = signal(0);
  protected readonly busca = signal('');

  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / 50)));

  protected readonly colunas: ColunaTabela<Pais>[] = [
    { chave: 'name', titulo: this.i18n.t('geo.colunaNome') },
    { chave: 'iso2', titulo: this.i18n.t('geo.colunaIso'), render: (p) => p.iso2 ?? '—' },
    { chave: 'citiesCount', titulo: this.i18n.t('geo.colunaCidades'), alinhamento: 'end' },
  ];

  ngOnInit(): void {
    this.carregar();
  }

  carregar(pagina = this.pagina()): void {
    this.pagina.set(pagina);
    this.carregando.set(true);
    this.api.listarPaises(pagina, this.busca()).subscribe({
      next: (res) => {
        this.paises.set(res.items);
        this.total.set(res.total);
        this.cache.registrarPaises(res.items);
        this.carregando.set(false);
      },
      error: (erro: HttpErrorResponse) => {
        this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' });
        this.carregando.set(false);
      },
    });
  }

  abrir(pais: Pais): void {
    this.cache.registrarPais(pais);
    this.router.navigate(['/geografia/paises', pais.id]);
  }

  novo(): void {
    this.router.navigate(['/geografia/paises', 'novo']);
  }

  urlCapa(pais: Pais): string | null {
    return pais.coverStorageKey ? this.api.urlCapaPais(pais.id) : null;
  }
}
