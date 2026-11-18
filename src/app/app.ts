import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Locale, TEXTOS } from './textos';

const API = 'http://127.0.0.1:3000/v1/admin';

interface Feature {
  key: string;
  value: string;
}

interface Plano {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isFree: boolean;
  isActive: boolean;
  temPrecoAtivo: boolean;
  preco: { currency: string; billingPeriod: string; amount: number; durationDays: number | null } | null;
  features: Feature[];
}

interface Administrador {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  senha: string;
}

interface CategoriaDoLugar {
  id: string;
  slug: string;
  parentId: string | null;
  translations: { locale: string; name: string }[];
}

interface LugarDoPainel {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cityId: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteUrl: string | null;
  phone: string | null;
  status: 'active' | 'archived';
  translations: { locale: string; name: string | null; description: string | null }[];
  categoryIds: string[];
  addresses: { line1: string | null; neighborhood: string | null; postalCode: string | null; cityId: string | null }[];
  openingHours: { weekday: number; openingTime: string | null; closingTime: string | null; isClosed: boolean }[];
  prices: { currency: string | null; priceLevel: number | null; minimumPrice: number | null; maximumPrice: number | null }[];
  visitInformation: { recommendedDurationMinutes: number | null; bestTimeToVisit: string | null; accessibilityInformation: string | null }[];
  externalReferences: { provider: string; externalId: string; externalUrl: string | null; providerMetadata: Record<string, unknown> | null }[];
  media: { id: string; mediaType: string; attribution: string | null; sortOrder: number | null }[];
}

interface LugarResumo {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'archived';
  cityName: string | null;
}

interface UsuarioDoApp {
  id: string;
  name: string;
  username: string;
  email: string;
  countryId: string | null;
  countryName: string | null;
  locale: string;
  currency: string;
  planCode: string;
  emailVerified: boolean;
  createdAt: string;
  status: 'pending' | 'active' | 'inactive';
  deleted: boolean;
  entrada: 'google' | 'senha' | 'ambos';
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);
  readonly locale = signal<Locale>('pt-BR');
  readonly token = signal(sessionStorage.getItem('painel-token') ?? '');
  readonly tela = signal<'planos' | 'administradores' | 'usuarios' | 'lugares'>('planos');
  readonly planos = signal<Plano[]>([]);
  readonly administradores = signal<Administrador[]>([]);
  readonly erro = signal('');
  readonly editando = signal<Plano | null>(null);
  readonly editandoAdmin = signal<Administrador | null>(null);
  readonly confirmando = signal('');
  readonly usuarios = signal<UsuarioDoApp[]>([]);
  readonly ficha = signal<UsuarioDoApp | null>(null);
  readonly paises = signal<{ id: string; name: string }[]>([]);
  email = '';
  senha = '';
  busca = '';
  filtroAtivo = '';
  filtroVerificado = '';
  filtroEntrada = '';
  filtroPais = '';
  filtroDe = '';
  filtroAte = '';
  readonly lugares = signal<LugarResumo[]>([]);
  readonly categorias = signal<CategoriaDoLugar[]>([]);
  lugarForm: LugarDoPainel | null = null;
  categoriaSlug = '';
  categoriaNome = '';
  origemId = '';

  ngOnInit(): void {
    if (this.token()) this.carregar();
  }

  t(chave: string): string {
    return TEXTOS[this.locale()][chave] ?? chave;
  }

  entrar(): void {
    this.erro.set('');
    this.http.post<{ accessToken: string }>(`${API}/sign-in`, { email: this.email, senha: this.senha }).subscribe({
      next: (resposta) => {
        sessionStorage.setItem('painel-token', resposta.accessToken);
        this.token.set(resposta.accessToken);
        this.carregar();
      },
      error: () => this.erro.set(this.t('erroEntrada')),
    });
  }

  sair(): void {
    this.http.post(`${API}/logout`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.limpar(),
      error: () => this.limpar(),
    });
  }

  abrirPlanos(): void {
    this.erro.set('');
    this.tela.set('planos');
    this.editandoAdmin.set(null);
    if (this.token()) this.carregar();
  }

  abrirAdministradores(): void {
    this.erro.set('');
    this.tela.set('administradores');
    this.editando.set(null);
    this.ficha.set(null);
    if (this.token()) this.carregarAdministradores();
  }

  abrirUsuarios(): void {
    this.erro.set('');
    this.confirmando.set('');
    this.tela.set('usuarios');
    this.editando.set(null);
    this.editandoAdmin.set(null);
    this.lugarForm = null;
    if (this.token()) this.carregarUsuarios();
  }

  abrirLugares(): void {
    this.erro.set('');
    this.confirmando.set('');
    this.tela.set('lugares');
    this.editando.set(null);
    this.editandoAdmin.set(null);
    this.ficha.set(null);
    if (this.token()) {
      this.carregarLugares();
      this.carregarCategorias();
    }
  }

  carregar(): void {
    this.http.get<Plano[]>(`${API}/plans`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.planos.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  carregarAdministradores(): void {
    this.http.get<Administrador[]>(`${API}/administrators`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.administradores.set(lista.map((admin) => ({ ...admin, senha: '' }))),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  novoAdmin(): void {
    this.confirmando.set('');
    this.editandoAdmin.set({ id: '', name: '', email: '', isActive: true, senha: '' });
  }

  abrirAdmin(admin: Administrador): void {
    this.confirmando.set('');
    this.editandoAdmin.set({ ...admin, senha: '' });
  }

  salvarAdmin(admin: Administrador): void {
    const corpo = admin.id
      ? { nome: admin.name, email: admin.email, ...(admin.senha.trim() ? { senha: admin.senha } : {}) }
      : { nome: admin.name, email: admin.email, senha: admin.senha };
    const pedido = admin.id
      ? this.http.patch<Administrador>(`${API}/administrators/${admin.id}`, corpo, { headers: this.cabecalho() })
      : this.http.post<Administrador>(`${API}/administrators`, corpo, { headers: this.cabecalho() });
    pedido.subscribe({
      next: () => {
        this.editandoAdmin.set(null);
        this.carregarAdministradores();
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  ativarAdmin(admin: Administrador, ligar: boolean): void {
    const acao = ligar ? 'activate' : 'deactivate';
    this.http.post(`${API}/administrators/${admin.id}/${acao}`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarAdministradores(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  carregarUsuarios(): void {
    const params: Record<string, string> = {};
    if (this.busca.trim()) params['q'] = this.busca.trim();
    if (this.filtroAtivo) params['ativo'] = this.filtroAtivo;
    if (this.filtroVerificado) params['verificado'] = this.filtroVerificado;
    if (this.filtroEntrada) params['entrada'] = this.filtroEntrada;
    if (this.filtroPais) params['pais'] = this.filtroPais;
    if (this.filtroDe) params['cadastroDe'] = this.filtroDe;
    if (this.filtroAte) params['cadastroAte'] = this.filtroAte;
    this.http.get<UsuarioDoApp[]>(`${API}/users`, { headers: this.cabecalho(), params }).subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        if (!this.filtroPais) {
          const mapa = new Map<string, string>();
          for (const usuario of lista) {
            if (usuario.countryId && usuario.countryName) mapa.set(usuario.countryId, usuario.countryName);
          }
          this.paises.set([...mapa].map(([id, name]) => ({ id, name })));
        }
        const aberta = this.ficha();
        if (aberta) this.ficha.set(lista.find((usuario) => usuario.id === aberta.id) ?? aberta);
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirFicha(usuario: UsuarioDoApp): void {
    this.confirmando.set('');
    this.http.get<UsuarioDoApp>(`${API}/users/${usuario.id}`, { headers: this.cabecalho() }).subscribe({
      next: (ficha) => this.ficha.set(ficha),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  mudarUsuario(usuario: UsuarioDoApp, acao: 'activate' | 'deactivate' | 'restore'): void {
    this.http.post<UsuarioDoApp>(`${API}/users/${usuario.id}/${acao}`, {}, { headers: this.cabecalho() }).subscribe({
      next: (ficha) => {
        this.ficha.set(ficha);
        this.carregarUsuarios();
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  excluirUsuario(usuario: UsuarioDoApp): void {
    if (this.confirmando() !== usuario.id) {
      this.confirmando.set(usuario.id);
      return;
    }
    this.http.delete(`${API}/users/${usuario.id}`, { headers: this.cabecalho() }).subscribe({
      next: () => {
        this.confirmando.set('');
        this.carregarUsuarios();
        this.abrirFicha({ ...usuario, deleted: true });
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  excluirAdmin(admin: Administrador): void {
    if (this.confirmando() !== admin.id) {
      this.confirmando.set(admin.id);
      return;
    }
    this.http.delete(`${API}/administrators/${admin.id}`, { headers: this.cabecalho() }).subscribe({
      next: () => {
        this.confirmando.set('');
        this.editandoAdmin.set(null);
        this.carregarAdministradores();
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  novo(): void {
    this.editando.set({
      id: '',
      code: '',
      name: '',
      description: '',
      isFree: false,
      isActive: false,
      temPrecoAtivo: false,
      preco: { currency: 'BRL', billingPeriod: 'monthly', amount: 0, durationDays: 30 },
      features: [],
    });
  }

  abrir(plano: Plano): void {
    this.editando.set({
      ...plano,
      description: plano.description ?? '',
      preco: plano.preco ?? { currency: 'BRL', billingPeriod: 'monthly', amount: 0, durationDays: 30 },
      features: plano.features.map((feature) => ({ ...feature })),
    });
  }

  adicionarFeature(plano: Plano): void {
    plano.features = [...plano.features, { key: '', value: '' }];
  }

  salvar(plano: Plano): void {
    const corpo = {
      code: plano.code,
      name: plano.name,
      description: plano.description,
      isFree: plano.isFree,
      currency: plano.preco?.currency,
      billingPeriod: plano.isFree ? 'free' : plano.preco?.billingPeriod,
      amount: plano.isFree ? null : plano.preco?.amount,
      durationDays: plano.preco?.durationDays,
      features: plano.features.filter((feature) => feature.key.trim()),
    };
    const pedido = plano.id
      ? this.http.patch<Plano>(`${API}/plans/${plano.id}`, corpo, { headers: this.cabecalho() })
      : this.http.post<Plano>(`${API}/plans`, corpo, { headers: this.cabecalho() });
    pedido.subscribe({
      next: () => {
        this.editando.set(null);
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  ativar(plano: Plano, ligar: boolean): void {
    const acao = ligar ? 'activate' : 'deactivate';
    this.http.post(`${API}/plans/${plano.id}/${acao}`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregar(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  carregarLugares(): void {
    const params: Record<string, string> = {};
    if (this.busca.trim()) params['q'] = this.busca.trim();
    this.http.get<LugarResumo[]>(`${API}/places`, { headers: this.cabecalho(), params }).subscribe({
      next: (lista) => this.lugares.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  carregarCategorias(): void {
    this.http.get<CategoriaDoLugar[]>(`${API}/place-categories`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.categorias.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  novoLugar(): void {
    this.origemId = '';
    this.lugarForm = lugarVazio();
  }

  abrirLugar(id: string): void {
    this.http.get<LugarDoPainel>(`${API}/places/${id}`, { headers: this.cabecalho() }).subscribe({
      next: (lugar) => {
        this.lugarForm = lugar;
        this.origemId = '';
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  salvarLugar(): void {
    const lugar = this.lugarForm;
    if (!lugar) return;
    const corpo = {
      slug: lugar.slug,
      name: lugar.name,
      description: lugar.description,
      cityId: lugar.cityId,
      latitude: lugar.latitude,
      longitude: lugar.longitude,
      websiteUrl: lugar.websiteUrl,
      phone: lugar.phone,
      status: lugar.status,
      translations: lugar.translations,
      categoryIds: lugar.categoryIds,
      addresses: lugar.addresses,
      openingHours: lugar.openingHours,
      prices: lugar.prices,
      visitInformation: lugar.visitInformation,
      externalReferences: lugar.externalReferences,
    };
    const pedido = lugar.id
      ? this.http.patch<LugarDoPainel>(`${API}/places/${lugar.id}`, corpo, { headers: this.cabecalho() })
      : this.http.post<LugarDoPainel>(`${API}/places`, corpo, { headers: this.cabecalho() });
    pedido.subscribe({
      next: (gravado) => {
        this.erro.set('');
        this.lugarForm = gravado;
        this.carregarLugares();
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  arquivarLugar(): void {
    const lugar = this.lugarForm;
    if (!lugar?.id) return;
    this.http.post<LugarDoPainel>(`${API}/places/${lugar.id}/archive`, {}, { headers: this.cabecalho() }).subscribe({
      next: (gravado) => {
        this.erro.set('');
        this.lugarForm = gravado;
        this.carregarLugares();
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  unificarLugar(): void {
    const lugar = this.lugarForm;
    if (!lugar?.id || !this.origemId) return;
    this.http.post<LugarDoPainel>(`${API}/places/${lugar.id}/merge`, { origemId: this.origemId }, { headers: this.cabecalho() }).subscribe({
      next: (gravado) => {
        this.erro.set('');
        this.lugarForm = gravado;
        this.origemId = '';
        this.carregarLugares();
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  salvarCategoria(): void {
    if (!this.categoriaSlug.trim() || !this.categoriaNome.trim()) return;
    this.http
      .post(`${API}/place-categories`, { slug: this.categoriaSlug.trim(), translations: [{ locale: 'pt-BR', name: this.categoriaNome.trim() }] }, { headers: this.cabecalho() })
      .subscribe({
        next: () => {
          this.erro.set('');
          this.categoriaSlug = '';
          this.categoriaNome = '';
          this.carregarCategorias();
        },
        error: (erro: HttpErrorResponse) => this.falha(erro),
      });
  }

  alternarCategoria(id: string): void {
    const lugar = this.lugarForm;
    if (!lugar) return;
    lugar.categoryIds = lugar.categoryIds.includes(id) ? lugar.categoryIds.filter((item) => item !== id) : [...lugar.categoryIds, id];
  }

  adicionarEndereco(): void {
    this.lugarForm?.addresses.push({ line1: '', neighborhood: '', postalCode: '', cityId: null });
  }

  adicionarHorario(): void {
    this.lugarForm?.openingHours.push({ weekday: 1, openingTime: '09:00', closingTime: '18:00', isClosed: false });
  }

  adicionarPreco(): void {
    this.lugarForm?.prices.push({ currency: 'BRL', priceLevel: null, minimumPrice: null, maximumPrice: null });
  }

  adicionarVisita(): void {
    this.lugarForm?.visitInformation.push({ recommendedDurationMinutes: null, bestTimeToVisit: '', accessibilityInformation: '' });
  }

  adicionarReferencia(): void {
    this.lugarForm?.externalReferences.push({ provider: '', externalId: '', externalUrl: '', providerMetadata: null });
  }

  adicionarTraducao(): void {
    this.lugarForm?.translations.push({ locale: 'pt-BR', name: '', description: '' });
  }

  enviarMidia(evento: Event): void {
    const lugar = this.lugarForm;
    const arquivo = (evento.target as HTMLInputElement).files?.[0];
    if (!lugar?.id || !arquivo) return;
    const dados = new FormData();
    dados.set('arquivo', arquivo);
    this.http.post(`${API}/places/${lugar.id}/media`, dados, { headers: this.cabecalho() }).subscribe({
      next: () => this.abrirLugar(lugar.id),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  private cabecalho(): { Authorization: string } {
    return { Authorization: `Bearer ${this.token()}` };
  }

  private falha(erro: HttpErrorResponse): void {
    if (erro.status === 401 && this.token()) {
      this.limpar();
      this.erro.set(this.t('erroEntrada'));
      return;
    }
    this.erro.set(mensagem(erro));
  }

  private limpar(): void {
    sessionStorage.removeItem('painel-token');
    this.token.set('');
    this.planos.set([]);
    this.administradores.set([]);
    this.usuarios.set([]);
    this.lugares.set([]);
    this.categorias.set([]);
    this.lugarForm = null;
    this.ficha.set(null);
    this.editando.set(null);
    this.editandoAdmin.set(null);
  }
}

function lugarVazio(): LugarDoPainel {
  return {
    id: '',
    slug: '',
    name: '',
    description: '',
    cityId: null,
    latitude: null,
    longitude: null,
    websiteUrl: '',
    phone: '',
    status: 'active',
    translations: [{ locale: 'pt-BR', name: '', description: '' }],
    categoryIds: [],
    addresses: [],
    openingHours: [],
    prices: [],
    visitInformation: [],
    externalReferences: [],
    media: [],
  };
}

function mensagem(erro: HttpErrorResponse): string {
  const corpo = erro.error as { message?: string } | null;
  return corpo?.message ?? 'Erro';
}
