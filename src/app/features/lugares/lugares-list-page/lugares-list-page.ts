import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../core/i18n/translation.service';
import { mensagemDoErro } from '../../../core/http/erro';
import { Badge, type TomBadge } from '../../../ui/badge/badge';
import { Button } from '../../../ui/button/button';
import { Card } from '../../../ui/card/card';
import { DataTable, type ColunaTabela } from '../../../ui/data-table/data-table';
import { Pagination } from '../../../ui/pagination/pagination';
import { ToastService } from '../../../ui/toast/toast.service';
import { LugaresApiService, type LugarResumo, type StatusLugar } from '../lugares-api.service';

@Component({
  selector: 'app-lugares-list-page',
  imports: [FormsModule, Card, DataTable, Badge, Button, Pagination],
  templateUrl: './lugares-list-page.html',
  styleUrl: './lugares-list-page.css',
})
export class LugaresListPage implements OnInit {
  private readonly api = inject(LugaresApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(TranslationService);

  protected readonly carregando = signal(true);
  protected readonly lugares = signal<LugarResumo[]>([]);
  protected readonly pagina = signal(1);
  protected readonly total = signal(0);
  protected readonly busca = signal('');
  protected readonly status = signal<StatusLugar | ''>('');

  protected readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / 20)));

  protected readonly colunas: ColunaTabela<LugarResumo>[] = [
    { chave: 'name', titulo: this.i18n.t('lugares.colunaNome') },
    { chave: 'cityName', titulo: this.i18n.t('lugares.colunaCidade'), render: (l) => l.cityName ?? '—' },
  ];

  ngOnInit(): void {
    this.carregar();
  }

  carregar(pagina = this.pagina()): void {
    this.pagina.set(pagina);
    this.carregando.set(true);
    this.api.listar(pagina, this.busca(), this.status() || undefined).subscribe({
      next: (res) => {
        this.lugares.set(res.items);
        this.total.set(res.total);
        this.carregando.set(false);
      },
      error: (erro: HttpErrorResponse) => {
        this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' });
        this.carregando.set(false);
      },
    });
  }

  abrir(lugar: LugarResumo): void {
    this.router.navigate(['/lugares', lugar.id]);
  }

  novo(): void {
    this.router.navigate(['/lugares', 'novo']);
  }

  tomDoStatus(status: StatusLugar): TomBadge {
    return status === 'active' ? 'sucesso' : 'neutro';
  }

  rotuloDoStatus(status: StatusLugar): string {
    return this.i18n.t(`lugares.status${status.charAt(0).toUpperCase()}${status.slice(1)}`);
  }
}
