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

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);
  readonly locale = signal<Locale>('pt-BR');
  readonly token = signal(sessionStorage.getItem('painel-token') ?? '');
  readonly planos = signal<Plano[]>([]);
  readonly erro = signal('');
  readonly editando = signal<Plano | null>(null);
  email = '';
  senha = '';

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
    sessionStorage.removeItem('painel-token');
    this.token.set('');
    this.planos.set([]);
  }

  carregar(): void {
    this.http.get<Plano[]>(`${API}/plans`, { headers: this.cabecalho() }).subscribe((lista) => this.planos.set(lista));
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
      error: (erro: HttpErrorResponse) => this.erro.set(mensagem(erro)),
    });
  }

  ativar(plano: Plano, ligar: boolean): void {
    const acao = ligar ? 'activate' : 'deactivate';
    this.http.post(`${API}/plans/${plano.id}/${acao}`, {}, { headers: this.cabecalho() }).subscribe({
      next: () => this.carregar(),
      error: (erro: HttpErrorResponse) => this.erro.set(mensagem(erro)),
    });
  }

  private cabecalho(): { Authorization: string } {
    return { Authorization: `Bearer ${this.token()}` };
  }
}

function mensagem(erro: HttpErrorResponse): string {
  const corpo = erro.error as { message?: string } | null;
  return corpo?.message ?? 'Erro';
}
