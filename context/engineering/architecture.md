# Arquitetura

> Propósito: Visão geral da arquitetura no modelo C4, diretrizes arquiteturais e registro das decisões.
> Atualizar quando: uma decisão arquitetural for tomada ou revista.
> Relacionados: [domain_model.md](domain_model.md), [code_conventions.md](code_conventions.md)
> Última atualização: 2026-11-16 · loop-001

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
- O banco SQLite fica em `%APPDATA%\BlackboxSimulator\data.db` para garantir persistência entre atualizações do instalador. Esse caminho é resolvido por `app.getPath('userData')` com `appName = 'BlackboxSimulator'` configurado no electron-builder.
- O renderer não mantém estado de sessão local: busca via IPC ao main sempre que precisar.

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

## Modelo de ADR

<!--
ADR-001
Status:
Contexto:
Decisão:
Consequências:
-->
