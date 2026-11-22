import { Dialog, DialogRef, type DialogConfig } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog, type DadosConfirmDialog } from './confirm-dialog';

type OpcoesConfirmar = Partial<Omit<DadosConfirmDialog, 'titulo' | 'mensagem'>> & {
  titulo: string;
  mensagem: string;
};

/** Fino sobre `@angular/cdk/dialog` — foco preso, ESC e `aria-*` já resolvidos pelo CDK. */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly dialog = inject(Dialog);

  abrir<R = unknown, D = unknown, T = unknown>(componente: ComponentType<T>, config?: DialogConfig<D, DialogRef<R, T>>) {
    return this.dialog.open<R, D, T>(componente, config);
  }

  /** Atalho para o padrão "confirmar exclusão"/"confirmar ação" repetido em quase toda tela de `PANEL/`. */
  async confirmar(opcoes: OpcoesConfirmar): Promise<boolean> {
    const ref = this.dialog.open<boolean, DadosConfirmDialog, ConfirmDialog>(ConfirmDialog, {
      data: {
        titulo: opcoes.titulo,
        mensagem: opcoes.mensagem,
        confirmarRotulo: opcoes.confirmarRotulo ?? 'Confirmar',
        cancelarRotulo: opcoes.cancelarRotulo ?? 'Cancelar',
        perigo: opcoes.perigo ?? false,
      },
    });
    const resultado = await firstValueFrom(ref.closed);
    return resultado === true;
  }
}
