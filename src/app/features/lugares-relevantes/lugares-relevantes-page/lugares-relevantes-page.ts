import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslationService } from '../../../core/i18n/translation.service';
import { mensagemDoErro } from '../../../core/http/erro';
import { Button } from '../../../ui/button/button';
import { Card } from '../../../ui/card/card';
import { DataTable, type ColunaTabela } from '../../../ui/data-table/data-table';
import { ToastService } from '../../../ui/toast/toast.service';
import { LugaresApiService, type LugarResumo } from '../../lugares/lugares-api.service';
import { LugaresRelevantesApiService, type LugarRelevante } from '../lugares-relevantes-api.service';

@Component({
  selector: 'app-lugares-relevantes-page',
  imports: [Card, DataTable, Button],
  templateUrl: './lugares-relevantes-page.html',
  styleUrl: './lugares-relevantes-page.css',
})
export class LugaresRelevantesPage implements OnInit {
  private readonly api = inject(LugaresRelevantesApiService);
  private readonly lugaresApi = inject(LugaresApiService);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(TranslationService);

  protected readonly carregando = signal(true);
  protected readonly relevantes = signal<LugarRelevante[]>([]);
  protected readonly busca = signal('');
  protected readonly candidatos = signal<LugarResumo[]>([]);
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  protected readonly colunas: ColunaTabela<LugarRelevante>[] = [
    { chave: 'name', titulo: this.i18n.t('relevantes.colunaNome') },
    { chave: 'cityName', titulo: this.i18n.t('relevantes.colunaCidade'), render: (l) => l.cityName ?? '—' },
    { chave: 'sortOrder', titulo: this.i18n.t('relevantes.colunaOrdem'), alinhamento: 'end' },
    { chave: 'totalReviews', titulo: this.i18n.t('relevantes.colunaAvaliacoes'), alinhamento: 'end' },
  ];

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.api.listar().subscribe({
      next: (lista) => {
        this.relevantes.set(lista);
        this.carregando.set(false);
      },
      error: (erro: HttpErrorResponse) => {
        this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' });
        this.carregando.set(false);
      },
    });
  }

  aoDigitar(valor: string): void {
    this.busca.set(valor);
    if (this.temporizador) clearTimeout(this.temporizador);
    const consulta = valor.trim();
    if (!consulta) {
      this.candidatos.set([]);
      return;
    }
    this.temporizador = setTimeout(() => {
      this.lugaresApi.listar(1, consulta, 'active').subscribe({
        next: (res) => {
          const jaInclusos = new Set(this.relevantes().map((r) => r.placeId));
          this.candidatos.set(res.items.filter((item) => !jaInclusos.has(item.id)));
        },
        error: () => {},
      });
    }, 280);
  }

  adicionar(candidato: LugarResumo): void {
    this.api.adicionar(candidato.id).subscribe({
      next: () => {
        this.busca.set('');
        this.candidatos.set([]);
        this.toast.mostrar(this.i18n.t('relevantes.adicionado'), { tom: 'sucesso' });
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  remover(item: LugarRelevante): void {
    this.api.remover(item.placeId).subscribe({
      next: () => {
        this.toast.mostrar(this.i18n.t('relevantes.removido'));
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }
}
