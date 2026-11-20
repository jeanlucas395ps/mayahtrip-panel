import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GRUPOS, TelaPainel } from './navegacao';
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

interface CidadeResumo {
  id: string;
  name: string;
  countryName: string | null;
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
  averageRating: number | null;
  totalReviews: number;
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

interface ItemDaMala {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  sortOrder: number;
}

interface CategoriaDaMala {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  items: ItemDaMala[];
}

interface ViagemPainel {
  id: string;
  title: string;
  ownerName: string;
  ownerEmail: string;
  destinations: string[];
  startDate: string | null;
  endDate: string | null;
  status: string;
  startMode: string;
  isActive: boolean;
  visibility: string;
  participants: { displayName: string; role: string | null; partyKind: string }[];
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

interface ResumoPainel {
  totals: { trips: number; users: number; admins: number; itineraries: number; agents: number };
  users: { day: string; total: number }[];
  trips: { day: string; total: number }[];
  acquisitions: { free: number; pro: number };
  activePro: number;
  queues: { itinerary: ContagemFila; notification: ContagemFila; ingestion: ContagemFila };
  workers: { itinerary: string; notification: string; ingestion: string };
}

interface ContagemFila {
  pending: number;
  processing: number;
  failed: number;
}

interface FinanceiroPainel {
  currencies: { currency: string; paid: number; pending: number; refunded: number; net: number }[];
  subscriptions: { status: string; total: number }[];
  months: { currency: string; month: number; total: number; projected: boolean }[];
}

interface FontePainel {
  id: string;
  name: string;
  isActive: boolean;
  canStore: boolean;
  canRepublish: boolean;
  licenseLabel: string;
}

interface ItemHub {
  id: string;
  title: string | null;
  status: string;
  sourceName: string;
  placeId: string | null;
  publicationId: string | null;
}

interface FilasPainel {
  workers: { itinerary: string; notification: string; ingestion: string };
  itinerary: ContagemFila & { jobs: JobFila[] };
  notification: ContagemFila & { jobs: JobFila[] };
  ingestion: ContagemFila & { jobs: JobFila[] };
}

interface JobFila {
  id: string;
  status: string;
  createdAt: string;
}

interface CorridaPainel {
  id: string;
  status: string;
  finishedAt: string | null;
  result: { expired?: number } | null;
}

interface AjustePainel {
  key: string;
  value: number;
  description: string;
  min: number;
  max: number;
}

interface BandeiraPainel {
  id: string;
  flagKey: string;
  description: string | null;
  isEnabled: boolean;
}

interface SaudePainel {
  services: { name: string; status: string; detail: string | null }[];
  host: { cpu: number | null; memory: number | null; disk: number | null };
  integrationFailures: { id: string; provider: string; operation: string; createdAt: string }[];
  apiErrors: unknown[];
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
  readonly grupos = GRUPOS;
  readonly grupoAberto = signal('gPrincipal');
  readonly tela = signal<TelaPainel>('inicio');
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
  lugarPagina = 1;
  lugarTotal = 0;
  readonly lugarPageSize = 10;
  readonly categorias = signal<CategoriaDoLugar[]>([]);
  readonly viagens = signal<ViagemPainel[]>([]);
  readonly mala = signal<CategoriaDaMala[]>([]);
  readonly denuncias = signal<DenunciaPainel[]>([]);
  readonly publicacoes = signal<PublicacaoPainel[]>([]);
  readonly fichaViagem = signal<ViagemPainel | null>(null);
  viagemBusca = '';
  viagemDono = '';
  viagemDestino = '';
  viagemStatus = '';
  viagemModo = '';
  viagemDe = '';
  viagemAte = '';
  viagemSoAtivas = false;
  viagemSoPublicas = false;
  lugarForm: LugarDoPainel | null = null;
  lugarStatus = '';
  cidadeBusca = '';
  readonly cidades = signal<CidadeResumo[]>([]);
  midiaAtribuicao = '';
  midiaOrdem: number | null = null;
  categoriaSlug = '';
  categoriaNome = '';
  origemId = '';
  readonly diasSemana = [
    { valor: 0, rotulo: 'dom' },
    { valor: 1, rotulo: 'seg' },
    { valor: 2, rotulo: 'ter' },
    { valor: 3, rotulo: 'qua' },
    { valor: 4, rotulo: 'qui' },
    { valor: 5, rotulo: 'sex' },
    { valor: 6, rotulo: 'sab' },
  ];
  denunciaStatus = '';
  publicacaoBusca = '';
  publicacaoDe = '';
  publicacaoAte = '';
  publicacaoStatus = '';
  readonly cupons = signal<CupomPainel[]>([]);
  readonly promocoes = signal<PromoPainel[]>([]);
  readonly promoPessoas = signal<UsuarioDoApp[]>([]);
  readonly agentes = signal<AgentePainel[]>([]);
  readonly sandboxResposta = signal('');
  readonly pagamentos = signal<PagamentoPainel[]>([]);
  readonly assinaturas = signal<AssinaturaPainel[]>([]);
  readonly elegiveis = signal<ElegivelPainel[]>([]);
  readonly metodos = signal<MetodoPainel[]>([]);
  readonly chamadas = signal<LogPainel[]>([]);
  readonly webhooks = signal<EventoPainel[]>([]);
  readonly resumo = signal<ResumoPainel | null>(null);
  readonly financeiro = signal<FinanceiroPainel | null>(null);
  readonly fontes = signal<FontePainel[]>([]);
  readonly itensHub = signal<ItemHub[]>([]);
  readonly filasPainel = signal<FilasPainel | null>(null);
  readonly corridas = signal<CorridaPainel[]>([]);
  readonly ajustes = signal<AjustePainel[]>([]);
  readonly bandeiras = signal<BandeiraPainel[]>([]);
  readonly saude = signal<SaudePainel | null>(null);
  periodoDe = new Date().toISOString().slice(0, 10);
  periodoAte = new Date().toISOString().slice(0, 10);
  anoPainel = new Date().getFullYear();
  coletaTitulo = '';
  coletaUrl = '';
  fonteId = '';
  lugarAssociado = '';
  licencaNome = '';
  bandeiraChave = '';
  cupomCodigo = '';
  cupomDias = 30;
  cupomValidade = '';
  cupomAtivo = true;
  cupomId = '';
  promoBusca = '';
  agente: AgentePainel = agenteVazio();
  sandboxPergunta = '';
  pagamentoStatus = '';
  pagamentoEmail = '';
  pagamentoDe = '';
  pagamentoAte = '';
  assinaturaEmail = '';
  assinaturaStatus = '';
  janelaTeste = 7;
  janelaDuplicada = 60;
  contaNome = '';
  contaReferencia = '';

  ngOnInit(): void {
    if (this.token()) this.abrir('inicio');
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
        this.abrir('inicio');
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

  alternarGrupo(titulo: string): void {
    this.grupoAberto.update((atual) => (atual === titulo ? '' : titulo));
  }

  grupoDaTela(): string {
    if (this.tela() === 'lugar') return 'gViagens';
    return this.grupos.find((grupo) => (grupo.itens as readonly string[]).includes(this.tela()))?.titulo ?? 'gPrincipal';
  }

  abrir(destino: TelaPainel): void {
    const grupo = this.grupos.find((item) => (item.itens as readonly string[]).includes(destino));
    if (grupo) this.grupoAberto.set(grupo.titulo);
    const mapa: Record<TelaPainel, () => void> = {
      inicio: () => this.abrirInicio(),
      financeiro: () => this.abrirFinanceiro(),
      saude: () => this.abrirSaude(),
      usuarios: () => this.abrirUsuarios(),
      administradores: () => this.abrirAdministradores(),
      lugares: () => this.abrirLugares(),
      lugar: () => this.abrirLugares(),
      viagens: () => this.abrirViagens(),
      mala: () => this.abrirMala(),
      publicacoes: () => this.abrirPublicacoes(),
      denuncias: () => this.abrirDenuncias(),
      hub: () => this.abrirHub(),
      planos: () => this.abrirPlanos(),
      cupons: () => this.abrirCupons(),
      pro: () => this.abrirPro(),
      pagamentos: () => this.abrirPagamentos(),
      assinaturas: () => this.abrirAssinaturas(),
      estorno: () => this.abrirEstorno(),
      metodos: () => this.abrirMetodos(),
      logs: () => this.abrirLogs(),
      expiracao: () => this.abrirExpiracao(),
      maya: () => this.abrirMaya(),
      filas: () => this.abrirFilas(),
      ajustes: () => this.abrirAjustes(),
    };
    mapa[destino]();
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

  abrirMala(): void {
    this.erro.set('');
    this.tela.set('mala');
    this.editando.set(null);
    this.ficha.set(null);
    this.fichaViagem.set(null);
    this.lugarForm = null;
    if (this.token()) this.carregarMala();
  }

  abrirDenuncias(): void {
    this.erro.set('');
    this.tela.set('denuncias');
    this.editando.set(null);
    this.ficha.set(null);
    this.fichaViagem.set(null);
    this.lugarForm = null;
    if (this.token()) this.carregarDenuncias();
  }

  carregarDenuncias(): void {
    const params: Record<string, string> = {};
    if (this.denunciaStatus) params['status'] = this.denunciaStatus;
    this.http.get<DenunciaPainel[]>(`${API}/reports`, { headers: this.cabecalho(), params }).subscribe({
      next: (lista) => this.denuncias.set(lista.map((item) => ({ ...item, removeContent: false, deactivateAccount: false }))),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  assumirDenuncia(id: string): void {
    this.http.post(`${API}/reports/${id}/claim`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarDenuncias(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  julgarDenuncia(item: DenunciaPainel, decision: 'resolved' | 'dismissed'): void {
    this.http
      .post(`${API}/reports/${item.id}/resolve`, {
        decision,
        removeContent: decision === 'resolved' && item.removeContent,
        deactivateAccount: decision === 'resolved' && item.deactivateAccount,
      }, { headers: this.cabecalho() })
      .subscribe({
        next: () => this.carregarDenuncias(),
        error: (erro: HttpErrorResponse) => this.falha(erro),
      });
  }

  abrirPublicacoes(): void {
    this.erro.set('');
    this.tela.set('publicacoes');
    this.editando.set(null);
    this.ficha.set(null);
    this.fichaViagem.set(null);
    this.lugarForm = null;
    if (this.token()) this.carregarPublicacoes();
  }

  carregarPublicacoes(): void {
    const params: Record<string, string> = {};
    if (this.publicacaoBusca.trim()) params['q'] = this.publicacaoBusca.trim();
    if (this.publicacaoDe) params['from'] = this.publicacaoDe;
    if (this.publicacaoAte) params['to'] = this.publicacaoAte;
    if (this.publicacaoStatus) params['status'] = this.publicacaoStatus;
    this.http.get<PublicacaoPainel[]>(`${API}/publications`, { headers: this.cabecalho(), params }).subscribe({
      next: (lista) => this.publicacoes.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  alterarPublicacao(id: string, remover: boolean): void {
    this.http.post(`${API}/publications/${id}/${remover ? 'remove' : 'restore'}`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarPublicacoes(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  alterarComentario(id: string, remover: boolean): void {
    this.http.post(`${API}/comments/${id}/${remover ? 'remove' : 'restore'}`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarPublicacoes(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  rotuloDenuncia(status: string): string {
    if (status === 'pending') return this.t('aberta');
    if (status === 'reviewing') return this.t('emAnalise');
    if (status === 'resolved') return this.t('procedente');
    return this.t('improcedente');
  }

  carregarMala(): void {
    this.http.get<CategoriaDaMala[]>(`${API}/packing`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.mala.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  salvarItem(categoria: CategoriaDaMala, item: ItemDaMala): void {
    this.http
      .patch<CategoriaDaMala[]>(`${API}/packing/items/${item.id}`, {
        name: item.name,
        description: item.description,
        sortOrder: item.sortOrder,
        isDefault: item.isDefault,
        categoryId: categoria.id,
      }, { headers: this.cabecalho() })
      .subscribe({
        next: (lista) => this.mala.set(lista),
        error: (erro: HttpErrorResponse) => this.falha(erro),
      });
  }

  abrirViagens(): void {
    this.erro.set('');
    this.tela.set('viagens');
    this.editando.set(null);
    this.editandoAdmin.set(null);
    this.ficha.set(null);
    this.lugarForm = null;
    if (this.token()) this.carregarViagens();
  }

  carregarViagens(): void {
    const params: Record<string, string> = {};
    if (this.viagemBusca.trim()) params['q'] = this.viagemBusca.trim();
    if (this.viagemDono.trim()) params['owner'] = this.viagemDono.trim();
    if (this.viagemDestino.trim()) params['destination'] = this.viagemDestino.trim();
    if (this.viagemStatus) params['status'] = this.viagemStatus;
    if (this.viagemModo) params['startMode'] = this.viagemModo;
    if (this.viagemDe) params['from'] = this.viagemDe;
    if (this.viagemAte) params['to'] = this.viagemAte;
    if (this.viagemSoAtivas) params['active'] = 'true';
    if (this.viagemSoPublicas) params['visibility'] = 'public';
    this.http.get<ViagemPainel[]>(`${API}/trips`, { headers: this.cabecalho(), params }).subscribe({
      next: (lista) => this.viagens.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  verViagem(id: string): void {
    this.http.get<ViagemPainel>(`${API}/trips/${id}`, { headers: this.cabecalho() }).subscribe({
      next: (viagem) => this.fichaViagem.set(viagem),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  ligarViagem(id: string, ativa: boolean): void {
    this.http.post(`${API}/trips/${id}/${ativa ? 'activate' : 'deactivate'}`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => {
        this.carregarViagens();
        this.verViagem(id);
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  publicarViagem(id: string, publica: boolean): void {
    this.http.patch(`${API}/trips/${id}/visibility`, { visibility: publica ? 'public' : 'private' }, { headers: this.cabecalho() }).subscribe({
      next: () => {
        this.carregarViagens();
        this.verViagem(id);
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  excluirViagem(id: string): void {
    this.http.delete(`${API}/trips/${id}`, { headers: this.cabecalho() }).subscribe({
      next: () => {
        this.fichaViagem.set(null);
        this.carregarViagens();
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  rotuloStatus(status: string): string {
    const mapa: Record<string, string> = { draft: 'rascunho', upcoming: 'proxima', happening: 'acontecendo', finished: 'concluida' };
    return this.t(mapa[status] ?? status);
  }

  rotuloModo(modo: string): string {
    const mapa: Record<string, string> = { suggested: 'sugerido', community: 'comunidade', from_scratch: 'doZero' };
    return this.t(mapa[modo] ?? modo);
  }

  abrirLugares(): void {
    this.erro.set('');
    this.confirmando.set('');
    this.tela.set('lugares');
    this.lugarForm = null;
    this.editando.set(null);
    this.editandoAdmin.set(null);
    this.ficha.set(null);
    if (this.token()) {
      this.carregarLugares();
      this.carregarCategorias();
    }
  }

  get lugarTotalPaginas(): number {
    return Math.max(1, Math.ceil(this.lugarTotal / this.lugarPageSize));
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

  editarPlano(plano: Plano): void {
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

  carregarLugares(pagina = this.lugarPagina): void {
    this.lugarPagina = Math.max(1, pagina);
    const params: Record<string, string> = { page: String(this.lugarPagina) };
    if (this.busca.trim()) params['q'] = this.busca.trim();
    if (this.lugarStatus) params['status'] = this.lugarStatus;
    this.http
      .get<{ items: LugarResumo[]; total: number; page: number; pageSize: number }>(`${API}/places`, {
        headers: this.cabecalho(),
        params,
      })
      .subscribe({
        next: (paginaRes) => {
          this.lugares.set(paginaRes.items);
          this.lugarTotal = paginaRes.total;
          this.lugarPagina = paginaRes.page;
        },
        error: (erro: HttpErrorResponse) => this.falha(erro),
      });
  }

  buscarLugares(): void {
    this.carregarLugares(1);
  }

  paginaLugaresAnterior(): void {
    if (this.lugarPagina > 1) this.carregarLugares(this.lugarPagina - 1);
  }

  paginaLugaresProxima(): void {
    if (this.lugarPagina < this.lugarTotalPaginas) this.carregarLugares(this.lugarPagina + 1);
  }

  buscarCidades(): void {
    const params: Record<string, string> = {};
    if (this.cidadeBusca.trim()) params['q'] = this.cidadeBusca.trim();
    this.http.get<CidadeResumo[]>(`${API}/cities`, { headers: this.cabecalho(), params }).subscribe({
      next: (lista) => this.cidades.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  escolherCidade(cidade: CidadeResumo): void {
    if (!this.lugarForm) return;
    this.lugarForm.cityId = cidade.id;
    this.cidadeBusca = `${cidade.name}${cidade.countryName ? ` · ${cidade.countryName}` : ''}`;
    this.cidades.set([]);
  }

  limparCidade(): void {
    if (!this.lugarForm) return;
    this.lugarForm.cityId = null;
    this.cidadeBusca = '';
  }

  carregarCategorias(): void {
    this.http.get<CategoriaDoLugar[]>(`${API}/place-categories`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.categorias.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  novoLugar(): void {
    this.origemId = '';
    this.cidadeBusca = '';
    this.cidades.set([]);
    this.lugarForm = lugarVazio();
    this.tela.set('lugar');
    this.carregarCategorias();
  }

  abrirLugar(id: string): void {
    this.http.get<LugarDoPainel>(`${API}/places/${id}`, { headers: this.cabecalho() }).subscribe({
      next: (lugar) => {
        this.lugarForm = lugar;
        this.origemId = '';
        this.cidadeBusca = '';
        this.cidades.set([]);
        this.tela.set('lugar');
        this.carregarCategorias();
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  voltarParaLugares(): void {
    this.lugarForm = null;
    this.abrirLugares();
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
        this.tela.set('lugar');
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
    const params: Record<string, string> = {};
    if (this.midiaAtribuicao.trim()) params['atribuicao'] = this.midiaAtribuicao.trim();
    if (this.midiaOrdem !== null && Number.isFinite(this.midiaOrdem)) params['ordem'] = String(this.midiaOrdem);
    this.http.post(`${API}/places/${lugar.id}/media`, dados, { headers: this.cabecalho(), params }).subscribe({
      next: () => {
        this.midiaAtribuicao = '';
        this.midiaOrdem = null;
        this.abrirLugar(lugar.id);
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  removerMidia(mediaId: string): void {
    const lugar = this.lugarForm;
    if (!lugar?.id) return;
    this.http.delete(`${API}/places/${lugar.id}/media/${mediaId}`, { headers: this.cabecalho() }).subscribe({
      next: () => this.abrirLugar(lugar.id),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  metadataTexto(referencia: { providerMetadata: Record<string, unknown> | null }): string {
    if (!referencia.providerMetadata) return '';
    try {
      return JSON.stringify(referencia.providerMetadata);
    } catch {
      return '';
    }
  }

  atualizarMetadata(referencia: { providerMetadata: Record<string, unknown> | null }, bruto: string): void {
    const texto = bruto.trim();
    if (!texto) {
      referencia.providerMetadata = null;
      return;
    }
    try {
      referencia.providerMetadata = JSON.parse(texto) as Record<string, unknown>;
    } catch {
      this.erro.set(this.t('jsonInvalido'));
    }
  }

  abrirCupons(): void {
    this.preparar('cupons');
    if (this.token()) this.carregarCupons();
  }

  carregarCupons(): void {
    this.http.get<CupomPainel[]>(`${API}/coupons`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.cupons.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  editarCupom(cupom: CupomPainel): void {
    this.cupomId = cupom.id;
    this.cupomCodigo = cupom.code;
    this.cupomDias = cupom.freeDays;
    this.cupomValidade = cupom.validUntil ?? '';
    this.cupomAtivo = cupom.isActive;
  }

  salvarCupom(): void {
    const corpo = { code: this.cupomCodigo.trim(), freeDays: Number(this.cupomDias), validUntil: this.cupomValidade || undefined, isActive: this.cupomAtivo };
    const pedido = this.cupomId
      ? this.http.patch<CupomPainel[]>(`${API}/coupons/${this.cupomId}`, corpo, { headers: this.cabecalho() })
      : this.http.post<CupomPainel[]>(`${API}/coupons`, corpo, { headers: this.cabecalho() });
    pedido.subscribe({
      next: (lista) => {
        this.cupons.set(lista);
        this.cupomId = '';
        this.cupomCodigo = '';
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  excluirCupom(id: string): void {
    this.http.delete(`${API}/coupons/${id}`, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarCupons(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirPro(): void {
    this.preparar('pro');
    if (this.token()) this.carregarPromocoes();
  }

  carregarPromocoes(): void {
    this.http.get<PromoPainel[]>(`${API}/promo`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.promocoes.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  buscarPromo(): void {
    this.http.get<UsuarioDoApp[]>(`${API}/users`, { headers: this.cabecalho(), params: { q: this.promoBusca.trim() } }).subscribe({
      next: (lista) => this.promoPessoas.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  concederPromo(userId: string): void {
    this.http.post(`${API}/promo`, { userId }, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarPromocoes(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  revogarPromo(id: string): void {
    this.http.post(`${API}/promo/${id}/revoke`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarPromocoes(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirMaya(): void {
    this.preparar('maya');
    if (this.token()) this.carregarAgentes();
  }

  carregarAgentes(): void {
    this.http.get<AgentePainel[]>(`${API}/maya/models`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.agentes.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  editarAgente(agente: AgentePainel): void {
    this.agente = { ...agente };
  }

  salvarAgente(): void {
    const corpo = {
      provider: this.agente.provider.trim(),
      modelName: this.agente.modelName.trim(),
      name: this.agente.name.trim(),
      family: this.agente.family,
      conversationType: this.agente.conversationType.trim(),
      maxTokens: Number(this.agente.maxTokens),
      temperature: Number(this.agente.temperature),
      prompts: this.agente.prompts,
      sortOrder: Number(this.agente.sortOrder),
    };
    const pedido = this.agente.id
      ? this.http.patch<AgentePainel>(`${API}/maya/models/${this.agente.id}`, corpo, { headers: this.cabecalho() })
      : this.http.post<AgentePainel>(`${API}/maya/models`, corpo, { headers: this.cabecalho() });
    pedido.subscribe({
      next: () => {
        this.agente = agenteVazio();
        this.carregarAgentes();
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  criarPadraoMaya(): void {
    this.http.post(`${API}/maya/models/defaults`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarAgentes(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  ligarAgente(agente: AgentePainel, ativo: boolean): void {
    this.http.post(`${API}/maya/models/${agente.id}/${ativo ? 'activate' : 'deactivate'}`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarAgentes(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  excluirAgente(id: string): void {
    this.http.delete(`${API}/maya/models/${id}`, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarAgentes(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  testarAgente(): void {
    if (!this.agente.id || !this.sandboxPergunta.trim()) return;
    this.http.post<{ answer: string }>(`${API}/maya/models/${this.agente.id}/sandbox`, { question: this.sandboxPergunta.trim() }, { headers: this.cabecalho() }).subscribe({
      next: (resposta) => this.sandboxResposta.set(resposta.answer),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirPagamentos(): void {
    this.preparar('pagamentos');
    if (this.token()) this.carregarPagamentos();
  }

  carregarPagamentos(): void {
    const params: Record<string, string> = {};
    if (this.pagamentoStatus) params['status'] = this.pagamentoStatus;
    if (this.pagamentoEmail.trim()) params['email'] = this.pagamentoEmail.trim();
    if (this.pagamentoDe) params['from'] = this.pagamentoDe;
    if (this.pagamentoAte) params['to'] = this.pagamentoAte;
    this.http.get<PagamentoPainel[]>(`${API}/payments`, { headers: this.cabecalho(), params }).subscribe({
      next: (lista) => this.pagamentos.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  totalPagamento(status: string): number {
    return this.pagamentos().filter((item) => item.status === status).length;
  }

  abrirAssinaturas(): void {
    this.preparar('assinaturas');
    if (this.token()) this.carregarAssinaturas();
  }

  carregarAssinaturas(): void {
    const params: Record<string, string> = {};
    if (this.assinaturaEmail.trim()) params['email'] = this.assinaturaEmail.trim();
    if (this.assinaturaStatus) params['status'] = this.assinaturaStatus;
    this.http.get<AssinaturaPainel[]>(`${API}/subscriptions`, { headers: this.cabecalho(), params }).subscribe({
      next: (lista) => this.assinaturas.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirEstorno(): void {
    this.preparar('estorno');
    if (this.token()) {
      this.carregarElegiveis();
      this.carregarJanelas();
    }
  }

  carregarElegiveis(): void {
    this.http.get<ElegivelPainel[]>(`${API}/refunds/eligible`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.elegiveis.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  carregarJanelas(): void {
    this.http.get<{ trialDays: number; duplicateDays: number }>(`${API}/refund-windows`, { headers: this.cabecalho() }).subscribe({
      next: (janela) => {
        this.janelaTeste = janela.trialDays;
        this.janelaDuplicada = janela.duplicateDays;
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  salvarJanelas(): void {
    this.http.patch(`${API}/refund-windows`, { trialDays: Number(this.janelaTeste), duplicateDays: Number(this.janelaDuplicada) }, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarElegiveis(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  aprovarEstorno(id: string, reason: 'trial' | 'duplicate_charge'): void {
    if (!globalThis.confirm(this.t('confirmarEstorno'))) return;
    this.http.post(`${API}/refunds`, { subscriptionId: id, reason }, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarElegiveis(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirMetodos(): void {
    this.preparar('metodos');
    if (this.token()) this.carregarMetodos();
  }

  carregarMetodos(): void {
    this.http.get<MetodoPainel[]>(`${API}/payment-methods`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.metodos.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  definirMetodo(metodo: MetodoPainel, isEnabled: boolean): void {
    this.http.patch<MetodoPainel[]>(`${API}/payment-methods`, { method: metodo.method, isEnabled }, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.metodos.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirLogs(): void {
    this.preparar('logs');
    if (this.token()) this.carregarLogs();
  }

  carregarLogs(): void {
    this.http.get<LogPainel[]>(`${API}/integration-logs`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.chamadas.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
    this.http.get<EventoPainel[]>(`${API}/asaas-events`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.webhooks.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  criarContaProvedor(): void {
    this.http.post<{ id: string }>(`${API}/providers`, { provider: 'asaas', accountName: this.contaNome.trim(), credentialsReference: this.contaReferencia.trim() }, { headers: this.cabecalho() }).subscribe({
      next: (conta) => {
        this.contaNome = '';
        this.contaReferencia = '';
        this.http.post(`${API}/providers/${conta.id}/sync`, {}, { headers: this.cabecalho() }).subscribe({
          next: () => this.carregarLogs(),
          error: (erro: HttpErrorResponse) => this.falha(erro),
        });
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  nomeMetodo(method: string): string {
    if (method === 'credit_card') return this.t('cartao');
    if (method === 'boleto') return this.t('boleto');
    return this.t('pix');
  }

  abrirInicio(): void {
    this.preparar('inicio');
    if (this.token()) this.carregarResumo();
  }

  carregarResumo(): void {
    this.http.get<ResumoPainel>(`${API}/platform/dashboard`, { headers: this.cabecalho(), params: { from: this.periodoDe, to: this.periodoAte, year: String(this.anoPainel) } }).subscribe({
      next: (resumo) => this.resumo.set(resumo),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirFinanceiro(): void {
    this.preparar('financeiro');
    if (this.token()) this.carregarFinanceiro();
  }

  carregarFinanceiro(): void {
    this.http.get<FinanceiroPainel>(`${API}/platform/finance`, { headers: this.cabecalho(), params: { year: String(this.anoPainel) } }).subscribe({
      next: (financeiro) => this.financeiro.set(financeiro),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirHub(): void {
    this.preparar('hub');
    if (this.token()) this.carregarHub();
  }

  carregarHub(): void {
    this.http.get<FontePainel[]>(`${API}/ingestion/sources`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => {
        this.fontes.set(lista);
        if (!this.fonteId && lista[0]) this.fonteId = lista[0].id;
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
    this.http.get<ItemHub[]>(`${API}/ingestion/items`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.itensHub.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  ativarFonte(fonte: FontePainel, isActive: boolean): void {
    this.http.post(`${API}/ingestion/sources/${fonte.id}/active`, { isActive }, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarHub(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  coletar(): void {
    this.http.post(`${API}/ingestion/jobs`, {
      sourceId: this.fonteId,
      externalId: `painel-${Date.now()}`,
      title: this.coletaTitulo.trim(),
      originalUrl: this.coletaUrl.trim() || null,
      mediaUrl: this.coletaUrl.trim() || null,
      mediaType: 'image',
      licenseName: this.licencaNome.trim() || 'unknown',
    }, { headers: this.cabecalho() }).subscribe({
      next: () => {
        this.coletaTitulo = '';
        this.coletaUrl = '';
        this.carregarHub();
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  julgarItem(item: ItemHub, decision: 'approved' | 'rejected' | 'edited' | 'escalated'): void {
    this.http.patch(`${API}/ingestion/items/${item.id}/status`, { status: 'pending_review' }, { headers: this.cabecalho() }).subscribe({
      next: () => {
        this.http.post<{ id: string }>(`${API}/content-reviews`, { ingestionItemId: item.id }, { headers: this.cabecalho() }).subscribe({
          next: (tarefa) => {
            this.http.post(`${API}/content-reviews/${tarefa.id}/decisions`, { decision }, { headers: this.cabecalho() }).subscribe({
              next: () => this.carregarHub(),
              error: (erro: HttpErrorResponse) => this.falha(erro),
            });
          },
          error: (erro: HttpErrorResponse) => this.falha(erro),
        });
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  associarItem(item: ItemHub): void {
    this.http.post(`${API}/ingestion/items/${item.id}/place`, { placeId: this.lugarAssociado.trim() }, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarHub(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  reavaliarLicenca(item: ItemHub): void {
    this.http.post(`${API}/ingestion/items/${item.id}/license`, { licenseName: this.licencaNome.trim() || 'unknown' }, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarHub(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  pedirRemocaoItem(item: ItemHub): void {
    this.http.post(`${API}/ingestion/items/${item.id}/removal-requests`, { reason: this.licencaNome.trim() || null }, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarHub(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirFilas(): void {
    this.preparar('filas');
    if (this.token()) this.carregarFilas();
  }

  carregarFilas(): void {
    this.http.get<FilasPainel>(`${API}/platform/queues`, { headers: this.cabecalho() }).subscribe({
      next: (filas) => this.filasPainel.set(filas),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  limparFila(fila: string, scope: 'pending' | 'processing'): void {
    this.http.post(`${API}/platform/queues/${fila}/clear`, { scope }, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarFilas(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  recolocarFila(fila: string): void {
    this.http.post(`${API}/platform/queues/${fila}/requeue-failed`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarFilas(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  esvaziarFila(fila: string): void {
    this.http.post(`${API}/platform/queues/${fila}/empty-failed`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarFilas(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  agirNoJob(fila: string, id: string, acao: 'requeue' | 'delete' | 'fail'): void {
    const caminho = acao === 'fail' ? `${API}/platform/queues/itinerary/jobs/${id}/fail` : `${API}/platform/queues/${fila}/jobs/${id}/${acao}`;
    this.http.post(caminho, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarFilas(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirExpiracao(): void {
    this.preparar('expiracao');
    if (this.token()) this.carregarCorridas();
  }

  carregarCorridas(): void {
    this.http.get<CorridaPainel[]>(`${API}/platform/subscription-expiry`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.corridas.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  expirarAgora(): void {
    this.http.post(`${API}/platform/subscription-expiry`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarCorridas(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirAjustes(): void {
    this.preparar('ajustes');
    if (this.token()) this.carregarAjustes();
  }

  carregarAjustes(): void {
    this.http.get<AjustePainel[]>(`${API}/platform/settings`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.ajustes.set(lista.map((ajuste) => ({ ...ajuste }))),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
    this.http.get<BandeiraPainel[]>(`${API}/platform/flags`, { headers: this.cabecalho() }).subscribe({
      next: (lista) => this.bandeiras.set(lista),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  salvarAjuste(ajuste: AjustePainel): void {
    this.http.patch(`${API}/platform/settings`, { key: ajuste.key, value: Number(ajuste.value) }, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarAjustes(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  criarBandeira(): void {
    this.http.post(`${API}/platform/flags`, { flagKey: this.bandeiraChave.trim() }, { headers: this.cabecalho() }).subscribe({
      next: () => {
        this.bandeiraChave = '';
        this.carregarAjustes();
      },
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  alternarBandeira(bandeira: BandeiraPainel): void {
    this.http.post(`${API}/platform/flags/${bandeira.id}/toggle`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregarAjustes(),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  abrirSaude(): void {
    this.preparar('saude');
    if (this.token()) this.carregarSaude();
  }

  carregarSaude(): void {
    this.http.get<SaudePainel>(`${API}/platform/health`, { headers: this.cabecalho() }).subscribe({
      next: (saude) => this.saude.set(saude),
      error: (erro: HttpErrorResponse) => this.falha(erro),
    });
  }

  largura(total: number, serie: { total: number }[]): number {
    const maximo = Math.max(1, ...serie.map((ponto) => ponto.total));
    return Math.round((total / maximo) * 100);
  }

  filasDaTela(): { chave: 'itinerary' | 'notification' | 'ingestion'; nome: string }[] {
    return [
      { chave: 'itinerary', nome: 'Roteiro' },
      { chave: 'notification', nome: 'Aviso' },
      { chave: 'ingestion', nome: 'Conteúdo' },
    ];
  }

  private preparar(tela: 'cupons' | 'pro' | 'maya' | 'pagamentos' | 'assinaturas' | 'estorno' | 'metodos' | 'logs' | 'inicio' | 'financeiro' | 'hub' | 'filas' | 'expiracao' | 'ajustes' | 'saude'): void {
    this.erro.set('');
    this.tela.set(tela);
    this.editando.set(null);
    this.ficha.set(null);
    this.fichaViagem.set(null);
    this.lugarForm = null;
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
    averageRating: null,
    totalReviews: 0,
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

interface DenunciaPainel {
  id: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  category: string;
  description: string | null;
  reporterName: string;
  target: string;
  targetId: string;
  createdAt: string;
  removeContent: boolean;
  deactivateAccount: boolean;
}

interface PublicacaoPainel {
  id: string;
  status: string;
  origin: string;
  content: string | null;
  authorName: string;
  placeName: string | null;
  rating: number | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  comments: { id: string; content: string; authorName: string; likeCount: number; removed: boolean }[];
}

interface CupomPainel {
  id: string;
  code: string;
  freeDays: number;
  validUntil: string | null;
  isActive: boolean;
}

interface PromoPainel {
  id: string;
  email: string;
  userName: string;
  startsAt: string;
  endsAt: string;
  revokedAt: string | null;
}

interface AgentePainel {
  id: string;
  provider: string;
  modelName: string;
  isActive: boolean;
  name: string;
  family: string;
  conversationType: string;
  maxTokens: number;
  temperature: number;
  prompts: string;
  sortOrder: number;
}

interface PagamentoPainel {
  id: string;
  amount: string;
  currency: string;
  status: string;
  providerPaymentId: string | null;
  email: string;
  code: string;
  paidAt: string | null;
}

interface AssinaturaPainel {
  id: string;
  email: string;
  userName: string;
  code: string;
  status: string;
  startedAt: string | null;
  endsAt: string | null;
  providerSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
  refunded: boolean;
  coupon: boolean;
  promo: boolean;
}

interface ElegivelPainel {
  id: string;
  userName: string;
  code: string;
  paidAt: string;
}

interface MetodoPainel {
  method: string;
  isEnabled: boolean;
}

interface LogPainel {
  id: string;
  provider: string;
  operation: string | null;
  status: string | null;
  responseCode: number | null;
  createdAt: string;
}

interface EventoPainel {
  id: string;
  eventType: string;
  providerEventId: string | null;
  createdAt: string;
}

function agenteVazio(): AgentePainel {
  return { id: '', provider: 'openai', modelName: '', name: '', family: 'GPT-4', isActive: false, conversationType: 'duvida', maxTokens: 800, temperature: 0.4, prompts: '', sortOrder: 1 };
}

function mensagem(erro: HttpErrorResponse): string {
  const corpo = erro.error as { message?: string } | null;
  return corpo?.message ?? 'Erro';
}
