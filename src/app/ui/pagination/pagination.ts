import { Component, computed, inject, input, output } from '@angular/core';
import { TranslationService } from '../../core/i18n/translation.service';

@Component({
  selector: 'mt-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  protected readonly i18n = inject(TranslationService);

  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly anterior = output<void>();
  readonly proxima = output<void>();

  readonly podeVoltar = computed(() => this.pagina() > 1);
  readonly podeAvancar = computed(() => this.pagina() < this.totalPaginas());
}
