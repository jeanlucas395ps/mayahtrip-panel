import { Component, input } from '@angular/core';

@Component({
  selector: 'mt-form-field',
  templateUrl: './form-field.html',
  styleUrl: './form-field.css',
})
export class FormField {
  readonly rotulo = input.required<string>();
  readonly dica = input<string | null>(null);
  readonly erro = input<string | null>(null);
  readonly obrigatorio = input(false);
}
