import { toSignal } from '@angular/core/rxjs-interop';
import { Component, inject } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { TranslationService } from '../../i18n/translation.service';

function folhaAtiva(raiz: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  let atual = raiz;
  while (atual.firstChild) atual = atual.firstChild;
  return atual;
}

/** Lê `Router.routerState` (estado global) em vez de um `ActivatedRoute`
 * injetado localmente: `Breadcrumb` não é ela mesma roteada (vive dentro do
 * template do `AppShell`), e o `ActivatedRoute` de um componente assim não
 * tem `snapshot` garantido no momento da construção. */
@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class Breadcrumb {
  private readonly router = inject(Router);
  protected readonly i18n = inject(TranslationService);

  protected readonly tituloChave = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map(() => folhaAtiva(this.router.routerState.snapshot.root).data['titulo'] as string | undefined),
      startWith(folhaAtiva(this.router.routerState.snapshot.root).data['titulo'] as string | undefined),
    ),
    { initialValue: undefined },
  );
}
