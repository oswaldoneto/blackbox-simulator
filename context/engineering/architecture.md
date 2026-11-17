# Arquitetura

> Propósito: Visão geral da arquitetura no modelo C4, diretrizes arquiteturais e registro das decisões.
> Atualizar quando: uma decisão arquitetural for tomada ou revista.
> Relacionados: [domain_model.md](domain_model.md), [code_conventions.md](code_conventions.md)
> Última atualização: 2026-11-16 · loop-002

## Visão geral

Blackbox Simulator é uma aplicação desktop para Windows construída com **Electron + React**. O processo principal do Electron (Node.js) é responsável pela coleta de dados via SimConnect e pela persistência em SQLite. O processo de renderização (React) exibe os dados em tempo real e o debriefing. A comunicação entre os dois processos usa IPC do Electron.

## C4 nível 1: Contexto

```mermaid
C4Context
  title Blackbox Simulator — Contexto

  Person(piloto, "Piloto", "Usa o Blackbox Simulator para analisar seus voos.")

  System(blackbox, "Blackbox Simulator", "Coleta, registra e visualiza parâmetros de voo.")

  System_Ext(msfs, "Microsoft Flight Simulator 2024", "Simulador de voo que expõe dados via SimConnect.")

  Rel(piloto, blackbox, "Visualiza parâmetros e debriefing")
  Rel(blackbox, msfs, "Lê parâmetros de voo via SimConnect (somente leitura)")
```

## C4 nível 2: Contêineres

```mermaid
C4Container
  title Blackbox Simulator — Contêineres

  Person(piloto, "Piloto")

  System_Ext(msfs, "Microsoft Flight Simulator 2024", "Expõe dados via SimConnect SDK")

  Container_Boundary(app, "Blackbox Simulator (Electron)") {
    Container(renderer, "Interface (React)", "TypeScript + React", "Exibe parâmetros em tempo real e tela de debriefing.")
    Container(main, "Processo principal (Node.js)", "TypeScript + Electron Main", "Gerencia ciclo de vida, coleta SimConnect e persistência.")
    ContainerDb(db, "Banco de dados local", "SQLite (better-sqlite3)", "Armazena sessões e leituras de parâmetros.")
  }

  Rel(piloto, renderer, "Interage via interface gráfica")
  Rel(renderer, main, "Solicita dados e ações via Electron IPC")
  Rel(main, msfs, "Lê parâmetros via node-simconnect (SimConnect SDK)")
  Rel(main, db, "Lê e grava sessões e leituras")
```

## Diretrizes

- O processo principal (main) é o único autorizado a acessar o SimConnect e o banco de dados. O renderer nunca acessa diretamente.
- Toda comunicação entre renderer e main usa canais IPC nomeados e tipados. Não usar `remote` do Electron.
- O main opera em modo passivo em relação ao simulador: somente leitura, nunca envia comandos (RN-006).
- A coleta de parâmetros ocorre em intervalo fixo de 1 segundo via polling ao SimConnect.
- O banco SQLite fica em `%APPDATA%\BlackboxSimulator\data.db` para garantir persistência entre atualizações do instalador. Esse caminho é resolvido por `app.getPath('appData')` mais a pasta fixa `BlackboxSimulator`, e por isso não depende do nome do app nem do instalador.
- O renderer não mantém estado de sessão próprio: a fonte da verdade sobre sessão, conexão e leituras é o main, consultado por invoke ou recebido por push. O renderer pode guardar estado de exibição temporário, derivado do que o main enviou, enquanto a tela estiver aberta: a sessão encerrada, os últimos valores congelados e o indicador `semDados` (ADR-007). Esse estado não é persistido nem enviado de volta ao main.

## Canais IPC

Todos definidos em `src/shared/ipc-channels.ts` e expostos pelo preload (ADR-005).

| Canal | Tipo | Direção | Carga | Desde |
|-------|------|---------|-------|-------|
| `session:get-active` | invoke | renderer → main | retorna `Sessao \| null` | loop-001 |
| `session:started` | push | main → renderer | `Sessao` | loop-001 |
| `session:ended` | push | main → renderer | `Sessao` (a função emissora existe, mas nada a chama até o UC-003) | loop-001 |
| `parameter:list-active` | invoke | renderer → main | retorna `ParametroDeVoo[]` com `ativo = true` (RN-002) | loop-002 |
| `parameter:readings` | push | main → renderer | `PacoteDeLeituras`, um por ciclo de coleta (1 s), só com sessão ativa | loop-002 |
| `connection:get-state` | invoke | renderer → main | retorna `EstadoConexao` | loop-002 |
| `connection:state-changed` | push | main → renderer | `EstadoConexao`, só nas transições | loop-002 |

## Decisões arquiteturais (ADR)

---

ADR-001
Status: aceita
Contexto: O produto roda localmente no Windows ao lado do Microsoft Flight Simulator 2024. Precisa de instalador, interface gráfica nativa e integração com SimConnect via Node.js.
Decisão: Usar Electron como runtime de desktop com React no processo de renderização e TypeScript em ambos os processos.
Consequências: Instalador de ~100–200 MB. Ecossistema maduro (electron-builder, node-simconnect). Chromium embutido consome mais memória que alternativas como Tauri; aceitável dado o escopo local.

---

ADR-002
Status: aceita
Contexto: O produto precisa persistir sessões e leituras de parâmetros localmente, sem dependência de servidor externo.
Decisão: Usar SQLite via better-sqlite3 como banco de dados local embutido.
Consequências: Sem instalação adicional para o usuário. Banco é um arquivo único em %APPDATA%, fácil de fazer backup. Limitação: sem acesso concorrente multi-processo, adequado para o uso local previsto.

---

ADR-003
Status: aceita
Contexto: O processo principal precisa ler dados do Microsoft Flight Simulator 2024 em tempo real sem interferir no simulador.
Decisão: Usar node-simconnect para integração com o SimConnect SDK da Microsoft via binding direto no processo main do Electron.
Consequências: Integração direta sem processo auxiliar. Dependência de SDK nativo Windows (SimConnect.dll); o produto só funciona no Windows com MSFS instalado. Binding node-simconnect é mantido pela comunidade.

---

ADR-004
Status: aceita
Contexto: O sistema precisa detectar o momento em que o motor da aeronave é ligado no simulador para criar uma nova sessão automaticamente.
Decisão: Usar a variável SimConnect `ENG COMBUSTION:1` (INT32, bool) subscrita via `SimConnectPeriod.SECOND`. A detecção é feita pela transição `false → true` no campo `lastEngineCombustion`. Se o motor já estiver ligado ao iniciar o app, a primeira leitura dispara a sessão automaticamente.
Consequências: Latência máxima de 1 segundo para detectar o início do motor. A variável `ENG COMBUSTION:1` é compatível com MSFS 2024; validação com aeronaves específicas pode ser necessária em versões futuras.

---

ADR-005
Status: aceita
Contexto: O main precisa notificar o renderer sobre eventos assíncronos (sessão iniciada, sessão encerrada) sem que o renderer precise fazer polling.
Decisão: Canais de push são definidos em `shared/ipc-channels.ts`, emitidos via `webContents.send()` no main e expostos via `contextBridge` no preload como funções que registram callback e retornam `() => void` (unsubscribe).
Consequências: Padrão consistente e tipado para todos os eventos assíncronos do sistema.

---

ADR-006
Status: aceita
Contexto: O usuário precisa instalar o app no Windows sem clonar o repositório nem ter Node.js. O `better-sqlite3` é um módulo nativo e precisa ser compilado para Windows e para a versão do Node embutida no Electron, o que o electron-builder não faz com segurança a partir do macOS.
Decisão: Gerar o instalador NSIS (`BlackboxSimulator-Setup-<versão>.exe`, x64) no GitHub Actions, num runner `windows-latest` (`.github/workflows/release-windows.yml`). Uma tag `v*` publica o instalador numa Release do GitHub; uma execução manual só gera o instalador como artefato da execução.
Consequências: Cada versão publicada sai de uma tag, e o instalador é sempre gerado num Windows real. O instalador não é assinado, então o Windows SmartScreen avisa na primeira execução; tirar o aviso exige um certificado de assinatura de código.

---

ADR-007
Status: aceita (loop-002)
Contexto: O painel de tempo real (UC-002) precisa mostrar os parâmetros do conjunto inicial com cadência de 1 s e atraso máximo de 2 s entre o simulador e a tela, sem afetar o simulador (RN-006). O painel também precisa saber se há conexão com o SimConnect para mostrar o estado "sem sinal".
Decisão:
- Leituras por push: a cada `simObjectData`, o `simconnect-client` emite um lote (`onParameterBatch`); o `collection-service` repassa o lote como `PacoteDeLeituras` (`onLeituras`) no mesmo ciclo da coleta, a partir da memória, num caminho separado da gravação no SQLite (`onParameterReading` → `inserirLeitura`), sem timer próprio. O pacote só é emitido com sessão ativa e leva o `sessaoId`. O main o envia pelo canal `parameter:readings`.
- Estado de conexão por push mais invoke inicial: o main emite `connection:state-changed` só nas transições (`conectado` ↔ `desconectado`); o renderer consulta `connection:get-state` na montagem para não perder o estado vigente. Se um evento chegar antes da resposta da consulta, a resposta é descartada.
- O catálogo de parâmetros exibidos vem de `parameter:list-active` (filtro `ativo = 1` no main, RN-002).
- Limite de 2 s sem dados no renderer: com sessão ativa, se passarem `SEM_DADOS_LIMITE_MS` (2000 ms) sem pacote novo, o painel marca `semDados` e troca os valores por "—"; volta ao receber pacote. Conexão perdida com sessão ativa também zera os valores. Sessão encerrada congela os últimos valores e ignora pacotes de outra sessão; nova sessão zera.
- A precedência dos estados do painel fica em `derivePanelState({ sessao, conexao, semDados })`: sem sessão, encerrada, sem sinal, ativa.
Consequências: Uma mensagem IPC por segundo com 6 números, sem custo relevante. O valor exibido é o lido do SimConnect, não o gravado, então uma falha de gravação não aparece no painel. O limite de 2 s mora no renderer e cobre o caso de conexão aberta sem dados (menu, sem aeronave). Valores congelados e `semDados` são estado de exibição temporário no renderer (ver Diretrizes). O atraso real e as colunas da grade ainda dependem do roteiro manual no Windows com MSFS.

---

## Em aberto

- Identificadores dos parâmetros (slugs como `altitude_msl`) escritos à mão em três lugares, no main e no renderer (ordem de exibição e formatação), fora de `shared/`. Levantado na revisão do loop-002 (3.4); decisão humana pendente sobre centralizá-los em `shared/`.

## Modelo de ADR

<!--
ADR-001
Status:
Contexto:
Decisão:
Consequências:
-->
