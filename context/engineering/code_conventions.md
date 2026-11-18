# Convenções de código

> Propósito: Convenções que os agentes de código devem seguir.
> Atualizar quando: uma convenção for criada ou mudar, inclusive por uma lição aprendida.
> Relacionados: [architecture.md](architecture.md)
> Última atualização: 2026-11-17 · loop-007

## Linguagem e estilo

- Linguagem: TypeScript estrito (`strict: true` no tsconfig) em todos os arquivos, main e renderer.
- Formatação: Prettier com configuração padrão (sem ponto-e-vírgula opcional, aspas simples).
- Linting: ESLint com preset `eslint-config-electron` + plugin `@typescript-eslint`.
- Nenhum `any` explícito. Usar `unknown` quando o tipo não for conhecido e fazer narrowing.
- Imports absolutos com alias `@main/` para o processo main e `@renderer/` para o renderer. Na prática o código atual usa imports relativos (ver "Em aberto").

## Estilos e fontes

- CSS em arquivo (ex.: `realtime-panel.css`, ao lado do componente) quando o estilo precisar de media query ou de regra que o estilo inline não expressa. No resto, estilo inline com os tokens de design.md.
- Quando um elemento precisa de `:hover` ou `:focus-visible` (ex.: `flight-card.css`, `status-bar.css`, `flight-detail-page.css`, loop-005), a regra base da classe (cor, borda, fundo que a pseudo-classe altera) também vai para o CSS em arquivo. Estilo inline venceria a pseudo-classe.
- Texto visualmente oculto, lido só pelo leitor de tela (loop-006, HITL-1): usar a classe utilitária `.visualmente-oculto` de `styles/global.css` (ex.: o rótulo do controle deslizante em `flight-player.tsx` e a duração por extenso em `flight-detail-page.tsx`). Não repetir o estilo inline. Débito: o h1 "Painel de tempo real" do painel (loop-005) ainda usa estilo inline em `App.tsx` (ver "Em aberto").
- SVG acessível (loop-006): o mostrador ou gráfico fica num contêiner com `role="group"` e `aria-label` que diz o valor (ex.: `instrument-slot.tsx`), e o desenho leva `aria-hidden` (no `<svg>` ou no contêiner dele, como `instrument__drawing`). O mapa da trajetória e o perfil vertical, que são uma imagem única, usam `role="img"` com rótulo no próprio SVG. Os textos acessíveis não usam `aria-live`. IDs internos do SVG (`clipPath`) vêm de `useId`, para não colidir entre instâncias. Traços que precisam manter a espessura e o tracejado em px de tela num SVG com `viewBox` que escala levam `vector-effect: non-scaling-stroke` (no CSS ou pela prop `vectorEffect`), como a trajetória e o perfil vertical.
- Gráfico SVG do painel (loop-007, `grafico-do-painel.tsx` e `.css`):
  - viewBox fixo (1000×100, `GRAFICO_LARGURA` e `GRAFICO_ALTURA` de `desenho-do-grafico.ts`) com `preserveAspectRatio="none"`, para o desenho ocupar a largura do card; o cálculo das coordenadas fica numa função pura (`desenharGrafico`), e o componente só desenha;
  - todo traço leva `vector-effect: non-scaling-stroke`, no CSS;
  - os limites da escala ficam em HTML abaixo do SVG, não em `<text>`, e o contêiner do gráfico inteiro (desenho e limites) leva `aria-hidden`;
  - a faixa da janela ("últimos 2 minutos: de <mín> a <máx> <unidade>") vai no `aria-label` do grupo do card (`role="group"`, montado por `textoDoIndicador`), sem `aria-live`;
  - a cor vem de uma classe por grupo (`grafico-do-painel--voo`, `--atitude-posicao`, `--motor-configuracao`) que define variáveis CSS locais (`--grafico-linha`, `--grafico-area`) a partir dos tokens `--color-chart-*`; o modificador `--sem-sinal` vem depois e vence a cor do grupo;
  - o recorte é um `clip-path: inset(-3px -3px -3px 0)` em CSS, com `overflow: visible`: folga de 3 px em cima, embaixo e à direita para o ponto e a ponta da linha em x=1000 aparecerem inteiros, e corte rente à esquerda;
  - a altura do gráfico vem da variável `--altura-grafico-painel` (84 px, em `styles/global.css`), usada também pela caixa do card N/A em `realtime-panel.css`. Não repetir a medida em px.
- Fontes IBM Plex Sans e IBM Plex Mono carregadas localmente pelos pacotes `@fontsource/ibm-plex-sans` e `@fontsource/ibm-plex-mono`, importados no renderer. Não usar Google Fonts nem outra fonte remota (design.md pede fonte local).

## Estrutura de pastas

```
src/
  main/           # Processo principal do Electron (Node.js)
    simconnect/   # Integração com SimConnect (coleta de dados)
    db/           # Acesso ao banco SQLite (queries, migrações)
    ipc/          # Handlers dos canais IPC expostos ao renderer
    index.ts      # Entry point do main
  renderer/       # Processo de renderização (React)
    components/   # Componentes React reutilizáveis, utilitários de exibição, constantes de exibição compartilhadas (sem React) e o hook usado só por um desses componentes
    pages/        # Telas da aplicação (uma pasta por tela, com os componentes, funções puras e hook usados só por ela, CSS e testes ao lado)
    hooks/        # Custom hooks compartilhados ou que falam com o main
    ipc/          # Chamadas IPC para o main (wrappers tipados)
    styles/       # CSS global (fontes, tokens)
    App.tsx
    index.tsx
  shared/         # Tipos e constantes compartilhados entre main e renderer
    types.ts
    ipc-channels.ts
    parameter-ids.ts  # PARAMETER_IDS, ParametroId, TODOS_PARAMETER_IDS, isParametroId
```

- Slugs de parâmetros nunca são escritos à mão no código TypeScript: main e renderer usam `PARAMETER_IDS` de `src/shared/parameter-ids.ts`. Um parâmetro novo entra, na mesma entrega, em `PARAMETER_IDS` e no seed SQL da migration que o cria (`INSERT OR IGNORE INTO parametros_de_voo`), com o mesmo slug. O seed SQL é o único lugar onde o slug se repete.
- `shared/parameter-ids.ts` exporta também uma função pura (`isParametroId`); se funções puras são aceitas em `shared/` está em aberto (ver "Em aberto").

- Utilitários de formatação e de derivação de estado de tela ficam ao lado do componente que os usa, em `components/` (ex.: `format-parameter-value.ts`, `panel-state.ts`). Hooks que falam com o main ficam em `hooks/`.
- Utilitários de exibição usados por componentes e por páginas também ficam em `components/` (decisão do HITL-3 do loop-005). Ex.: `format-flight-time.ts`, usado por `flight-card.tsx` e por `flight-detail-page.tsx`.
- Páginas (loop-005): uma pasta por tela em `pages/` (`pages/flight-list/flight-list-page.tsx`, `pages/flight-detail/flight-detail-page.tsx`), com o CSS e os testes ao lado. A troca de telas é feita no `App.tsx` (ADR-010 em architecture.md).
- Desde o loop-006 (HITL-1 e rodada curta do HITL-3), `pages/<tela>/` guarda também os componentes e as funções puras usados só por aquela tela e o hook de uma tela só. Ex.: os mostradores, `valor-no-instante.ts`, `reduzir-pontos.ts`, `reproducao.ts` e `use-reproducao.ts` em `pages/flight-detail/`. Quando passar a ser usado por outra tela, o arquivo sobe para `components/` ou `hooks/`.
- `hooks/` fica para hooks compartilhados entre telas ou que falam com o main (ex.: `use-dados-do-voo.ts`, que chama `session:get-readings`). Hooks nunca importam de `pages/`.
- Constantes de exibição compartilhadas, sem React, ficam em `components/` (ex.: `components/limites-de-tempo.ts`, com `SEM_DADOS_LIMITE_MS` e `CARREGANDO_LIMITE_MS`, usadas pelo painel, pela lista e pelo debriefing). Hooks não exportam constantes para outros módulos.
- Formatação de data e hora (loop-005): `format-flight-time.ts` usa `Intl.DateTimeFormat('pt-BR')` no fuso local da máquina (data dd/mm/aaaa; hora HH:mm com `hourCycle: 'h23'`) e recebe um `timeZone` opcional, usado só pelos testes para fixar o fuso. A duração é calculada pelos instantes, não pelo relógio local. Desde o loop-006, o cálculo de h:mm:ss e por extenso fica em `formatarSegundosHms` e `formatarSegundosPorExtenso`, reaproveitados pelos formatadores de duração e pelo tempo da reprodução (`formatarHoraComSegundos`, `textoDoInstante` para o `aria-valuetext`).
- Prop `timeZone` em componentes (loop-006): páginas e componentes que formatam data ou hora (`flight-detail-page.tsx`, `flight-player.tsx`) recebem um `timeZone?` opcional e o repassam ao formatador. A prop existe só para os testes; o `App` nunca a passa, e o app usa o fuso local.
- Reprodução no tempo (loop-006): a lógica que avança com o tempo é uma função pura, sem timer e sem `Date.now()` (`avancarReproducao`, `alternarReproducao` em `reproducao.ts`), e o timer fica num hook à parte (`use-reproducao.ts`, `setInterval` só enquanto toca, limpo ao pausar e ao desmontar). As funções puras são testadas com valores explícitos, e o hook com fake timers.
- Desde o loop-007, `components/` guarda também o que subiu do debriefing para o painel de tempo real: `caminho-svg.ts` (`caminhoDaLinha`), `segmentar-serie.ts` (`segmentarPorFalhas`, `PontoNoTempo`) e `sinal-de-exibicao.ts` (`arfagemNarizParaCima`, `rolagemParaDireita`), usados pelas duas telas. As funções puras dos gráficos do painel ficam ao lado: `janela-de-leituras.ts`, `config-grafico-painel.ts`, `escala-do-grafico.ts`, `desenho-do-grafico.ts` e `texto-do-indicador.ts`; as constantes de tempo novas (`JANELA_GRAFICO_MS`, `RELOGIO_SEM_SINAL_MS`, `MAX_PONTOS_JANELA`) ficam em `limites-de-tempo.ts`.
- Hook de um componente de `components/` (decisão do HITL-3 do loop-007): um hook usado só por um componente de `components/`, que não fala com o main, fica ao lado dele em `components/`, e não em `hooks/`. Ex.: `use-agora-do-painel.ts`, usado só por `realtime-panel.tsx`. É o equivalente, fora de `pages/`, do hook de uma tela só. Quando passar a ser usado por outros componentes ou telas, ou a falar com o main, o hook vai para `hooks/`.
- "Agora" de um gráfico que anda com o tempo (loop-007): o instante é dado por uma função pura, sem timer e sem `Date.now()` (`agoraDoPainel`, que recebe o estado, o último pacote, o relógio e o valor congelado), e o hook (`useAgoraDoPainel`) liga o timer só no estado que precisa dele (o `setInterval` de 1 s roda só no sem sinal; na sessão ativa o "agora" anda com os pacotes). Mesmo padrão da reprodução: a função pura é testada com valores explícitos, e o hook com fake timers.

## Nomes

- Arquivos e pastas: `kebab-case` (ex.: `session-repository.ts`, `parameter-indicator.tsx`). Todo arquivo novo segue essa regra. Os componentes antigos em `PascalCase` (`App.tsx`, `StatusBar.tsx`, `Notification.tsx`) são tolerados e não são renomeados sem decisão própria.
- Componentes React: `PascalCase` (ex.: `ParameterCard`, `SessionList`).
- Funções, variáveis e hooks: `camelCase` (ex.: `fetchSessions`, `useActiveSession`).
- Constantes globais: `UPPER_SNAKE_CASE` (ex.: `POLLING_INTERVAL_MS`).
- Canais IPC: string literal prefixada pelo domínio (ex.: `session:start`, `session:list`, `parameter:readings`), definidos em `shared/ipc-channels.ts`.
- Entidades do domínio seguem os nomes do domain_model.md: `Sessao`, `ParametroDeVoo`, `LeituraDeParametro`.

## Testes

- Framework: Vitest para testes unitários; Playwright previsto para testes de integração de UI. O Playwright ainda não tem configuração nem testes (o script `npm run test:e2e` existe, mas não há o que rodar); até lá, layout e atraso real são conferidos à mão.
- Localização: arquivo de teste ao lado do arquivo testado com sufixo `.test.ts` ou `.test.tsx`.
  - Ex.: `session-repository.ts` → `session-repository.test.ts`
- Nomenclatura: `describe` com o nome da unidade; `it` com "deve + comportamento esperado".
  ```ts
  describe('sessionRepository', () => {
    it('deve retornar lista vazia quando não há sessões', () => { ... })
  })
  ```
- Como rodar: `npm test` (Vitest) e `npm run test:e2e` (Playwright).
- Cobertura mínima: toda função em `main/db/` e `main/simconnect/` precisa ter ao menos um teste unitário.
- SQL real nos testes: o `better-sqlite3` é recompilado para o Node do Electron (`postinstall`) e não carrega no Vitest. Para testar SQL de verdade (migrations), usar o SQLite nativo do Node (`node:sqlite`, aprovado no HITL-1 do loop-003), embrulhado na parte da API do better-sqlite3 que o código usa (`exec`, `prepare`, `transaction`), como em `src/main/db/migrator-sqlite.test.ts` (banco novo, banco do loop-002 com dados, reexecução e falha desfeita). O teste com mocks (`migrator.test.ts`) continua cobrindo o fluxo do migrator.
  Desde o loop-004, `src/main/db/session-repository-sqlite.test.ts` é o padrão para testar repositórios com SQL real: cobre `encerrarSessao`, `buscarSessaoAtiva`, `buscarUltimaLeituraEm` e a rotina de sessões antigas (idempotente, sobre um banco do loop-003). Testes de SQL real de outros repositórios podem ficar nesse arquivo enquanto o adaptador não vira helper (decisão do HITL-2 do loop-004). Para conferir o uso de um índice, usar `EXPLAIN QUERY PLAN`, como no teste da migration 003.
- Débito (loop-003): `tsconfig.main.json` compila os testes junto com o main. Uma mudança de tipo quebra o `npm run build` até os testes serem atualizados, e os testes (inclusive `migrator-sqlite.test.ts`) vão para `dist/main`.
- Débito (loop-004, HITL-2): o adaptador de `node:sqlite` está duplicado em `migrator-sqlite.test.ts` e `session-repository-sqlite.test.ts`. Um helper compartilhado iria para `dist/main` por causa do débito acima; vira helper quando os testes saírem do build.
- Tempo nos testes (loop-004):
  - Lógica medida pelo tempo das amostras (como o detector de encerramento) é uma função pura que recebe instantes explícitos (`timestamp` ISO 8601) em cada evento, sem timer nem `Date.now()` interno. Os testes passam os instantes à mão (ex.: 14 s não encerra, 15 s encerra), como em `detector-de-encerramento.test.ts`.
  - Prazos de relógio (`setTimeout`, como `VERIFICACAO_ABERTURA_MS` no `CollectionService` e os 4 s da notificação no renderer) são testados com fake timers do Vitest (`vi.useFakeTimers()` e avanço explícito do relógio).
- Fuso nos testes (loop-005): testes de data e hora passam um `timeZone` fixo ao formatador (ex.: `'America/Sao_Paulo'`, `'UTC'`) para serem determinísticos. Não alterar `process.env.TZ`.
- Fake da ponte: o fake de `window.electronApi` nos testes do renderer (ex.: `App.test.tsx`) ganha, na mesma entrega, cada função nova exposta pelo preload (ex.: `listSessoesEncerradas`, loop-005). Sem isso o `tsc` do renderer quebra.
- `src/main/index.ts` não tem teste automatizado: a chamada da rotina de sessões antigas e a ligação dos eventos de encerramento e falha ao IPC foram conferidas no roteiro manual no Windows do loop-004 (v0.4.0, aprovado em 2026-11-17).

## Commits

Formato: Conventional Commits (`tipo(escopo): descrição`).

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Alteração apenas em documentação ou context/ |
| `refactor` | Mudança de código sem alterar comportamento |
| `test` | Adição ou correção de testes |
| `chore` | Configuração, dependências, CI |

Exemplos:
- `feat(simconnect): coletar altitude MSL a cada segundo`
- `fix(db): corrigir query de leituras por sessão`
- `docs(product): atualizar conjunto inicial de parâmetros`

## O que evitar

- Nunca usar `ipcRenderer` diretamente nos componentes React; sempre via wrappers em `renderer/ipc/`.
- Nunca acessar o banco SQLite no processo renderer.
- Nunca usar `electron.remote` (depreciado e removido nas versões recentes).
- Nunca ignorar erros de conexão com o SimConnect com `catch` vazio; sempre logar e emitir evento de estado.
- Não duplicar tipos entre main e renderer; tipos compartilhados vivem em `shared/types.ts`.
- Nunca emitir push sem a guarda de janela: todo emissor `emit*` do main checa `win !== null && !win.isDestroyed()` antes de `webContents.send()`, e `index.ts` zera a referência da janela (`mainWindow = null`) no evento `closed`.
- Nunca deixar uma consulta inicial do renderer (invoke na montagem de um hook) sem tratamento de rejeição: o `.catch` loga o erro e deixa a tela num estado explicável (sai do carregamento, mantém o padrão seguro ou mostra mensagem de erro). Quando o hook também ouve um push do mesmo dado, a resposta da consulta é descartada se um evento chegou antes (padrão `recebeuEvento`, como em `use-connection-state.ts`), e ignorada se o componente já desmontou.

## preload.ts e contextBridge

- O arquivo `src/main/preload.ts` expõe ao renderer via `contextBridge.exposeInMainWorld('electronApi', {...})` somente as funções necessárias.
- Canais de invoke (renderer → main): expostos como `async function` que chama `ipcRenderer.invoke(canal)`.
- Canais de push (main → renderer): expostos como função que registra callback via `ipcRenderer.on(canal, callback)` e retorna `() => void` para remoção do listener.
- A interface `ElectronApi` em `src/renderer/electron-api.d.ts` deve ser mantida sincronizada com `preload.ts`.
- O preload roda em sandbox (padrão do Electron desde a v20) e só consegue carregar módulos do próprio Electron. Por isso `preload.ts` é empacotado com esbuild (`npm run build:preload`) num único `dist/main/main/preload.js`, que inclui o que ele importa de `shared/`. O `tsc` do main não compila o preload (`tsconfig.main.json` o exclui); os tipos dele são checados por `tsconfig.preload.json`, sem emitir arquivos.
- Não desligar o sandbox (`sandbox: false`) para contornar erro de import no preload.

## Build e execução

- Node.js exigido: 22.22.2+, 24.15+ ou 26+ (campo `engines` do `package.json`), por causa do `jsdom` usado nos testes. O workflow do instalador usa Node 24.
- `npm run build` gera o renderer (Vite, em `dist/renderer`) e o main (`tsc`, em `dist/main`). O build do main apaga `dist/main` antes de compilar, empacota o preload e copia `src/main/db/migrations` para `dist/main/main/db/migrations`, porque o `tsc` não copia arquivos `.sql`.
- `npm start` abre o app a partir de `dist/main/main/index.js`, o `main` do `package.json`. Rode `npm run build` antes.
- `npm run dist:win` gera o instalador Windows em `release/`. Rode no Windows; o caminho normal é o workflow `release-windows.yml` do GitHub Actions (ver ADR-006 em architecture.md).
- Para publicar uma versão: atualizar `version` no `package.json`, commitar e criar a tag `v<versão>` (ex.: `git tag v0.1.0 && git push origin v0.1.0`). O workflow publica o `.exe` na Release dessa tag.
- `electron` fica em `devDependencies`, porque o electron-builder recusa empacotar se ele estiver em `dependencies`.
- O `postinstall` roda `electron-builder install-app-deps`, que recompila os módulos nativos (`better-sqlite3`) para a versão do Node do Electron. Sem isso o app quebra ao abrir o banco.
- Fora do Windows, ou sem o Flight Simulator aberto, o log mostra `[SimConnect] Could not connect, retrying in 5s` a cada 5 s. É o comportamento esperado, não um erro de build.

## Migrator

Implementado no loop-003 (`src/main/db/migrator.ts`):

- Controle de versão na tabela `schema_migrations` (`versao` TEXT PK com o nome do arquivo, `aplicada_em` em ISO 8601), criada pelo próprio migrator se não existir.
- Migrations são arquivos `NNN-nome.sql` em `src/main/db/migrations/`, com prefixo de 3 dígitos (ex.: `001-initial.sql`, `002-ampliar-parametros.sql`, `003-indice-leituras.sql`). A ordem de aplicação é a ordem lexicográfica do nome (`.sort()`), por isso o prefixo precisa ter sempre 3 dígitos.
- Só as migrations ainda não registradas são aplicadas. Cada uma roda numa transação junto com o seu registro em `schema_migrations`: se falhar, nada dela fica gravado e ela volta a rodar na próxima inicialização.
- Bancos anteriores ao controle de versão rodam a 001 de novo; por isso a 001 é idempotente (`CREATE TABLE IF NOT EXISTS`, `INSERT OR IGNORE`). Seeds de catálogo usam `INSERT OR IGNORE`.
- Uma falha loga `[Migrator] Falha ao aplicar a migration <arquivo>` e relança o erro, o que interrompe a inicialização do app. Débito aceito no HITL-2 do loop-003: o piloto não vê mensagem, só o log.
- O build copia `src/main/db/migrations` para `dist/main/main/db/migrations` (ver "Build e execução").
- Migrations existentes: 001 (tabelas e 6 parâmetros), 002 (6 parâmetros novos e `parametros_nao_aplicaveis`), 003 (loop-004: índice `idx_leituras_sessao_timestamp` em `leituras_de_parametro (sessao_id, timestamp)`, com `CREATE INDEX IF NOT EXISTS`).
- Saneamento de dados que precisa rodar a cada abertura não vai em migration (que roda uma vez só): vira função de repositório chamada em `index.ts` logo depois de `runMigrations()` e antes de criar o `CollectionService`. A rotina precisa ser idempotente, e uma falha nela só gera log, sem impedir o app de abrir. Exemplo: `encerrarSessoesAtivasAnteriores` (loop-004, ADR-009 em architecture.md), escolhida no HITL-1 no lugar de uma migration porque repara também as sessões que ficam ativas por falha ao gravar o encerramento.

## Em aberto

Levantado no loop-007 (3.2); débitos não bloqueantes aceitos no HITL-3, aguardam decisão humana.

- `components/caminho-svg.ts` não tem teste próprio: subiu do debriefing com `git mv`, sem um `caminho-svg.test.ts` ao lado.
- Slugs à mão nos testes: os testes do loop-007 também escrevem slugs à mão. A pergunta do loop-006 continua aberta: a regra de "Estrutura de pastas" vale também para os testes?
- O `tsconfig.json` da raiz não passa no `tsc` (anterior ao loop). As 3 configs usadas no build e no lint (main, renderer e preload) passam.

Resolvido no loop-007 (rodada curta do HITL-3): os testes de `sinal-de-exibicao.ts` ficaram ao lado dele (`sinal-de-exibicao.test.ts`), e o `describe('segmentarPorFalhas')` repetido saiu de `reduzir-pontos.test.ts`, com os casos levados para `segmentar-serie.test.ts`; a altura de 84 px repetida em dois CSS virou a variável `--altura-grafico-painel`.

Resolvido no loop-006: o cálculo de horas, minutos e segundos repetido em `formatarDuracaoDoVoo` e `formatarDuracaoPorExtenso` (`format-flight-time.ts`, loop-005) foi extraído para `formatarSegundosHms` e `formatarSegundosPorExtenso`.

Levantado no loop-006 (2.2, 3.2 e 3.4); débitos não bloqueantes aceitos no HITL-3, aguardam decisão humana.

- `duracaoEmSegundos` duplicada: uma função privada com esse nome existe em `format-flight-time.ts` e outra em `flight-detail-page.tsx`.
- Tipagem mista de `parametroId`: `SerieDeLeituras.parametroId` é `ParametroId`, mas o debriefing indexa as séries por `string` (`ReadonlyMap<string, SerieDeLeituras>` em `catalogo.ts`, `valor-no-instante.ts` e `flight-detail-page.tsx`). Mesmo tema da "Tipagem dos IDs" do loop-003.
- Slugs escritos à mão nos testes do loop: a regra de "Estrutura de pastas" proíbe slugs à mão no código TypeScript. Pergunta aberta: a regra vale também para os testes?
- `useDadosDoVoo` reajusta o estado durante a renderização quando o `sessaoId` muda na mesma montagem. É redundante, porque o `App` monta a tela com `key={sessao.id}`.
- Se o main responder a `session:get-readings` com um `sessaoId` diferente do pedido, `useDadosDoVoo` descarta a resposta e a tela fica carregando para sempre (caso teórico; o handler sempre devolve o id pedido; débito do HITL-2).
- Filtro `p.ativo` redundante em `useDadosDoVoo` (e em `use-active-parameters.ts`): `parameter:list-active` já devolve só os parâmetros ativos.
- `use-dados-do-voo.ts` exporta `MARCA_PEDIDO_DADOS_DO_VOO` e `medirPrimeiroDesenho`, usados pela instrumentação de medição; saem junto com ela (ver "Em aberto" em architecture.md).

Levantado no loop-005 (2.1, 2.2 e 3.2); débitos não bloqueantes, aguardam decisão humana.

- `flight-card.tsx` compara o texto devolvido pelo formatador com a constante `DURACAO_INDISPONIVEL` para montar o `aria-label`. Alternativa levantada no 2.2: o formatador devolver `null` quando a duração não pode ser calculada.
- Estilo "visualmente oculto" do título do painel é inline em `App.tsx`. A classe utilitária `.visualmente-oculto` foi criada no loop-006 (ver "Estilos e fontes"); falta o h1 do painel passar a usá-la.
- Estilos de título e a família de fonte repetidos entre as páginas e componentes novos (3.2).

Levantado na revisão do loop-004 (3.2); débitos não bloqueantes, aguardam decisão humana.

- `session-repository-sqlite.test.ts` repete os `require` com `eslint-disable` de `migrator-sqlite.test.ts` (mesmo item do loop-003 abaixo).
- `ESTADO_INICIAL_DETECTOR` (`detector-de-encerramento.ts`) é um objeto mutável exportado; a 3.2 sugeriu `Readonly`/`Object.freeze`. Decidir se constantes de objeto exportadas passam a ser congeladas.
- Comentários em inglês em `simconnect-client.ts` (ex.: "Ground definition: ...") destoam dos comentários em português do resto do código; não há convenção escrita sobre o idioma dos comentários.
- 4 guardas defensivas sem teste em `collection-service.ts` (inalcançáveis hoje).

Levantado na revisão do loop-003 (3.2 e 3.4); aguarda decisão humana.

- Funções puras em `shared/`: a estrutura de pastas descreve `shared/` como "tipos e constantes", mas `parameter-ids.ts` exporta `isParametroId`. Decidir se funções puras são aceitas ali.
- Tipagem dos IDs: `ParametroDeVoo.id`, `LeituraDeParametro.parametroId`, `LeituraDoPacote.parametroId` e o painel usam `string` (e `readonly string[]` no painel e na coleta), embora exista `ParametroId`. Decidir se passam a `ParametroId`.
- `migrator-sqlite.test.ts` usa `require('fs')` e `require('path')` com `eslint-disable`; um `import` estático dispensaria os dois (não bloqueante da 3.2).

Levantado na revisão do loop-002 (3.2 e 3.4); aguarda decisão humana.

- Aliases de import: a convenção pede `@main/` e `@renderer/` (e a revisão citou `@shared/`), mas o código usa imports relativos desde antes do loop-002. Decidir entre aplicar os aliases ou trocar a convenção para imports relativos.
- Prettier: a linha "configuração padrão (sem ponto-e-vírgula opcional, aspas simples)" se contradiz, porque o padrão do Prettier usa ponto-e-vírgula e aspas duplas. Não há `.prettierrc` nem script de formatação, e o formatador não é aplicado. Decidir a configuração e se ela entra num script ou no lint.
