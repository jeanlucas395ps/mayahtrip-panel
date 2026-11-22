# Plano — Reconstrução do painel (componentização + visual novo)

- Data: 2026-11-21
- Repositório: `mayahtrip-panel`
- Relacionado: `mayahtrip-base/.docs/PANEL/01`–`20`, `mayahtrip-base/.docs/ARCHITECTURE.md` §3 (Painel), `mayahtrip-base/.docs/DEVELOPMENT.md` §5, `plan/backend-e-painel-plan.md` (API — já cobre praticamente 100% das tabelas; ver §"Bloqueios")

## Contexto e problema

O painel hoje é um único componente: `src/app/app.ts` (2099 linhas, ~90 signals, ~140 métodos) renderizado por um único template, `src/app/app.html` (1226 linhas, 32 `<table>`, 63 cartões `.folha` copiados à mão). Não há roteamento (`@angular/router` não está registrado em `main.ts`); a troca de tela é um `signal<TelaPainel>` comparado dentro de `@if` no mesmo arquivo. Não há componentização, não há biblioteca de UI, não há testes de verdade (o único "test" em `package.json` é um script Node avulso, não Vitest/Playwright como `ARCHITECTURE.md` define para este repositório).

A API, pelo checklist em `plan/backend-e-painel-plan.md`, já cobre praticamente toda tabela e toda função de `PANEL/01`–`20` (só a matriz de 7 papéis de admin e "quem edita geografia" seguem `A DEFINIR`). Ou seja: o gargalo não é dado nem rota — é a camada de apresentação. Hoje ela não é "nem perto de pronta": funciona, mas não é componentizada, não seção por rota, não tem design system próprio e usa CSS solto (`styles.css`, 330 linhas, classes genéricas como `.pri`, `.ghost`, `.folha`, `.metrica`).

Pedido: reconstruir 100% do painel, com inspiração estrutural no template "Minimal — Client and Admin Dashboard" (MUI Store / `minimals.cc`), para que ele seja funcional, intuitivo e bonito — pessoas vão operar a plataforma por ele todos os dias.

## Objetivo e critérios de aceite

Objetivo: um painel componentizado, roteável, testável e visualmente consistente, cobrindo as 20 funções de `PANEL/` (mais geografia e content hub, já descritos em `TECH/TECH.md` §4.2 e §6.2), sem regressão de função em relação ao `app.ts` atual.

Critérios de aceite, por tela entregue:

1. Tem rota própria (`/usuarios`, `/viagens/:id`, etc.), navegável pela URL, com voltar/avançar do navegador funcionando.
2. Usa componentes do kit interno (`ui/`) — nenhuma tela escreve `<table>` ou `.folha` cru de novo.
3. Passa o checklist "Painel" de `QA.md`: 360/768/1280, teclado e foco visível, contraste AA, estados de carregando/erro/vazio, nenhuma chamada direta a Asaas/Google/banco no browser, textos nos quatro idiomas.
4. Tem teste: ao menos um teste unitário de componente/serviço (Vitest) e um fluxo Playwright por cluster de telas (não uma por tela, para não inflar o plano — ver "Como testar").
5. Nenhuma função que existe hoje em `app.ts` desaparece sem uma linha no relatório explicando por quê.
6. Nenhuma string de interface nova fica fora do dicionário de textos (quatro idiomas).

Critério do conjunto: `app.ts` e `app.html` são apagados ao final (não ficam como "legado morto" ao lado do novo código).

## Escopo

- As 20 telas de `PANEL/01`–`20`.
- Geografia (países/cidades) — já implementada no `app.ts` atual, sem arquivo `PANEL/NN` próprio; comportamento vem de `TECH.md` §4.2.
- Lugares relevantes (carrossel "em alta") — idem, já existe no `app.ts`, sem arquivo próprio.
- Content hub (fontes, staging, revisão) — comportamento em `TECH.md` §6.2; a tela ainda não existe no `app.ts` atual além dos signals declarados (`fontes`, `itensHub`). Entra no escopo porque a API já cobre a tabela.
- Shell novo: barra lateral, cabeçalho, breadcrumbs, autenticação, troca de idioma.
- Kit de componentes interno (`src/app/ui/`).
- Roteamento com lazy loading por cluster.
- Infraestrutura de teste (Vitest + Angular testing + Playwright), hoje inexistente.

## Fora de escopo

- Mudar contrato da API (`mayahtrip-backend`). Qualquer campo que falte na resposta atual vira item de bloqueio, não invenção no painel.
- Resolver os itens `A DEFINIR` do checklist mestre (matriz de 7 papéis de admin, quem edita geografia, provedor de push, etc.). Enquanto a matriz não existe, administrador ativo continua vendo e executando tudo — ver "Abordagem", item de papéis.
- `mayahtrip-web`, `mayahtrip-app`, `mayahtrip-e2e`.
- Dark mode do painel (não está pedido em nenhum documento de negócio do painel; `DESIGN_SYSTEM.md` só fala de claro/noturno para o app).
- Copiar a skin visual do MUI (cor, sombra, tipografia padrão da lib). A referência é o **arranjo** das telas (ver "Abordagem"), não a pele.

## Abordagem

### 1. Dependências novas — decididas em 2026-11-21

`AGENTS.md` §2 é explícito: não assumir biblioteca instalada; se faltar, registrar aqui e perguntar. Perguntei; respostas abaixo, já valendo para o resto do plano:

| Pacote | Para quê | Decisão |
| --- | --- | --- |
| `@angular/cdk` | Overlay, foco, menu, diálogo, table/virtual-scroll e drag-and-drop acessíveis (sem estilo próprio) | **Aprovado.** Mesma organização do Angular, sem opinião visual — resolve foco preso em modal e `aria-*` de menu sem puxar Material Design |
| `@swimlane/ngx-charts` | Dashboard (`PANEL/01`) e financeiro (`PANEL/07`): série temporal, pizza Free×Pro | **Aprovado.** Componentes Angular standalone, SVG, bom encaixe com signals. Precisa checar compatibilidade com Angular 22/zoneless na fatia 1 — se a versão publicada travar em zoneless, registro ADR e reavalio (`chart.js` fica como plano B, já citado aqui para não precisar de nova pergunta) |
| `@ngrx/store` (+ `@ngrx/effects` se necessário) | Estado cross-tela: sessão do admin, idioma ativo | **Aprovado — já na fundação.** Segue `ARCHITECTURE.md` ao pé da letra em vez do atalho de signals simples |
| Vitest + `@angular/build` test runner + Playwright | `ARCHITECTURE.md`/`DEVELOPMENT.md` já definem isso como stack-alvo; hoje não existe | **Aprovado** — não é escolha nova, é cumprir o que já está decidido |

### 2. Estrutura de pastas

```text
src/app/
  core/                     # tudo que atravessa telas
    auth/                   # login, guarda de rota, sessão (token, admin logado)
    i18n/                   # serviço de tradução (evolução do textos.ts)
    http/                   # interceptor de token/erro, base da API
    shell/                  # AppShell, Sidebar, Topbar, Breadcrumbs
  ui/                       # kit de componentes "burros", sem chamada à API
    button/ card/ stat-card/ data-table/ badge/ modal/
    form-field/ empty-state/ pagination/ filter-bar/ toast/
  features/
    dashboard/              # PANEL/01
    administradores/        # PANEL/02
    viagens/                # PANEL/03
    usuarios/                # PANEL/04
    pro-promocional/        # PANEL/05
    maya/                    # PANEL/06
    financeiro/              # PANEL/07
    planos/                  # PANEL/08
    cupons/                  # PANEL/09
    pagamentos/              # PANEL/10
    assinaturas/             # PANEL/11
    estorno/                 # PANEL/12 + 13
    metodos-pagamento/       # PANEL/14
    logs-asaas/              # PANEL/15
    filas/                   # PANEL/16
    expiracao-assinaturas/   # PANEL/17
    infraestrutura/          # PANEL/18 (saúde)
    denuncias/               # PANEL/19
    publicacoes/             # PANEL/20
    lugares/                 # catálogo (TECH.md §4.2) — CRUD + categorias
    geografia/               # países/cidades (TECH.md §4.2)
    hub/                      # content hub (TECH.md §6.2)
```

Cada pasta de `features/` é lazy-loaded pela rota (`loadComponent`/`loadChildren`), com seu próprio serviço de estado (signals) — nada global além do que está em `core/`.

### 3. Estado

- **Local por tela**: `signal`/`computed`, um serviço por feature (`UsuariosStore`, `ViagensStore`, ...), igual ao padrão já usado hoje, só que isolado por pasta em vez de empilhado num componente só.
- **Entre telas**, via `@ngrx/store` (conforme `ARCHITECTURE.md` e decisão de 2026-11-21): sessão do admin (token, perfil, expiração) e idioma ativo. Dois `feature state` pequenos (`auth`, `ui`) na fundação — nada de um store por tela; o CRUD de cada feature continua em signals locais, NgRx só para o que realmente atravessa rota.

### 4. Roteamento

Introduzir `@angular/router` (já é dependência do Angular, só falta `provideRouter` em `main.ts`). Um `AuthGuard` funcional protege tudo exceto `/entrar`. Breadcrumb vem do `data` de cada rota (título + grupo do menu), substituindo o cálculo manual que hoje existe em `grupoDaTela()`.

### 5. Design visual — papéis de cada fonte

- **Tokens de marca** (cor, tipografia): `DESIGN.md`/`DESIGN_SYSTEM.md`. O painel já usa `#2b207f` (ação), fundo próximo de `#F4F3F8`, Plus Jakarta Sans + Instrument Serif (login) — ponto de partida correto, formalizar em `core/tokens.css` com as variáveis que já existem em `styles.css`, mais os papéis que faltam (texto secundário, superfícies, bordas, estados de sucesso/erro/aviso — já existem, só precisam virar um arquivo único documentado).
- **Arranjo das telas** (o que pedi para estudar no MUI "Minimal"): não consegui renderizar a demo (é client-side, `WebFetch` só leu o shell HTML). Uso o que é público e estável sobre esse template — e qualquer polimento fino de pixel fica para quando eu tiver uma tela real para comparar lado a lado, não antes:
  - Barra lateral fixa com grupos colapsáveis (o painel atual já tem isso — `GRUPOS`/`alternarGrupo()` — mantenho a ideia, troco a implementação por um componente `Sidebar` que lê um array de rotas, não um array hardcoded de strings).
  - Cabeçalho fixo: breadcrumb à esquerda, ações da tela (busca, filtro, botão primário) e menu da conta à direita — o `app.html` atual já tem `.topo-app`/`.migalha`; vira componente.
  - Dashboard: fileira de "stat cards" (ícone, rótulo, número grande, variação), depois gráficos (série temporal, pizza), depois listas/atividade — é a mesma ideia que `01-dashboard.md` já pede (totais, gráficos de novos usuários/viagens, Free×Pro, Pro ativo no ano), só que em componente de verdade em vez de `<div class="metrica">` repetido.
  - Listas/CRUD: barra de filtro acima da tabela, tabela com cabeçalho fixo, ação por linha num menu (hoje é botão solto por linha), paginação no rodapé — todas as telas de lista hoje (`usuarios`, `viagens`, `lugares`, `cupons`, `pagamentos`, ...) já seguem essa forma à mão; vira um único componente `DataTable` configurável.
  - Detalhe/edição: ficha com o registro à esquerda (ou em cima, em tela estreita) e formulário agrupado em cartões à direita — hoje a "ficha" de usuário/viagem já existe como painel lateral (`ficha`, `fichaViagem` signals); formaliza em um componente `DetailPanel`.
  - Esse arranjo é meramente estrutural (onde cada bloco fica); as cores, sombra e fonte continuam as de `DESIGN.md`, não as padrão do MUI.

### 6. Papéis de admin (bloqueio conhecido)

A matriz de 7 papéis está `A DEFINIR` (`ARCHITECTURE.md` §6.4, `plan/backend-e-painel-plan.md` §8). O shell novo terá um ponto único de verificação (`canSeeGroup(grupo): boolean`), hoje sempre `true` para administrador ativo — para que, quando a matriz existir, a mudança seja trocar essa função por uma leitura de permissão real, sem reescrever a navegação.

### 7. Ordem de entrega (fatias verticais, cada uma mergeável sozinha)

1. **Fundação** — roteamento, shell (sidebar/topbar/breadcrumb), tokens de design, kit `ui/` mínimo (Button, Card, StatCard, DataTable, Badge, Modal, FormField, EmptyState, Pagination, Toast), `AuthStore` + guarda de rota, serviço de tradução (evolução de `textos.ts`), Vitest + Playwright configurados. Sem isso, nenhuma tela nova tem onde morar.
2. **Dashboard + Administradores + Usuários** (`01`, `02`, `04`) — provam o padrão de "tela de overview" e o padrão de "lista + ficha" com as telas mais simples.
3. **Viagens + catálogo** (`03`, lugares, lugares relevantes, geografia) — maior volume de campos; reaproveita o `DataTable`/`DetailPanel` da fatia 2.
4. **Comunidade** (`19` denúncias, `20` publicações).
5. **Pagamentos** (`07` financeiro, `08` planos, `09` cupons, `05` pro promocional, `10` pagamentos, `11` assinaturas, `12`/`13` estorno, `14` métodos, `15` logs Asaas, `17` expiração) — cluster grande, mas repete o mesmo padrão de lista/filtro já provado.
6. **Operação** (`06` Maya, mala, hub de conteúdo, `16` filas, `18` saúde, ajustes/feature flags).

Cada fatia remove, ao final dela, o trecho correspondente de `app.ts`/`app.html`. `app.ts` só é apagado por completo ao fim da fatia 6.

### Alternativas descartadas

- **Reescrever tudo de uma vez num branch só**: descartado — 20+ telas sem revisão intermediária é um PR irrevisável e um risco de regressão silenciosa num painel que já está em uso operacional.
- **Manter o componente único e só trocar o CSS**: descartado — não resolve o pedido explícito de componentizar, nem destrava teste (um componente de 2000 linhas não se testa em unidade de forma útil).
- **Adotar Angular Material**: descartado por ora — traria uma linguagem visual própria (Material Design) que colide com o pedido de inspiração no Minimal/MUI e com os tokens de `DESIGN.md`; o CDK sozinho dá a parte de acessibilidade sem a pele.

## Impacto

- **Arquitetura**: introduz roteamento (ausente hoje) e um kit de componentes interno. Não muda a fronteira painel↔API (`ARCHITECTURE.md` §4 continua valendo: painel só fala com `/v1/admin`).
- **Dados**: nenhum. Mesmas rotas de API; a reconstrução é só de apresentação.
- **UI**: reconstrução visual completa, nas quatro línguas, com acessibilidade (WCAG 2.2 AA) como critério de cada fatia, não um polimento de fim de projeto.
- **Segurança**: token continua em `sessionStorage` (mesma escolha de hoje); nenhuma chamada nova a Asaas/Google/banco pelo browser. Vale checar, na fatia 1, se o endpoint de login do admin tem refresh/expiração — hoje `app.ts` só guarda um `accessToken` sem refresh visível; se o backend já tiver um fluxo de refresh (`identity.user_sessions` é do app, não do admin — `admin.admin_sessions` é a tabela certa), confirmo o contrato exato com `mayahtrip-backend` antes de montar o `AuthStore`, em vez de supor.

## Como testar

- **Vitest**: um teste por serviço de estado de feature (comportamento, não implementação) e por componente do kit `ui/` com lógica (ex.: `DataTable` ordenando/paginando).
- **Playwright**: um fluxo por fatia de entrega (login → navegar → uma ação de escrita → ver o resultado), não um arquivo por tela —o volume de 20+ telas pede um fluxo por cluster para não inflar o tempo de CI sem ganho real de cobertura.
- **Checklist manual de `QA.md` §3 "Painel"**: rodado em cada tela entregue, nas três larguras (360/768/1280).
- **Paridade funcional**: cada fatia faz a lista de ações do `app.ts` antigo daquele trecho (grep nos métodos tocados) e confirma, uma a uma, que a tela nova chama a mesma rota com o mesmo corpo.

## Riscos e como desfazer

- **Risco**: painel atual está em uso operacional; uma fatia com bug trava o time de operação. Mitigação: cada fatia é um PR pequeno e revisável; `app.ts` antigo só perde o trecho migrado depois que a tela nova for aprovada manualmente.
- **Risco**: contrato de autenticação do admin (refresh, expiração) pode ser mais simples do que o novo `AuthStore` espera. Mitigação: verificar o controller de auth do admin em `mayahtrip-backend` antes de escrever o guard, na fatia 1.
- **Risco**: dependência nova (CDK, lib de gráfico) sem aprovação trava a fatia que precisa dela. Mitigação: fatia 1 não depende de gráfico; só o dashboard (fatia 2) precisa — se a lib de gráfico não for aprovada a tempo, a fatia 2 entrega o dashboard sem gráfico (números e tabela) e o gráfico vira item futuro.
- **Desfazer**: cada fatia é commits/PR isolado; reverter é reverter aquele merge. Como o `app.ts` antigo só é apagado por partes, uma fatia ruim não derruba as fatias já entregues.

## Critério adicional — paginação e telas dedicadas (2026-11-21)

Esclarecimento do Jean, importante o bastante para registrar antes de chegar na fatia que ele afeta (3 — Viagens/catálogo — e partes da 5):

- **Volume esperado é grande.** Países, cidades, lugares, publicações e os itens do content hub vêm da API **sempre paginados** (a API já devolve `{ items, total, page, pageSize }` — confirmado em `GET /places` no painel legado). O painel novo nunca carrega a lista inteira de uma vez nem pagina no cliente: cada tela de lista pede uma página por vez ao servidor.
- **Lugares, países e cidades ganham tela própria cada um** — não um formulário genérico reaproveitado. Para cada um: uma rota de **lista** (`/geografia/paises`, `/geografia/cidades`, `/lugares`) e uma rota de **detalhe/edição por item** (`/geografia/paises/:id`, `/geografia/cidades/:id`, `/lugares/:id`), nunca um painel lateral ou modal fazendo esse papel — o usuário precisa poder abrir, favoritar a URL e voltar.
- **Lista é visual.** Miniatura/capa de cada país, cidade e lugar aparece na lista (não só texto), já que quem opera precisa reconhecer o item pela imagem, não só pelo nome.
- **Detalhe mostra 100% do dado relacionado.** Um lugar, por exemplo, espalha informação por `place_translations`, `place_addresses`, `place_opening_hours`, `place_price_information`, `place_visit_information`, `place_media`, `place_external_references`, `place_category_relations` (confirmado na interface `LugarDoPainel` do painel legado — já traz todas essas coleções). A tela de detalhe reúne tudo isso num único lugar, com cada coleção editável (adicionar/editar/remover endereço, horário, preço, mídia, tradução, referência externa, categoria), não só os campos escalares do registro principal.
- Mesma régua para publicações (`PANEL/20`) e content hub (`TECH.md` §6.2): lista paginada pelo servidor, com filtro; item individual quando a ação (julgar, aprovar, associar) precisar do registro completo.

Isso não muda nada da Fundação em construção agora — `DataTable`/`Pagination` do kit `ui/` já foram desenhados para receber só a página atual (a tela dona dos dados é quem chama a API paginada e entrega ao componente); o impacto real é nas fatias 3 e 5, que passam a prever explicitamente lista + detalhe por entidade em vez de uma tela só por função.

## Decisões confirmadas em 2026-11-21

1. `@angular/cdk` aprovado.
2. `@swimlane/ngx-charts` aprovado (plano B: `chart.js` se houver incompatibilidade com zoneless).
3. `@ngrx/store` aprovado desde a fundação, para sessão do admin e idioma.
4. Ordem de entrega (Fundação → Dashboard/Administradores/Usuários → Viagens/catálogo → Comunidade → Pagamentos → Operação) segue como proposta; nenhuma tela foi apontada para furar a fila.

## Progresso

- **Fatia 1 (Fundação) — concluída** em 2026-11-21: roteamento, shell (Sidebar/Topbar/Breadcrumb/AppShell), tokens (`core/styles/tokens.css`), kit `ui/` (Button, IconButton, Card, StatCard, Badge, Avatar, EmptyState, Spinner, Toast, FormField, Pagination, DataTable, Modal/ConfirmDialog, Icon), `@ngrx/store` (`auth`, `ui`), serviço de tradução, Vitest configurado (`ng test`). Painel legado intacto em `/legado`. ADR `0001` registra o bump para Angular 22 (exigido pelo NgRx/CDK instalados).
- **Fatia 2 (Dashboard + Administradores + Usuários) — concluída** em 2026-11-21: `PANEL/01` com stat cards, filas e gráficos (ngx-charts); `PANEL/02` com lista + modal criar/editar + ativar/desativar/excluir; `PANEL/04` com filtros, lista e ficha lateral (ativar/desativar/excluir/restaurar). `administrators` e `users` na API atual não paginam no servidor (devolvem array completo) — confirmado lendo `admin.controller.ts`; as duas telas refletem isso sem inventar paginação que a API não tem. Build, Vitest e o teste de regressão do legado passam; verificação visual confirmou o login completo e as três telas novas montando sem erro (sem dado real — falta credencial de admin local).
- **Fatia 3, parte 1 (Geografia — Países e Cidades) — concluída** em 2026-11-21: `/geografia/paises` e `/geografia/cidades`, cada um com lista paginada pelo servidor (capa em miniatura, busca, selo "Em alta") e rota de detalhe/edição própria por item (`/geografia/paises/:id`, `/geografia/cidades/:id`) com upload de capa e, no país, a lista de cidades daquele país. Abas de navegação entre as duas listas (o menu lateral só tem um item "Países e cidades").
  - **Bloqueio encontrado**: a API hoje não tem `GET /admin/countries/:id` nem `GET /admin/cities/:id` — só lista (paginada) e edição por id. A ficha só existe depois do registro ter passado pela lista (guardado num cache local, `GeografiaCacheService`); abrir a URL de um item direto, sem ter visitado a lista antes, mostra "não encontrado, volte à lista" em vez de buscar pelo servidor. Isso deveria virar rota nova no backend para o deep-link funcionar de verdade — fica registrado aqui como pendência para quem mexe na API.
  - `DataTable` do kit ganhou um slot opcional de capa (`#capaLinha`) para a miniatura de imagem antes das colunas normais — usado por países/cidades e reutilizável para a tela de Lugares.
- **Mudança de critério (2026-11-22)**: o Jean pediu para cobrir 100% das telas e remover o painel legado por completo ao final — não fica mais um "modo clássico" permanente ao lado do novo. A partir daqui a ordem deixa de ser só pelas fatias já descritas e passa a ser "o que falta, na ordem mais eficiente", fechando com a remoção de `src/app/legacy/`, da rota `/legado`, do link "painel clássico" e do selo "não implementado" no menu.
- **Lugares, Lugares relevantes e Viagens — concluídos** em 2026-11-22: `/lugares` (lista paginada + ficha com as 7 coleções: traduções, categorias, endereços, horários, preços, visita, referências externas, mídia — tudo editável via `FormArray`), `/lugares-relevantes` (busca-e-adiciona + remover) e `/viagens` (filtros completos + ficha lateral com participantes, ativar/desativar, tornar pública/privada, excluir).
  - Bug de padrão encontrado e corrigido em 3 lugares: `.subscribe({ next: ... })` sem callback `error` lança exceção não tratada do RxJS quando a chamada falha (401, por exemplo) — toda busca-conforme-digita (país, cidade) e a leitura de categorias do lugar estavam vulneráveis a isso. Auditoria em todo `features/` confirmou que não sobra mais nenhum `.subscribe` sem tratamento de erro.
- Próximo: Denúncias (19) e Publicações (20), depois o bloco de pagamentos inteiro (05/07/08/09/10/11/12/13/14/15/17), e por fim o bloco de operação (Maya/Mala/Hub/Filas/Saúde/Ajustes) — aí sim a remoção do legado.
