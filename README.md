# Blackbox Simulator

Caixa-preta digital para simulador de voo. O app roda na mesma máquina do Microsoft Flight Simulator 2024, coleta os parâmetros do voo, grava tudo num banco local e mostra os dados em tempo real e depois do voo, para o piloto entender o que aconteceu e onde melhorar.

## O que ele faz

- **Coleta automática.** A sessão começa sozinha quando o motor é ligado e termina quando a aeronave fica 15 s no solo com o motor parado. Nada é enviado ao simulador: o app só lê.
- **Painel de tempo real.** São 12 parâmetros, atualizados a cada 1 s:
  - altitude, velocidade (IAS), velocidade vertical e rumo;
  - arfagem, rolagem, latitude e longitude;
  - manete, mistura, RPM e flapes.

  Cada card mostra o valor atual e um gráfico de linha dos últimos 2 minutos.
- **Lista de voos.** Mostra os voos gravados, com data, hora de início e duração.
- **Debriefing.** Revisa um voo gravado com:
  - reprodução em 1×, 4× ou 16× e linha do tempo;
  - trajetória no mapa;
  - painel de instrumentos (velocímetro, horizonte artificial, altímetro, tacômetro, bússola, variômetro, manete, mistura e flapes);
  - perfil vertical.

  Só aparecem valores gravados, sem interpolar.

Por enquanto, o app suporta só aeronaves de um motor.

## Instalação no Windows

Baixe o instalador `BlackboxSimulator-Setup-<versão>.exe` da [última release](https://github.com/oswaldoneto/blackbox-simulator/releases/latest) e execute. Depois, abra o simulador e ligue o motor: o painel aparece sozinho.

## Desenvolvimento

Requisitos: Node 22.22+ ou 24.15+. Para coletar dados, o Windows com o MSFS 2024 também é necessário. Sem o simulador, o app abre normalmente e fica aguardando a conexão.

```bash
npm install
```

```bash
npm run build && npm start
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Vite e compilação do main em modo watch |
| `npm run build` | Gera o renderer e o main em `dist/` |
| `npm start` | Abre o app com o Electron |
| `npm test` | Testes unitários e de integração (Vitest) |
| `npm run lint` | ESLint |
| `npm run dist:win` | Gera o instalador do Windows em `release/` |

Uma tag `v*` enviada ao GitHub dispara o workflow [Instalador Windows](.github/workflows/release-windows.yml), que publica o `.exe` numa release.

### Tecnologia

- Electron 29, com o processo principal em TypeScript e o preload em sandbox (empacotado com esbuild).
- React no renderer, com Vite.
- SQLite local (better-sqlite3), com migrações versionadas.
- SimConnect, por meio do node-simconnect.

## Como o projeto é desenvolvido

O projeto é construído com agentes de IA seguindo um ciclo próprio, o **ADLC** (Agent Development Lifecycle). Cada item do backlog vira um loop com quatro fases, e cada fase termina num checkpoint humano:

1. **Planejar:** especificação de negócio e refinamento técnico.
2. **Implementar:** código e testes.
3. **Revisar:** funcionalidade, qualidade, usabilidade e arquitetura, em paralelo.
4. **Documentar:** atualização do contexto e das lições aprendidas.

O contexto que os agentes leem e mantêm fica em [`context/`](context/):

| Pasta | Conteúdo |
|---|---|
| [`context/product/`](context/product/) | Produto, glossário, regras de negócio e casos de uso |
| [`context/ux/`](context/ux/) | Design e usabilidade |
| [`context/engineering/`](context/engineering/) | Modelo de domínio, arquitetura (ADRs) e convenções de código |
| [`context/adlc/`](context/adlc/) | O ciclo, o backlog, os relatórios de cada loop e as lições aprendidas |

Os agentes e as skills existem em duas versões equivalentes: [`.claude/`](.claude/), para o Claude Code, e [`.bob/`](.bob/), para o IBM Bob. Um loop começa com `/loop-start`. As instruções gerais para os agentes estão em [AGENTS.md](AGENTS.md).

A apresentação da mentoria do Bootcamp IBM Bob, que mostra o processo, está em [`presentation/`](presentation/).
