import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslationService } from '../../../core/i18n/translation.service';
import { mensagemDoErro } from '../../../core/http/erro';
import { Badge } from '../../../ui/badge/badge';
import { Button } from '../../../ui/button/button';
import { Card } from '../../../ui/card/card';
import { EmptyState } from '../../../ui/empty-state/empty-state';
import { FormField } from '../../../ui/form-field/form-field';
import { ToastService } from '../../../ui/toast/toast.service';
import {
  LugaresApiService,
  type CategoriaLugar,
  type CidadeResumo,
  type CorpoLugar,
  type EnderecoLugar,
  type HorarioLugar,
  type IdiomaCatalogo,
  type LugarCompleto,
  type PrecoLugar,
  type ReferenciaLugar,
  type StatusLugar,
  type TraducaoLugar,
  type VisitaLugar,
} from '../lugares-api.service';

const LOCALES: IdiomaCatalogo[] = ['pt-BR', 'pt-PT', 'en', 'es'];

@Component({
  selector: 'app-lugar-detail-page',
  imports: [ReactiveFormsModule, RouterLink, Card, Button, FormField, EmptyState, Badge],
  templateUrl: './lugar-detail-page.html',
  styleUrl: './lugar-detail-page.css',
})
export class LugarDetailPage implements OnInit {
  private readonly api = inject(LugaresApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly rotaAtiva = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(TranslationService);

  protected readonly id = this.rotaAtiva.snapshot.paramMap.get('id') ?? 'novo';
  protected readonly ehNovo = this.id === 'novo';
  protected readonly carregando = signal(!this.ehNovo);
  protected readonly naoEncontrado = signal(false);
  protected readonly lugar = signal<LugarCompleto | null>(null);
  protected readonly categorias = signal<CategoriaLugar[]>([]);
  protected readonly enviandoMidia = signal(false);
  protected readonly origemUnificar = signal('');

  protected readonly locales = LOCALES;
  protected readonly diasSemana = [
    { valor: 0, chave: 'lugares.dom' },
    { valor: 1, chave: 'lugares.seg' },
    { valor: 2, chave: 'lugares.ter' },
    { valor: 3, chave: 'lugares.qua' },
    { valor: 4, chave: 'lugares.qui' },
    { valor: 5, chave: 'lugares.sex' },
    { valor: 6, chave: 'lugares.sab' },
  ];

  protected readonly buscaCidade = signal('');
  protected readonly candidatosCidade = signal<CidadeResumo[]>([]);
  protected readonly cidadeEscolhida = signal<{ id: string; nome: string } | null>(null);
  protected readonly cidadeIdAtualSemNome = signal<string | null>(null);
  private temporizadorCidade: ReturnType<typeof setTimeout> | null = null;

  protected readonly formulario = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    slug: ['', [Validators.required, Validators.maxLength(180)]],
    description: [''],
    latitude: [0],
    longitude: [0],
    websiteUrl: [''],
    phone: [''],
    status: ['active' as StatusLugar],
    categoryIds: this.fb.nonNullable.control<string[]>([]),
    translations: this.fb.array(LOCALES.map((locale) => this.novaTraducao({ locale, name: null, description: null }))),
    addresses: this.fb.array<ReturnType<typeof this.novoEndereco>>([]),
    openingHours: this.fb.array<ReturnType<typeof this.novoHorario>>([]),
    prices: this.fb.array<ReturnType<typeof this.novoPreco>>([]),
    visitInformation: this.fb.array<ReturnType<typeof this.novaVisita>>([]),
    externalReferences: this.fb.array<ReturnType<typeof this.novaReferencia>>([]),
  });

  ngOnInit(): void {
    this.api.categorias().subscribe({
      next: (lista) => this.categorias.set(lista),
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
    if (this.ehNovo) return;
    this.carregarFicha();
  }

  private carregarFicha(): void {
    this.carregando.set(true);
    this.api.ficha(this.id).subscribe({
      next: (lugar) => {
        this.lugar.set(lugar);
        this.preencherFormulario(lugar);
        this.carregando.set(false);
      },
      error: (erro: HttpErrorResponse) => {
        if (erro.status === 404) this.naoEncontrado.set(true);
        else this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' });
        this.carregando.set(false);
      },
    });
  }

  private preencherFormulario(lugar: LugarCompleto): void {
    this.formulario.patchValue({
      name: lugar.name,
      slug: lugar.slug,
      description: lugar.description ?? '',
      latitude: lugar.latitude ?? 0,
      longitude: lugar.longitude ?? 0,
      websiteUrl: lugar.websiteUrl ?? '',
      phone: lugar.phone ?? '',
      status: lugar.status,
    });
    this.formulario.controls.categoryIds.setValue(lugar.categoryIds);
    if (lugar.cityId) this.cidadeIdAtualSemNome.set(lugar.cityId);

    const traducoesPorLocale = new Map(lugar.translations.map((t) => [t.locale, t]));
    this.formulario.controls.translations.clear();
    for (const locale of LOCALES) {
      this.formulario.controls.translations.push(this.novaTraducao(traducoesPorLocale.get(locale) ?? { locale, name: null, description: null }));
    }

    this.formulario.controls.addresses.clear();
    for (const item of lugar.addresses) this.formulario.controls.addresses.push(this.novoEndereco(item));

    this.formulario.controls.openingHours.clear();
    for (const item of lugar.openingHours) this.formulario.controls.openingHours.push(this.novoHorario(item));

    this.formulario.controls.prices.clear();
    for (const item of lugar.prices) this.formulario.controls.prices.push(this.novoPreco(item));

    this.formulario.controls.visitInformation.clear();
    for (const item of lugar.visitInformation) this.formulario.controls.visitInformation.push(this.novaVisita(item));

    this.formulario.controls.externalReferences.clear();
    for (const item of lugar.externalReferences) this.formulario.controls.externalReferences.push(this.novaReferencia(item));
  }

  private novaTraducao(dados: TraducaoLugar) {
    return this.fb.nonNullable.group({
      locale: [dados.locale],
      name: [dados.name ?? ''],
      description: [dados.description ?? ''],
    });
  }

  private novoEndereco(dados?: EnderecoLugar) {
    return this.fb.nonNullable.group({
      line1: [dados?.line1 ?? ''],
      neighborhood: [dados?.neighborhood ?? ''],
      postalCode: [dados?.postalCode ?? ''],
    });
  }

  private novoHorario(dados?: HorarioLugar) {
    return this.fb.nonNullable.group({
      weekday: [dados?.weekday ?? 1],
      openingTime: [dados?.openingTime ?? '09:00'],
      closingTime: [dados?.closingTime ?? '18:00'],
      isClosed: [dados?.isClosed ?? false],
    });
  }

  private novoPreco(dados?: PrecoLugar) {
    return this.fb.nonNullable.group({
      currency: [dados?.currency ?? 'BRL'],
      priceLevel: [dados?.priceLevel ?? 1],
      minimumPrice: [dados?.minimumPrice ?? 0],
      maximumPrice: [dados?.maximumPrice ?? 0],
    });
  }

  private novaVisita(dados?: VisitaLugar) {
    return this.fb.nonNullable.group({
      recommendedDurationMinutes: [dados?.recommendedDurationMinutes ?? 60],
      bestTimeToVisit: [dados?.bestTimeToVisit ?? ''],
      accessibilityInformation: [dados?.accessibilityInformation ?? ''],
    });
  }

  private novaReferencia(dados?: ReferenciaLugar) {
    return this.fb.nonNullable.group({
      provider: [dados?.provider ?? '', Validators.required],
      externalId: [dados?.externalId ?? '', Validators.required],
      externalUrl: [dados?.externalUrl ?? ''],
    });
  }

  adicionarEndereco(): void {
    this.formulario.controls.addresses.push(this.novoEndereco());
  }

  removerEndereco(indice: number): void {
    this.formulario.controls.addresses.removeAt(indice);
  }

  adicionarHorario(): void {
    this.formulario.controls.openingHours.push(this.novoHorario());
  }

  removerHorario(indice: number): void {
    this.formulario.controls.openingHours.removeAt(indice);
  }

  adicionarPreco(): void {
    this.formulario.controls.prices.push(this.novoPreco());
  }

  removerPreco(indice: number): void {
    this.formulario.controls.prices.removeAt(indice);
  }

  adicionarVisita(): void {
    this.formulario.controls.visitInformation.push(this.novaVisita());
  }

  removerVisita(indice: number): void {
    this.formulario.controls.visitInformation.removeAt(indice);
  }

  adicionarReferencia(): void {
    this.formulario.controls.externalReferences.push(this.novaReferencia());
  }

  removerReferencia(indice: number): void {
    this.formulario.controls.externalReferences.removeAt(indice);
  }

  alternarCategoria(id: string): void {
    const atual = this.formulario.controls.categoryIds.value;
    this.formulario.controls.categoryIds.setValue(atual.includes(id) ? atual.filter((c) => c !== id) : [...atual, id]);
  }

  nomeDaCategoria(categoria: CategoriaLugar): string {
    const traducao = categoria.translations.find((t) => t.locale === this.i18n.locale()) ?? categoria.translations.find((t) => t.locale === 'pt-BR');
    return traducao?.name ?? categoria.slug;
  }

  aoDigitarCidade(valor: string): void {
    this.buscaCidade.set(valor);
    if (this.temporizadorCidade) clearTimeout(this.temporizadorCidade);
    const consulta = valor.trim();
    if (!consulta) {
      this.candidatosCidade.set([]);
      return;
    }
    this.temporizadorCidade = setTimeout(() => {
      this.api.buscarCidades(consulta).subscribe({ next: (lista) => this.candidatosCidade.set(lista), error: () => {} });
    }, 280);
  }

  escolherCidade(cidade: CidadeResumo): void {
    this.cidadeEscolhida.set({ id: cidade.id, nome: cidade.countryName ? `${cidade.name} · ${cidade.countryName}` : cidade.name });
    this.cidadeIdAtualSemNome.set(null);
    this.buscaCidade.set('');
    this.candidatosCidade.set([]);
  }

  limparCidade(): void {
    this.cidadeEscolhida.set(null);
    this.cidadeIdAtualSemNome.set(null);
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    const cidadeId = this.cidadeEscolhida()?.id ?? this.cidadeIdAtualSemNome() ?? null;
    const corpo: CorpoLugar = {
      name: v.name,
      slug: v.slug,
      description: v.description || null,
      cityId: cidadeId,
      latitude: v.latitude || null,
      longitude: v.longitude || null,
      websiteUrl: v.websiteUrl || null,
      phone: v.phone || null,
      status: v.status,
      categoryIds: v.categoryIds,
      translations: v.translations.filter((t) => t.name?.trim() || t.description?.trim()).map((t) => ({ locale: t.locale, name: t.name || null, description: t.description || null })),
      addresses: v.addresses.map((a) => ({ line1: a.line1 || null, neighborhood: a.neighborhood || null, postalCode: a.postalCode || null, cityId: cidadeId })),
      openingHours: v.openingHours.map((h) => ({ weekday: h.weekday, openingTime: h.isClosed ? null : h.openingTime, closingTime: h.isClosed ? null : h.closingTime, isClosed: h.isClosed })),
      prices: v.prices.map((p) => ({ currency: p.currency || null, priceLevel: p.priceLevel ?? null, minimumPrice: p.minimumPrice ?? null, maximumPrice: p.maximumPrice ?? null })),
      visitInformation: v.visitInformation.map((i) => ({ recommendedDurationMinutes: i.recommendedDurationMinutes ?? null, bestTimeToVisit: i.bestTimeToVisit || null, accessibilityInformation: i.accessibilityInformation || null })),
      externalReferences: v.externalReferences.map((r) => ({ provider: r.provider, externalId: r.externalId, externalUrl: r.externalUrl || null, providerMetadata: null })),
    };

    const pedido = this.ehNovo ? this.api.criar(corpo) : this.api.editar(this.id, corpo);
    pedido.subscribe({
      next: (gravado) => {
        this.toast.mostrar(this.i18n.t('lugares.salvo'), { tom: 'sucesso' });
        if (this.ehNovo) this.router.navigate(['/lugares', gravado.id]);
        else {
          this.lugar.set(gravado);
          this.preencherFormulario(gravado);
        }
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  arquivar(): void {
    this.api.arquivar(this.id).subscribe({
      next: (gravado) => {
        this.lugar.set(gravado);
        this.formulario.controls.status.setValue(gravado.status);
        this.toast.mostrar(this.i18n.t('lugares.arquivado'), { tom: 'sucesso' });
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  unificar(): void {
    const origemId = this.origemUnificar().trim();
    if (!origemId) return;
    this.api.unificar(this.id, origemId).subscribe({
      next: (gravado) => {
        this.lugar.set(gravado);
        this.preencherFormulario(gravado);
        this.origemUnificar.set('');
        this.toast.mostrar(this.i18n.t('lugares.salvo'), { tom: 'sucesso' });
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  enviarMidia(evento: Event): void {
    const arquivo = (evento.target as HTMLInputElement).files?.[0];
    if (!arquivo || this.ehNovo) return;
    this.enviandoMidia.set(true);
    this.api.enviarMidia(this.id, arquivo).subscribe({
      next: () => {
        this.enviandoMidia.set(false);
        this.toast.mostrar(this.i18n.t('lugares.midiaEnviada'), { tom: 'sucesso' });
        this.carregarFicha();
      },
      error: (erro: HttpErrorResponse) => {
        this.enviandoMidia.set(false);
        this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' });
      },
    });
  }

  removerMidia(mediaId: string): void {
    this.api.removerMidia(this.id, mediaId).subscribe({
      next: () => {
        this.toast.mostrar(this.i18n.t('lugares.midiaRemovida'));
        this.carregarFicha();
      },
      error: (erro: HttpErrorResponse) => this.toast.mostrar(mensagemDoErro(erro, this.i18n.t('comum.erroGenerico')), { tom: 'erro' }),
    });
  }

  urlMidia(mediaId: string): string {
    return this.api.urlMidia(this.id, mediaId);
  }
}
