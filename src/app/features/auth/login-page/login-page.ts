import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslationService } from '../../../core/i18n/translation.service';
import { AuthActions } from '../../../core/state/auth/auth.actions';
import { selectCarregando, selectErro } from '../../../core/state/auth/auth.reducer';
import { Button } from '../../../ui/button/button';
import { FormField } from '../../../ui/form-field/form-field';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, Button, FormField],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(TranslationService);

  protected readonly carregando = this.store.selectSignal(selectCarregando);
  protected readonly erro = this.store.selectSignal(selectErro);

  protected readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });

  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const { email, senha } = this.formulario.getRawValue();
    this.store.dispatch(AuthActions.entrarSolicitado({ email, senha }));
  }
}
