# Convenções de código

> Propósito: Convenções que os agentes de código devem seguir.
> Atualizar quando: uma convenção for criada ou mudar, inclusive por uma lição aprendida.
> Relacionados: [architecture.md](architecture.md)
> Última atualização: 2026-11-16

## Linguagem e estilo

- Linguagem: TypeScript estrito (`strict: true` no tsconfig) em todos os arquivos, main e renderer.
- Formatação: Prettier com configuração padrão (sem ponto-e-vírgula opcional, aspas simples).
- Linting: ESLint com preset `eslint-config-electron` + plugin `@typescript-eslint`.
- Nenhum `any` explícito. Usar `unknown` quando o tipo não for conhecido e fazer narrowing.
- Imports absolutos com alias `@main/` para o processo main e `@renderer/` para o renderer.

## Estrutura de pastas

```
src/
  main/           # Processo principal do Electron (Node.js)
    simconnect/   # Integração com SimConnect (coleta de dados)
    db/           # Acesso ao banco SQLite (queries, migrações)
    ipc/          # Handlers dos canais IPC expostos ao renderer
    index.ts      # Entry point do main
  renderer/       # Processo de renderização (React)
    components/   # Componentes React reutilizáveis
    pages/        # Telas da aplicação (uma pasta por tela)
    hooks/        # Custom hooks
    ipc/          # Chamadas IPC para o main (wrappers tipados)
    App.tsx
    index.tsx
  shared/         # Tipos e constantes compartilhados entre main e renderer
    types.ts
    ipc-channels.ts
```

## Nomes

- Arquivos e pastas: `kebab-case` (ex.: `session-repository.ts`, `parameter-card.tsx`).
- Componentes React: `PascalCase` (ex.: `ParameterCard`, `SessionList`).
- Funções, variáveis e hooks: `camelCase` (ex.: `fetchSessions`, `useActiveSession`).
- Constantes globais: `UPPER_SNAKE_CASE` (ex.: `POLLING_INTERVAL_MS`).
- Canais IPC: string literal prefixada pelo domínio (ex.: `session:start`, `session:list`, `parameter:readings`), definidos em `shared/ipc-channels.ts`.
- Entidades do domínio seguem os nomes do domain_model.md: `Sessao`, `ParametroDeVoo`, `LeituraDeParametro`.

## Testes

- Framework: Vitest para testes unitários; Playwright para testes de integração de UI.
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
