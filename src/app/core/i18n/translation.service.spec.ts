import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { uiFeature } from '../state/ui/ui.reducer';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStore({ [uiFeature.name]: uiFeature.reducer })],
    });
  });

  it('resolve uma chave conhecida no idioma padrão (pt-BR)', () => {
    const servico = TestBed.inject(TranslationService);
    expect(servico.t('comum.salvar')).toBe('Salvar');
  });

  it('cai para a própria chave quando ela não existe em nenhum dicionário', () => {
    const servico = TestBed.inject(TranslationService);
    expect(servico.t('chave.inexistente')).toBe('chave.inexistente');
  });

  it('troca de idioma via definirLocale e reflete no texto resolvido', () => {
    const servico = TestBed.inject(TranslationService);
    servico.definirLocale('en');
    expect(servico.t('comum.salvar')).toBe('Save');
  });
});
