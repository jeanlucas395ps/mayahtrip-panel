import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Avatar } from '../../../ui/avatar/avatar';
import { Icon } from '../../../ui/icon/icon';
import { AuthActions } from '../../state/auth/auth.actions';
import { selectEmail } from '../../state/auth/auth.reducer';
import { TranslationService } from '../../i18n/translation.service';
import { LOCALES, ROTULO_LOCALE, type Locale } from '../../i18n/locale.model';
import { Breadcrumb } from '../breadcrumb/breadcrumb';

@Component({
  selector: 'app-topbar',
  imports: [Avatar, Icon, Breadcrumb, CdkMenu, CdkMenuItem, CdkMenuTrigger],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly store = inject(Store);
  protected readonly i18n = inject(TranslationService);

  protected readonly locales = LOCALES;
  protected readonly rotuloLocale = ROTULO_LOCALE;
  protected readonly email = this.store.selectSignal(selectEmail);

  mudarIdioma(locale: Locale): void {
    this.i18n.definirLocale(locale);
  }

  sair(): void {
    this.store.dispatch(AuthActions.sairSolicitado());
  }
}
