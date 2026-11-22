import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslationService } from '../../../core/i18n/translation.service';
import { mensagemDoErro } from '../../../core/http/erro';
import { Avatar } from '../../../ui/avatar/avatar';
import { Badge } from '../../../ui/badge/badge';
import { Button } from '../../../ui/button/button';
import { Card } from '../../../ui/card/card';
import { DataTable, type ColunaTabela } from '../../../ui/data-table/data-table';
import { ModalService } from '../../../ui/modal/modal.service';
import { ToastService } from '../../../ui/toast/toast.service';
import { AdminFormDialog, type DadosAdminFormDialog } from '../admin-form-dialog';
import { AdministradoresApiService, type Administrador, type CorpoAdministrador } from '../administradores-api.service';

@Component({
  selector: 'app-administradores-page',
  imports: [Card, DataTable, Badge, Button, Avatar],
  templateUrl: './administradores-page.html',
  styleUrl: './administradores-page.css',
})
export class AdministradoresPage implements OnInit {
  private readonly api = inject(AdministradoresApiService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(TranslationService);

  protected readonly carregando = signal(true);
  protected readonly administradores = signal<Administrador[]>([]);

  protected readonly colunas: ColunaTabela<Administrador>[] = [
    { chave: 'name', titulo: this.i18n.t('admin.colunaNome') },
    { chave: 'email', titulo: this.i18n.t('admin.colunaEmail') },
  ];

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.api.listar().subscribe({
      next: (lista) => {
        this.administradores.set(lista);
        this.carregando.set(false);
      },
      error: (erro: HttpErrorResponse) => {
        this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' });
        this.carregando.set(false);
      },
    });
  }

  async abrirFormulario(administrador: Administrador | null): Promise<void> {
    const ref = this.modal.abrir<CorpoAdministrador | undefined, DadosAdminFormDialog, AdminFormDialog>(AdminFormDialog, {
      data: { administrador },
    });
    const corpo = await firstValueFrom(ref.closed);
    if (!corpo) return;

    const pedido = administrador ? this.api.editar(administrador.id, corpo) : this.api.criar(corpo);
    pedido.subscribe({
      next: () => {
        this.toast.mostrar(this.i18n.t('admin.salvo'), { tom: 'sucesso' });
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  alternarAtivo(administrador: Administrador): void {
    this.api.definirAtivo(administrador.id, !administrador.isActive).subscribe({
      next: () => this.carregar(),
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  async excluir(administrador: Administrador): Promise<void> {
    const confirmou = await this.modal.confirmar({
      titulo: this.i18n.t('admin.excluirTitulo'),
      mensagem: this.i18n.t('admin.excluirMensagem'),
      confirmarRotulo: this.i18n.t('comum.excluir'),
      cancelarRotulo: this.i18n.t('comum.cancelar'),
      perigo: true,
    });
    if (!confirmou) return;

    this.api.excluir(administrador.id).subscribe({
      next: () => {
        this.toast.mostrar(this.i18n.t('admin.excluido'));
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }
}
