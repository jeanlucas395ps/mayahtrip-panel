import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslationService } from '../../core/i18n/translation.service';
import { Button } from '../../ui/button/button';
import { FormField } from '../../ui/form-field/form-field';
import type { Administrador, CorpoAdministrador } from './administradores-api.service';

export interface DadosAdminFormDialog {
  administrador: Administrador | null;
}

@Component({
  selector: 'app-admin-form-dialog',
  imports: [ReactiveFormsModule, Button, FormField],
  templateUrl: './admin-form-dialog.html',
  styleUrl: './admin-form-dialog.css',
})
export class AdminFormDialog {
  protected readonly dados = inject<DadosAdminFormDialog>(DIALOG_DATA);
  private readonly ref = inject(DialogRef<CorpoAdministrador | undefined>);
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(TranslationService);

  protected readonly editando = this.dados.administrador !== null;

  protected readonly formulario = this.fb.nonNullable.group({
    nome: [this.dados.administrador?.name ?? '', [Validators.required, Validators.maxLength(120)]],
    email: [this.dados.administrador?.email ?? '', [Validators.required, Validators.email, Validators.maxLength(255)]],
    senha: ['', this.editando ? [Validators.minLength(8)] : [Validators.required, Validators.minLength(8)]],
  });

  cancelar(): void {
    this.ref.close(undefined);
  }

  confirmar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { nome, email, senha } = this.formulario.getRawValue();
    const corpo: CorpoAdministrador = { nome, email, ...(senha.trim() ? { senha } : {}) };
    this.ref.close(corpo);
  }
}
