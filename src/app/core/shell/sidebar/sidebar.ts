import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { Icon } from '../../../ui/icon/icon';
import { NAV } from '../nav.model';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  protected readonly i18n = inject(TranslationService);
  protected readonly grupos = NAV;
}
