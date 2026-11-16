# Loop 001

Loop: 001
Data de início: 2026-11-16
Item do backlog: 1 — Iniciar sessão de coleta
Caso de uso: UC-001
Fase atual: concluído

---
HITL-1 aprovado em 2026-11-16
HITL-2 aprovado em 2026-11-16
HITL-3 retorno: corrigir bloqueantes de qualidade (ESLint) e usabilidade (UI) — 2026-11-16
HITL-3 aprovado em 2026-11-16
HITL-4 aprovado em 2026-11-16
Loop encerrado em 2026-11-16



## 1.1 Especificação de negócio

### Critérios de aceite confirmados

- **CA-001-1 — Fluxo principal:** Dado que o Blackbox Simulator está em execução, quando o piloto liga o motor no simulador, então o sistema inicia uma nova sessão e começa a registrar os parâmetros do conjunto inicial.
- **CA-001-2 — Fluxo alternativo A (motor pré-ligado):** Dado que o motor já está ligado ao iniciar o Blackbox Simulator, quando o sistema é iniciado, então uma sessão é criada e a coleta dos parâmetros do conjunto inicial começa imediatamente.

> ⚠️ **Ambiguidade em CA-001-1:** "começa a registrar os parâmetros" não menciona "do conjunto inicial" — recomenda-se realinhar com RN-002.
> ⚠️ **Critério faltante (RN-001):** nenhum CA cobre o cenário em que o simulador não está acessível na mesma máquina. Comportamento exato precisa de decisão humana.

### Regras de negócio aplicáveis

- **RN-001 — Coleta local:** A coleta exige que o simulador de voo esteja na mesma máquina. Conexão remota não é suportada.
- **RN-002 — Conjunto inicial de parâmetros:** Apenas os parâmetros do conjunto inicial configurado são coletados; os demais são ignorados.
- **RN-003 — Início automático da sessão:** A sessão inicia sem ação manual do piloto: ao detectar o motor ligado, ou imediatamente se o motor já estiver em funcionamento quando o Blackbox Simulator for aberto.

### Termos relevantes do glossário

- **Blackbox Simulator** — nome do produto.
- **Simulador de voo** — software de simulação (ex.: MSFS 2024); fonte dos eventos do UC.
- **Sessão** — uso contínuo do produto durante um voo; sinônimo de *Voo* no produto.
- **Piloto** — ator único do UC.
- **Parâmetro de voo** — grandeza medida durante o voo fornecida pelo simulador.
- **Conjunto inicial de parâmetros** — subconjunto de parâmetros coletados nesta versão.

### Impactos propostos no contexto de produto

1. `use_cases.md` — ajustar CA-001-1 para incluir "do conjunto inicial" (alinhamento com RN-002).
2. `use_cases.md` — adicionar CA cobrindo comportamento quando o simulador não está acessível (RN-001), **após decisão humana**.
3. `business_rules.md` e `glossary.md` — sem alterações necessárias.

---

## 1.2 Refinamento técnico

### Entidades envolvidas

- **`Sessao`** — entidade central; criada ao detectar motor ligado; `status = 'ativa'`; campos `encerradaEm` e `duracao` ficam `null`.
- **`ParâmetroDeVoo`** — catálogo consultado para identificar parâmetros `ativo = true` a subscrever no SimConnect.
- **`LeituraDeParâmetro`** — criada a cada segundo para cada parâmetro ativo da sessão aberta.

### Tarefas de implementação

1. **[shared] Definir tipos e canais IPC de sessão**
   - `src/shared/types.ts` — interfaces `Sessao`, `ParâmetroDeVoo`, `LeituraDeParametro`.
   - `src/shared/ipc-channels.ts` — constantes `SESSION_STARTED` e `SESSION_GET_ACTIVE`.

2. **[main/db] Criar migration inicial do banco SQLite**
   - `src/main/db/migrations/001-initial.sql` — tabelas `sessoes`, `parametros_de_voo` (seed dos parâmetros `ativo = true`) e `leituras_de_parametro`.

3. **[main/db] Criar `session-repository.ts`**
   - Função `criarSessao(dados)` — insere com UUID, `status = 'ativa'`, `encerradaEm = null`.
   - Função `buscarSessaoAtiva()` — retorna sessão com `status = 'ativa'` ou `null`.

4. **[main/db] Criar `reading-repository.ts`**
   - Função `inserirLeitura(leitura)` — insere linha em `leituras_de_parametro`.

5. **[main/simconnect] Criar `simconnect-client.ts`**
   - Abre/fecha conexão com SimConnect via `node-simconnect`.
   - Subscreve variável de motor ligado (a ser definida — ver Riscos).
   - Expõe eventos `onEngineStarted` e `onParameterReading`.

6. **[main/simconnect] Criar `collection-service.ts`**
   - Ao receber `onEngineStarted` → chama `criarSessao`, inicia polling de 1 s dos parâmetros ativos, chama `inserirLeitura` a cada ciclo. (CA-001-1)
   - Na inicialização → verifica se motor já está ligado; se sim, cria sessão imediatamente. (CA-001-2)
   - Carrega catálogo de `ParâmetroDeVoo` (`ativo = true`) uma única vez na inicialização.

7. **[main/ipc] Criar `session-handler.ts`**
   - `ipcMain.handle(SESSION_GET_ACTIVE)` → retorna `buscarSessaoAtiva()`.
   - Ao criar sessão, emite `webContents.send(SESSION_STARTED, sessao)` ao renderer.

8. **[renderer/ipc] Criar `session-ipc.ts`**
   - `getActiveSessao(): Promise<Sessao | null>` — wrap de `ipcRenderer.invoke`.
   - `onSessionStarted(callback)` — wrap de `ipcRenderer.on`.

9. **[renderer] Criar hook `useActiveSession`**
   - Chama `getActiveSessao()` na montagem e atualiza estado ao receber `SESSION_STARTED`.
   - Expõe `sessaoAtiva: Sessao | null`.

### Testes necessários

- `session-repository.test.ts` — deve criar sessão com `status = 'ativa'` e `encerradaEm = null`.
- `collection-service.test.ts` — deve chamar `criarSessao` ao receber `onEngineStarted` (CA-001-1).
- `collection-service.test.ts` — deve iniciar polling de leituras após criar sessão.
- `collection-service.test.ts` — deve registrar apenas parâmetros com `ativo = true`.
- `collection-service.test.ts` — deve criar sessão imediatamente se motor já estiver ligado na inicialização (CA-001-2).
- `collection-service.test.ts` — não deve criar sessão duplicada se motor já estava ligado e evento disparar novamente.
- `reading-repository.test.ts` — deve inserir leitura associada ao `sessaoId` correto.
- `session-handler.test.ts` — deve retornar sessão ativa via canal `session:get-active`.
- `session-handler.test.ts` — deve emitir `session:started` ao renderer quando sessão é criada.

### Riscos e dependências

- **[ABERTO]** Variável SimConnect para "motor ligado" não está definida. Candidatas: `ENG COMBUSTION:1`, `ENGINE CONTROL SELECT`. Precisa validação contra MSFS 2024 antes de implementar `simconnect-client.ts`.
- **[ABERTO]** Lista definitiva dos parâmetros do conjunto inicial (`ativo = true`) não está definida em `domain_model.md`. Sem ela, seed e subscrições SimConnect não podem ser finalizados.
- **[ABERTO — negócio]** Comportamento quando SimConnect não está acessível (RN-001) não tem CA definido. Política de erro de `simconnect-client.ts` aguarda decisão humana.
- **[DEPENDÊNCIA]** `better-sqlite3` e `node-simconnect` precisam estar instalados com bindings nativos para a versão do Electron alvo.
- **[DEPENDÊNCIA]** `preload.ts` precisa expor `ipcRenderer` via `contextBridge`; essa configuração ainda não está documentada no contexto de engenharia.

### Impactos propostos no contexto de engenharia

- `architecture.md` — registrar ADR sobre estratégia de detecção de motor ligado via SimConnect.
- `domain_model.md` — preencher lista definitiva de parâmetros do conjunto inicial.
- `code_conventions.md` — documentar padrão de `preload.ts` / `contextBridge`.

---

## O que foi feito

### 2.1 Implementação (UC-001)

**Tarefas concluídas:**
- `src/shared/types.ts` + `src/shared/ipc-channels.ts` — interfaces e canais IPC tipados.
- `src/main/db/migrations/001-initial.sql` — tabelas `sessoes`, `parametros_de_voo` (seed 6 parâmetros), `leituras_de_parametro`.
- `src/main/db/session-repository.ts` — `criarSessao` e `buscarSessaoAtiva`.
- `src/main/db/reading-repository.ts` — `inserirLeitura`.
- `src/main/db/database.ts` + `src/main/db/migrator.ts` + `src/main/db/parameter-repository.ts` — suporte ao banco.
- `src/main/simconnect/simconnect-client.ts` — conexão SimConnect com retry silencioso a cada 5 s; subscrição de `ENG COMBUSTION:1` e 6 parâmetros.
- `src/main/simconnect/collection-service.ts` — orquestração do fluxo CA-001-1 e CA-001-2.
- `src/main/ipc/session-handler.ts` — handlers IPC + emit `session:started`.
- `src/renderer/ipc/session-ipc.ts` — wrappers tipados para o renderer.
- `src/renderer/hooks/use-active-session.ts` — hook `useActiveSession`.
- Scaffolding: `package.json`, `tsconfig*.json`, `src/main/index.ts`, `src/main/preload.ts`, `src/renderer/index.tsx`, `src/renderer/App.tsx`.

**Desvios do plano técnico:**
- `node-simconnect@4.2.1` usada (plano não especificava versão exata). API de `SimConnectPeriod.SECOND` substituiu `setInterval` manual — equivalente e mais eficiente.
- CA-001-2 coberto via estado inicial `lastEngineCombustion = false` — primeira leitura com `true` dispara sessão automaticamente.
- `parameter-repository.ts` adicionado (necessário para tarefa 6, não listado explicitamente).

**Débito técnico:**
- Campo `aeronave` preenchido com `''` — variável SimConnect fora do escopo de UC-001.
- Build config (`electron-builder`) não configurado — arquivos SQL de migration precisarão de `extraResources`.
- `ElectronApi` em `electron-api.d.ts` deve ser mantida sincronizada manualmente com `preload.ts`.

## Testes

### 2.2 Testes (UC-001)

**Testes escritos:** 7 arquivos, 35 testes
- `session-repository.test.ts` — `criarSessao` cria com `status = 'ativa'` e `encerradaEm = null`; `buscarSessaoAtiva` retorna `null` ou sessão mapeada.
- `reading-repository.test.ts` — `inserirLeitura` associa ao `sessaoId` correto.
- `parameter-repository.test.ts` — `buscarParametrosAtivos` filtra `ativo = true`.
- `migrator.test.ts` — `runMigrations` executa SQL de migration.
- `collection-service.test.ts` — CA-001-1 (motor ligado em runtime) e CA-001-2 (motor pré-ligado na inicialização); sem sessão duplicada; `inserirLeitura` com `sessaoId` correto.
- `simconnect-client.test.ts` — transição `false→true` dispara `onEngineStarted`; `true→true` não dispara; retry na falha de conexão.
- `session-handler.test.ts` — `session:get-active` retorna sessão ativa; `session:started` emitido ao renderer.

**Resultado:** ✅ 35/35 passando. `npm test` exit code 0.

**Cobertura:**
- `main/db/`: 100% statements, branches, funções, linhas.
- `main/simconnect/`: 100% funções; 94% statements/linhas (8 linhas descobertas são callbacks de `error`/`close`/`quit` em `simconnect-client.ts` — fora do escopo UC-001).

## Revisão e decisões

### Correções pós-HITL-3 (1ª rodada)

- ESLint instalado e configurado (`.eslintrc.cjs`); `eslint-config-electron` substituído por `eslint:recommended` + `@typescript-eslint` + plugins React.
- CSS global com tokens de cor e IBM Plex Sans (Google Fonts) criado em `src/renderer/styles/global.css`.
- `StatusBar.tsx` criado com 3 estados: Sessão ativa / Encerrada / Sem conexão.
- `Notification.tsx` criado — canto superior direito, 4 s, sucesso/info/erro.
- `useNotification.ts` criado.
- `useActiveSession.ts` atualizado com `loading: boolean`.
- `App.tsx` integrado: StatusBar + Notification + estado vazio correto.
- 55 testes passando após correções.

### Correções pós-HITL-3 (2ª rodada)

- `StatusBar.tsx` — 3 estados completos com tokens e labels corretos.
- `session:ended` IPC adicionado (canal, handler, preload, wrapper, App.tsx listener).
- Texto de notificação padronizado com glossário.
- Estado de carregamento (`Aguardando...`) adicionado ao `App.tsx`.
- Lint: 0 erros, 0 avisos.
- 58 testes passando após correções.

### 3.1 Funcionalidade (final)

| Critério de aceite | Status | Observação |
|--------------------|--------|------------|
| CA-001-1: Motor ligado em runtime → sessão criada e coleta iniciada | ✅ | `SimConnectClient` detecta borda de subida de `ENG COMBUSTION:1`; `CollectionService.iniciarSessao()` cria sessão e persiste leituras. |
| CA-001-2: Motor já ligado ao iniciar → sessão criada imediatamente | ⚠️ | Funciona por comportamento da borda inicial `false→true`; sem teste dedicado ao sub-caso "motor ligado + sem sessão prévia". Não bloqueante. |

**Bloqueantes:** nenhum

**Não bloqueantes:**
- Sub-caso CA-001-2 (motor ligado na primeira inicialização sem sessão prévia) funcional mas não coberto por teste dedicado.
- Campo `aeronave` persiste como `''` — débito registrado.

---

### 3.2 Qualidade (final)

**Lint:** ✅ 0 erros, 0 avisos. **Testes:** ✅ 58/58 passando.

**Conformidade:**
- ✅ `strict: true`, kebab-case, PascalCase, camelCase, UPPER_SNAKE_CASE, IPC prefixado, tipos em `shared/`, testes co-localizados, `describe`/`it('deve...')`, sem `any`.
- ⚠️ Imports relativos em vez dos aliases `@renderer/` / `@main/`.
- ⚠️ `paddingTop: '64px'` letra morta em `App.tsx` (sobrescrito por `padding` shorthand).

**Bloqueantes:** nenhum

**Não bloqueantes:**
- Imports relativos em vez de aliases absolutos (desvio uniforme, sem impacto funcional).
- `session-ipc.ts` e `App.tsx` sem arquivo de teste (não mandatório pela convenção atual).
- Propriedade CSS morta em `App.tsx`.

---

### 3.3 Usabilidade (final)

| Diretriz | Status |
|----------|--------|
| Estado "Sessão ativa" | ✅ |
| Estado "Encerrada" | ✅ |
| Estado "Sem conexão" | ✅ |
| Cor + rótulo (nunca só cor) | ✅ |
| Notificação de início de sessão | ✅ |
| Notificação de encerramento de sessão | ✅ |
| Notificação — posição, duração, tipos | ✅ |
| Tipografia IBM Plex Sans/Mono | ✅ |
| Tokens de cor aplicados | ✅ |
| Layout estrutural — barra superior fixa | ✅ |
| Estado vazio com orientação | ✅ |
| Linguagem PT-BR, terminologia do glossário | ✅ |
| Acessibilidade (aria, role) | ✅ |
| Interações em ≤ 1 clique | ✅ |

**Bloqueantes:** nenhum

**Não bloqueantes:**
- Fonte via Google Fonts (CDN externo) — pode falhar offline; recomendado empacotar `@ibm/plex` localmente.
- Contraste `warning` (#FFF sobre #F1C21B) abaixo de WCAG AA — tipo `warning` não emitido em UC-001, sem impacto imediato.

**Impactos no contexto:**
- `design.md` — nota sobre fonte local (proibir Google Fonts em produção Electron).
- `design.md` — especificar cor de texto para estado `warning` (contraste seguro).
- `design.md` — definir condição de "Encerrada" vs. "Sem conexão" no indicador de estado.
- `usability.md` — detalhar payload esperado na notificação de encerramento.

---

### 3.4 Arquitetura (final)

| Decisão arquitetural | Status | Observação |
|----------------------|--------|------------|
| ADR-001: Electron + React + TypeScript | ✅ | — |
| ADR-002: SQLite exclusivamente no main | ✅ | — |
| ADR-003: node-simconnect exclusivamente no main | ✅ | — |
| IPC nomeada e tipada, sem `remote` | ✅ | — |
| Canal `session:ended` completo na cadeia vertical | ✅ | `ipc-channels` → `session-handler` → `preload` → `electron-api.d.ts` → `session-ipc` → `App.tsx` |
| `ipcRenderer` nunca direto em componentes | ✅ | — |
| Tipos em `shared/types.ts` sem duplicação | ✅ | — |
| Estrutura de pastas | ✅ | — |
| Banco em `%APPDATA%\BlackboxSimulator\data.db` | ⚠️ | `app.getPath('userData')` depende de `appId` no electron-builder — documentar. |
| Imports com aliases `@main/` / `@renderer/` | ⚠️ | Todos os arquivos usam caminhos relativos. |
| Migrator sem controle de versão incremental | ⚠️ | Escalar para migrations futuras requer tabela de controle. |

**Bloqueantes:** nenhum

**Impactos no contexto:**
- `architecture.md` — registrar canais de push `session:started` e `session:ended` como padrão oficial; clarificar caminho do banco.
- `code_conventions.md` — documentar padrão de unsubscribe (`() => void`) nos canais de push; documentar migrator com tabela de controle de versão.

## Contexto atualizado

### 4.1 Produto
- `use_cases.md` — CA-001-1 corrigido ("os parâmetros do conjunto inicial"); novo CA para RN-001 (reconexão silenciosa).

### 4.2 Engenharia
- `architecture.md` — ADR-004 (detecção de motor via `ENG COMBUSTION:1`), ADR-005 (padrão canais de push IPC), diretriz do banco clarificada.
- `domain_model.md` — lista definitiva dos 6 parâmetros iniciais preenchida.
- `code_conventions.md` — seções `preload.ts`/`contextBridge` e Migrator adicionadas.

### 4.3 ADLC
- `loop_report.md` — linha do loop-001 adicionada na tabela.
- `lessons_learned.md` — LL-001 a LL-006 registradas.
- `backlog.md` — UC-001 movido para Concluídos; UC-002 em andamento.

### 4.4 UX
- `design.md` — fonte local obrigatória; estado `warning` com cor segura; condições do indicador de estado; "Implementado em: UC-001" nos componentes.
- `usability.md` — notificação de encerramento detalhada.

## Lições

Ver `context/adlc/lessons_learned.md` (LL-001 a LL-006).
