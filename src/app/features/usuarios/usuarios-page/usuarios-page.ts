import { DatePipe } from '@angular/common';
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
import { FiltroUsuarios, UsuariosApiService, type UsuarioDoApp } from '../usuarios-api.service';

@Component({
  selector: 'app-usuarios-page',
  imports: [FormsModule, DatePipe, Card, DataTable, Badge, Button, IconButton, Icon],
  templateUrl: './usuarios-page.html',
  styleUrl: './usuarios-page.css',
})
export class UsuariosPage implements OnInit {
  private readonly api = inject(UsuariosApiService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(TranslationService);

  protected readonly carregando = signal(true);
  protected readonly usuarios = signal<UsuarioDoApp[]>([]);
  protected readonly ficha = signal<UsuarioDoApp | null>(null);

  protected readonly filtro: FiltroUsuarios & { q: string } = { q: '', ativo: '', verificado: '', entrada: '', pais: '', cadastroDe: '', cadastroAte: '' };

  protected readonly colunas: ColunaTabela<UsuarioDoApp>[] = [
    { chave: 'name', titulo: this.i18n.t('usuarios.colunaNome') },
    { chave: 'username', titulo: this.i18n.t('usuarios.colunaUsuario'), render: (u) => `@${u.username}` },
    { chave: 'email', titulo: this.i18n.t('usuarios.colunaEmail') },
    { chave: 'countryName', titulo: this.i18n.t('usuarios.colunaPais'), render: (u) => u.countryName ?? '—' },
    { chave: 'planCode', titulo: this.i18n.t('usuarios.colunaPlano') },
  ];

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.api.listar(this.filtro).subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.carregando.set(false);
      },
      error: (erro: HttpErrorResponse) => {
        this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' });
        this.carregando.set(false);
      },
    });
  }

  abrirFicha(usuario: UsuarioDoApp): void {
    this.api.porId(usuario.id).subscribe({
      next: (completo) => this.ficha.set(completo),
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  fecharFicha(): void {
    this.ficha.set(null);
  }

  tomDoStatus(status: UsuarioDoApp['status']): TomBadge {
    if (status === 'active') return 'sucesso';
    if (status === 'pending') return 'aviso';
    return 'neutro';
  }

  rotuloDoStatus(status: UsuarioDoApp['status']): string {
    return this.i18n.t(`usuarios.status${status.charAt(0).toUpperCase()}${status.slice(1)}`);
  }

  alternarAtivo(usuario: UsuarioDoApp): void {
    this.api.definirAtivo(usuario.id, usuario.status !== 'active').subscribe({
      next: (atualizado) => {
        this.ficha.set(atualizado);
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  async excluir(usuario: UsuarioDoApp): Promise<void> {
    const confirmou = await this.modal.confirmar({
      titulo: this.i18n.t('usuarios.confirmarExclusaoTitulo'),
      mensagem: this.i18n.t('usuarios.confirmarExclusaoMensagem'),
      confirmarRotulo: this.i18n.t('comum.excluir'),
      cancelarRotulo: this.i18n.t('comum.cancelar'),
      perigo: true,
    });
    if (!confirmou) return;

    this.api.excluir(usuario.id).subscribe({
      next: () => {
        this.ficha.set({ ...usuario, deleted: true });
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  restaurar(usuario: UsuarioDoApp): void {
    this.api.restaurar(usuario.id).subscribe({
      next: (atualizado) => {
        this.ficha.set(atualizado);
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }
}
