import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslationService } from '../../../core/i18n/translation.service';
import { mensagemDoErro } from '../../../core/http/erro';
import { Badge } from '../../../ui/badge/badge';
import { Button } from '../../../ui/button/button';
import { Card } from '../../../ui/card/card';
import { DataTable, type ColunaTabela } from '../../../ui/data-table/data-table';
import { EmptyState } from '../../../ui/empty-state/empty-state';
import { FormField } from '../../../ui/form-field/form-field';
import { ToastService } from '../../../ui/toast/toast.service';
import { GeografiaApiService, type Cidade, type Pais } from '../geografia-api.service';
import { GeografiaCacheService } from '../geografia-cache.service';

@Component({
  selector: 'app-pais-detail-page',
  imports: [ReactiveFormsModule, RouterLink, Card, Button, FormField, EmptyState, DataTable, Badge],
  templateUrl: './pais-detail-page.html',
  styleUrl: './pais-detail-page.css',
})
export class PaisDetailPage implements OnInit {
  private readonly api = inject(GeografiaApiService);
  private readonly cache = inject(GeografiaCacheService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly rotaAtiva = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(TranslationService);

  protected readonly id = this.rotaAtiva.snapshot.paramMap.get('id') ?? 'novo';
  protected readonly ehNovo = this.id === 'novo';
  protected readonly naoEncontrado = signal(false);
  protected readonly enviandoCapa = signal(false);
  protected readonly pais = signal<Pais | null>(null);

  protected readonly cidades = signal<Cidade[]>([]);
  protected readonly colunasCidades: ColunaTabela<Cidade>[] = [{ chave: 'name', titulo: this.i18n.t('geo.colunaNome') }];

  protected readonly formulario = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    iso2: [''],
    iso3: [''],
    isPopular: [false],
    popularSort: [0],
  });

  ngOnInit(): void {
    if (this.ehNovo) return;
    const registrado = this.cache.pais(this.id);
    if (!registrado) {
      this.naoEncontrado.set(true);
      return;
    }
    this.pais.set(registrado);
    this.formulario.patchValue({
      name: registrado.name,
      iso2: registrado.iso2 ?? '',
      iso3: registrado.iso3 ?? '',
      isPopular: registrado.isPopular,
      popularSort: registrado.popularSort,
    });
    this.carregarCidades();
  }

  private carregarCidades(): void {
    this.api.listarCidades(1, undefined, this.id).subscribe({
      next: (res) => this.cidades.set(res.items),
      error: () => {},
    });
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    const corpo = { name: valores.name, iso2: valores.iso2 || undefined, iso3: valores.iso3 || undefined, isPopular: valores.isPopular, popularSort: valores.popularSort };
    const pedido = this.ehNovo ? this.api.criarPais(corpo) : this.api.editarPais(this.id, corpo);
    pedido.subscribe({
      next: (gravado) => {
        this.cache.registrarPais(gravado);
        this.toast.mostrar(this.i18n.t('geo.salvo'), { tom: 'sucesso' });
        if (this.ehNovo) this.router.navigate(['/geografia/paises', gravado.id]);
        else this.pais.set(gravado);
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  enviarCapa(evento: Event): void {
    const arquivo = (evento.target as HTMLInputElement).files?.[0];
    if (!arquivo || this.ehNovo) return;
    this.enviandoCapa.set(true);
    this.api.enviarCapaPais(this.id, arquivo).subscribe({
      next: (gravado) => {
        this.cache.registrarPais(gravado);
        this.pais.set(gravado);
        this.enviandoCapa.set(false);
        this.toast.mostrar(this.i18n.t('geo.capaEnviada'), { tom: 'sucesso' });
      },
      error: (erro: HttpErrorResponse) => {
        this.enviandoCapa.set(false);
        this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' });
      },
    });
  }

  urlCapa(): string | null {
    const atual = this.pais();
    return atual?.coverStorageKey ? this.api.urlCapaPais(atual.id) : null;
  }

  abrirCidade(cidade: Cidade): void {
    this.cache.registrarCidade(cidade);
    this.router.navigate(['/geografia/cidades', cidade.id]);
  }
}
