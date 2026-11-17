# Convenções de código

> Propósito: Convenções que os agentes de código devem seguir.
> Atualizar quando: uma convenção for criada ou mudar, inclusive por uma lição aprendida.
> Relacionados: [architecture.md](architecture.md)
> Última atualização: 2026-11-16 · loop-002

## Linguagem e estilo

- Linguagem: TypeScript estrito (`strict: true` no tsconfig) em todos os arquivos, main e renderer.
- Formatação: Prettier com configuração padrão (sem ponto-e-vírgula opcional, aspas simples).
- Linting: ESLint com preset `eslint-config-electron` + plugin `@typescript-eslint`.
- Nenhum `any` explícito. Usar `unknown` quando o tipo não for conhecido e fazer narrowing.
- Imports absolutos com alias `@main/` para o processo main e `@renderer/` para o renderer. Na prática o código atual usa imports relativos (ver "Em aberto").

## Estilos e fontes

- CSS em arquivo (ex.: `realtime-panel.css`, ao lado do componente) quando o estilo precisar de media query ou de regra que o estilo inline não expressa. No resto, estilo inline com os tokens de design.md.
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
    components/   # Componentes React reutilizáveis e utilitários que só eles usam
    pages/        # Telas da aplicação (uma pasta por tela; ainda não criada)
    hooks/        # Custom hooks
    ipc/          # Chamadas IPC para o main (wrappers tipados)
    styles/       # CSS global (fontes, tokens)
    App.tsx
    index.tsx
  shared/         # Tipos e constantes compartilhados entre main e renderer
    types.ts
    ipc-channels.ts
```

- Utilitários de formatação e de derivação de estado de tela ficam ao lado do componente que os usa, em `components/` (ex.: `format-parameter-value.ts`, `panel-state.ts`). Hooks que falam com o main ficam em `hooks/`.

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

- A partir da segunda migration, `src/main/db/migrator.ts` deve usar uma tabela de controle de versão (ex.: `schema_migrations`) para rastrear quais migrations já foram aplicadas e evitar reexecução.

## Em aberto

Levantado na revisão do loop-002 (3.2 e 3.4); aguarda decisão humana.

- Aliases de import: a convenção pede `@main/` e `@renderer/` (e a revisão citou `@shared/`), mas o código usa imports relativos desde antes do loop-002. Decidir entre aplicar os aliases ou trocar a convenção para imports relativos.
- Prettier: a linha "configuração padrão (sem ponto-e-vírgula opcional, aspas simples)" se contradiz, porque o padrão do Prettier usa ponto-e-vírgula e aspas duplas. Não há `.prettierrc` nem script de formatação, e o formatador não é aplicado. Decidir a configuração e se ela entra num script ou no lint.
