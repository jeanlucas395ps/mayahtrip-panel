import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslationService } from '../../../core/i18n/translation.service';
import { mensagemDoErro } from '../../../core/http/erro';
import { Button } from '../../../ui/button/button';
import { Card } from '../../../ui/card/card';
import { EmptyState } from '../../../ui/empty-state/empty-state';
import { FormField } from '../../../ui/form-field/form-field';
import { ToastService } from '../../../ui/toast/toast.service';
import { GeografiaApiService, type Cidade, type Pais } from '../geografia-api.service';
import { GeografiaCacheService } from '../geografia-cache.service';

@Component({
  selector: 'app-cidade-detail-page',
  imports: [ReactiveFormsModule, RouterLink, Card, Button, FormField, EmptyState],
  templateUrl: './cidade-detail-page.html',
  styleUrl: './cidade-detail-page.css',
})
export class CidadeDetailPage implements OnInit {
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
  protected readonly cidade = signal<Cidade | null>(null);

  protected readonly buscaPais = signal('');
  protected readonly candidatosPais = signal<Pais[]>([]);
  protected readonly paisEscolhido = signal<{ id: string; name: string } | null>(null);
  private temporizadorBusca: ReturnType<typeof setTimeout> | null = null;

  protected readonly formulario = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    latitude: [0],
    longitude: [0],
    isPopular: [false],
    popularSort: [0],
  });

  ngOnInit(): void {
    if (this.ehNovo) return;
    const registrada = this.cache.cidade(this.id);
    if (!registrada) {
      this.naoEncontrado.set(true);
      return;
    }
    this.cidade.set(registrada);
    this.formulario.patchValue({
      name: registrada.name,
      latitude: registrada.latitude ?? 0,
      longitude: registrada.longitude ?? 0,
      isPopular: registrada.isPopular,
      popularSort: registrada.popularSort,
    });
    if (registrada.countryName) this.paisEscolhido.set({ id: registrada.countryId, name: registrada.countryName });
  }

  aoDigitarPais(valor: string): void {
    this.buscaPais.set(valor);
    if (this.temporizadorBusca) clearTimeout(this.temporizadorBusca);
    const consulta = valor.trim();
    if (!consulta) {
      this.candidatosPais.set([]);
      return;
    }
    this.temporizadorBusca = setTimeout(() => {
      this.api.listarPaises(1, consulta).subscribe({ next: (res) => this.candidatosPais.set(res.items), error: () => {} });
    }, 280);
  }

  escolherPais(pais: Pais): void {
    this.paisEscolhido.set({ id: pais.id, name: pais.name });
    this.buscaPais.set('');
    this.candidatosPais.set([]);
  }

  salvar(): void {
    const pais = this.paisEscolhido();
    if (this.formulario.invalid || !pais) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valores = this.formulario.getRawValue();
    const corpo = { name: valores.name, countryId: pais.id, latitude: valores.latitude, longitude: valores.longitude, isPopular: valores.isPopular, popularSort: valores.popularSort };
    const pedido = this.ehNovo ? this.api.criarCidade(corpo) : this.api.editarCidade(this.id, corpo);
    pedido.subscribe({
      next: (gravada) => {
        this.cache.registrarCidade(gravada);
        this.toast.mostrar(this.i18n.t('geo.salvo'), { tom: 'sucesso' });
        if (this.ehNovo) this.router.navigate(['/geografia/cidades', gravada.id]);
        else this.cidade.set(gravada);
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  enviarCapa(evento: Event): void {
    const arquivo = (evento.target as HTMLInputElement).files?.[0];
    if (!arquivo || this.ehNovo) return;
    this.enviandoCapa.set(true);
    this.api.enviarCapaCidade(this.id, arquivo).subscribe({
      next: (gravada) => {
        this.cache.registrarCidade(gravada);
        this.cidade.set(gravada);
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
    const atual = this.cidade();
    return atual?.coverStorageKey ? this.api.urlCapaCidade(atual.id) : null;
  }
}
