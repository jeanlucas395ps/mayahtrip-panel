import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { Button } from '../button/button';

export interface DadosConfirmDialog {
  titulo: string;
  mensagem: string;
  confirmarRotulo: string;
  cancelarRotulo: string;
  perigo?: boolean;
}

@Component({
  selector: 'mt-confirm-dialog',
  imports: [Button],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  protected readonly dados = inject<DadosConfirmDialog>(DIALOG_DATA);
  private readonly ref = inject(DialogRef<boolean>);

  confirmar(): void {
    this.ref.close(true);
  }

  cancelar(): void {
    this.ref.close(false);
  }
}
