# 0001 — Angular 22 e dependências da fundação do painel novo

- Status: aceito
- Data: 2026-11-21

## Contexto

A reconstrução do painel (`plan/reconstrucao-painel-plan.md`) já tinha três dependências aprovadas por você em chat: `@angular/cdk`, `@ngrx/store`/`@ngrx/effects` e `@swimlane/ngx-charts`. Ao instalar, `@ngrx/store`/`@ngrx/effects` e `@angular/cdk` nas versões atuais exigem `@angular/core ^22.0.0` como peer dependency — não existe release de NgRx para a faixa 21.x (o pacote pulou de 20.x para 22.x acompanhando o próprio Angular). O projeto estava em Angular 21.2.0, abaixo do que `ARCHITECTURE.md` §3 já define como alvo ("Angular 22").

## Decisão

Rodar `ng update @angular/core@22 @angular/cli@22` (via `ng update`, com as migrations automáticas do próprio Angular) antes de instalar NgRx e CDK. Isso não é uma nova escolha de stack — é alinhar a dependência instalada ao que `ARCHITECTURE.md` já decidiu. Na mesma leva, usei a migração oficial `ng update @angular/cli --name migrate-karma-to-vitest` para configurar o `test` target com `@angular/build:unit-test` (runner Vitest), cumprindo o que `ARCHITECTURE.md`/`DEVELOPMENT.md` já listam como stack de teste do painel (hoje inexistente no projeto).

Dependências finais instaladas nesta fatia: `@angular/cdk@22`, `@ngrx/store@22`, `@ngrx/effects@22`, `@swimlane/ngx-charts@25`, `vitest`, `jsdom` (ambiente DOM do Vitest), `@playwright/test` (ainda sem uso nesta fatia — fica pronto para a fatia 2).

## Alternativas consideradas

- **Forçar `@ngrx/store@20` com `--legacy-peer-deps` sobre Angular 21**: descartado — resolve a instalação mas deixa uma divergência de peer deps não resolvida, que voltaria a aparecer a cada `npm install` futuro.
- **Não usar NgRx agora, só signals simples**: era a alternativa original do plano antes de você confirmar "NgRx desde já"; descartada pela sua própria resposta em chat.

## Consequências

- Positivas: projeto alinhado ao `ARCHITECTURE.md`; sem dependência presa numa versão de transição; infraestrutura de teste (Vitest) finalmente existe.
- Negativas: Angular 22 é uma versão muito recente — qualquer biblioteca de terceiro futura também precisará suportar `^22`, o que pode repetir esse mesmo tipo de bloqueio (ex.: `@swimlane/ngx-charts` funcionou de primeira, mas não há garantia para a próxima lib que entrar).
- `package.json`/`package-lock.json` mudam de versão major do Angular; nenhum código de produto foi reescrito por causa disso além do que as migrations automáticas tocaram (`legacy/app.ts`, `main.ts`, `tsconfig.app.json` — mudanças mecânicas, sem alterar comportamento).

## Referências

- `mayahtrip-base/.docs/ARCHITECTURE.md` §3 (Painel)
- `plan/reconstrucao-painel-plan.md` §"Dependências novas — decididas em 2026-11-21"
