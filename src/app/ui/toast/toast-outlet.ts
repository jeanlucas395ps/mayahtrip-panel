import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'mt-toast-outlet',
  templateUrl: './toast-outlet.html',
  styleUrl: './toast-outlet.css',
})
export class ToastOutlet {
  protected readonly servico = inject(ToastService);

  agir(id: number, aoAgir?: () => void): void {
    aoAgir?.();
    this.servico.remover(id);
  }
}
