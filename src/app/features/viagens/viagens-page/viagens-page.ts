import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/i18n/translation.service';
import { mensagemDoErro } from '../../../core/http/erro';
import { Badge, type TomBadge } from '../../../ui/badge/badge';
import { Button } from '../../../ui/button/button';
import { Card } from '../../../ui/card/card';
import { DataTable, type ColunaTabela } from '../../../ui/data-table/data-table';
import { IconButton } from '../../../ui/icon-button/icon-button';
import { Icon } from '../../../ui/icon/icon';
import { ModalService } from '../../../ui/modal/modal.service';
import { ToastService } from '../../../ui/toast/toast.service';
import { FiltroViagem, ViagensApiService, type Viagem } from '../viagens-api.service';

@Component({
  selector: 'app-viagens-page',
  imports: [FormsModule, Card, DataTable, Badge, Button, IconButton, Icon],
  templateUrl: './viagens-page.html',
  styleUrl: './viagens-page.css',
})
export class ViagensPage implements OnInit {
  private readonly api = inject(ViagensApiService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(TranslationService);

  protected readonly carregando = signal(true);
  protected readonly viagens = signal<Viagem[]>([]);
  protected readonly ficha = signal<Viagem | null>(null);

  protected readonly filtro: FiltroViagem = { q: '', owner: '', destination: '', status: '', startMode: '', from: '', to: '' };
  protected readonly soAtivas = signal(false);
  protected readonly soPublicas = signal(false);

  protected readonly colunas: ColunaTabela<Viagem>[] = [
    { chave: 'title', titulo: this.i18n.t('viagens.colunaTitulo') },
    { chave: 'ownerName', titulo: this.i18n.t('viagens.colunaDono') },
    { chave: 'destinations', titulo: this.i18n.t('viagens.colunaDestinos'), render: (v) => v.destinations.join(', ') },
  ];

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    const filtro: FiltroViagem = { ...this.filtro };
    if (this.soAtivas()) filtro.active = 'true';
    if (this.soPublicas()) filtro.visibility = 'public';
    this.api.listar(filtro).subscribe({
      next: (lista) => {
        this.viagens.set(lista);
        this.carregando.set(false);
      },
      error: (erro: HttpErrorResponse) => {
        this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' });
        this.carregando.set(false);
      },
    });
  }

  abrirFicha(viagem: Viagem): void {
    this.api.ficha(viagem.id).subscribe({
      next: (completa) => this.ficha.set(completa),
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  fecharFicha(): void {
    this.ficha.set(null);
  }

  tomDoStatus(status: string): TomBadge {
    if (status === 'happening') return 'sucesso';
    if (status === 'upcoming') return 'info';
    if (status === 'finished') return 'neutro';
    return 'aviso';
  }

  rotuloDoStatus(status: string): string {
    const chave = `viagens.status${status.charAt(0).toUpperCase()}${status.slice(1)}`;
    return this.i18n.t(chave);
  }

  rotuloDoModo(modo: string): string {
    const chave = `viagens.modo${modo.charAt(0).toUpperCase()}${modo.slice(1)}`;
    return this.i18n.t(chave);
  }

  alternarAtiva(viagem: Viagem): void {
    this.api.definirAtiva(viagem.id, !viagem.isActive).subscribe({
      next: () => {
        this.ficha.update((atual) => (atual ? { ...atual, isActive: !atual.isActive } : atual));
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  alternarVisibilidade(viagem: Viagem): void {
    const nova = viagem.visibility === 'public' ? 'private' : 'public';
    this.api.definirVisibilidade(viagem.id, nova).subscribe({
      next: (atualizada) => {
        this.ficha.set(atualizada);
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  async excluir(viagem: Viagem): Promise<void> {
    const confirmou = await this.modal.confirmar({
      titulo: this.i18n.t('viagens.confirmarExclusaoTitulo'),
      mensagem: this.i18n.t('viagens.confirmarExclusaoMensagem'),
      confirmarRotulo: this.i18n.t('comum.excluir'),
      cancelarRotulo: this.i18n.t('comum.cancelar'),
      perigo: true,
    });
    if (!confirmou) return;
    this.api.excluir(viagem.id).subscribe({
      next: () => {
        this.toast.mostrar(this.i18n.t('viagens.excluida'));
        this.fecharFicha();
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }
}
