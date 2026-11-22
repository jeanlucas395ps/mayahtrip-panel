import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule, ScaleType, type Color } from '@swimlane/ngx-charts';
import { TranslationService } from '../../../core/i18n/translation.service';
import { Badge, type TomBadge } from '../../../ui/badge/badge';
import { Card } from '../../../ui/card/card';
import { Icon } from '../../../ui/icon/icon';
import { Spinner } from '../../../ui/spinner/spinner';
import { StatCard } from '../../../ui/stat-card/stat-card';
import { DashboardApiService, type ContagemFila, type ResumoPainel } from '../dashboard-api.service';

function isoHoje(deslocamentoDias = 0): string {
  const data = new Date();
  data.setDate(data.getDate() + deslocamentoDias);
  return data.toISOString().slice(0, 10);
}

const FILAS = ['itinerary', 'notification', 'ingestion'] as const;
type ChaveFila = (typeof FILAS)[number];

@Component({
  selector: 'app-dashboard-page',
  imports: [FormsModule, NgxChartsModule, Card, StatCard, Badge, Icon, Spinner],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
})
export class DashboardPage implements OnInit {
  private readonly api = inject(DashboardApiService);
  protected readonly i18n = inject(TranslationService);

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly resumo = signal<ResumoPainel | null>(null);

  // Período padrão: últimos 30 dias — mostra algo significativo no primeiro
  // carregamento (o painel legado usava o mesmo dia em `de` e `até`).
  protected readonly de = signal(isoHoje(-29));
  protected readonly ate = signal(isoHoje());
  protected readonly ano = signal(new Date().getFullYear());

  protected readonly filasVisiveis = FILAS;

  protected readonly serieNovos = computed(() => {
    const resumo = this.resumo();
    if (!resumo) return [];
    return [
      { name: this.i18n.t('dashboard.legendaUsuarios'), series: resumo.users.map((ponto) => ({ name: ponto.day, value: ponto.total })) },
      { name: this.i18n.t('dashboard.legendaViagens'), series: resumo.trips.map((ponto) => ({ name: ponto.day, value: ponto.total })) },
    ];
  });

  protected readonly serieAquisicoes = computed(() => {
    const resumo = this.resumo();
    if (!resumo) return [];
    return [
      { name: this.i18n.t('dashboard.legendaFree'), value: resumo.acquisitions.free },
      { name: this.i18n.t('dashboard.legendaPro'), value: resumo.acquisitions.pro },
    ];
  });

  protected readonly esquemaNovos: Color = { name: 'novos', selectable: true, group: ScaleType.Ordinal, domain: ['#2b207f', '#c9ff27'] };
  protected readonly esquemaAquisicoes: Color = { name: 'aquisicoes', selectable: true, group: ScaleType.Ordinal, domain: ['#d4cefc', '#2b207f'] };

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.buscar({ from: this.de(), to: this.ate(), year: String(this.ano()) }).subscribe({
      next: (resumo) => {
        this.resumo.set(resumo);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('comum.erroGenerico');
        this.carregando.set(false);
      },
    });
  }

  contagemDaFila(chave: ChaveFila): ContagemFila | null {
    return this.resumo()?.queues[chave] ?? null;
  }

  statusDoWorker(chave: ChaveFila): string {
    return this.resumo()?.workers[chave] ?? '';
  }

  /** A API não documenta o enum exato de `workers.<fila>`; qualquer palavra que
   * sugira "parado" vira aviso — o resto fica como saudável por padrão. */
  tomDoWorker(chave: ChaveFila): TomBadge {
    const valor = this.statusDoWorker(chave).toLowerCase();
    const indicaParado = ['stop', 'parad', 'down', 'offline', 'fora', 'dead', 'fail'].some((marca) => valor.includes(marca));
    return indicaParado ? 'erro' : 'sucesso';
  }

  rotuloDaFila(chave: ChaveFila): string {
    return this.i18n.t(`dashboard.fila${chave.charAt(0).toUpperCase()}${chave.slice(1)}`);
  }
}
