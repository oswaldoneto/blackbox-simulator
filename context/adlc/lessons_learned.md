# Lições aprendidas

> Propósito: O que cada loop ensinou, e onde a lição foi aplicada no contexto.
> Atualizar quando: no final de cada loop.
> Relacionados: [loop_report.md](loop_report.md)
> Última atualização: 2026-11-16 · loop-001

## Lições

LL-001
Data: 2026-11-16
Loop: loop-001
O que aconteceu: O loop-001 precisou scaffoldar o projeto inteiro (package.json, tsconfig, entry points) antes de implementar as tarefas do UC.
Lição: Scaffolding do projeto deve ser feito antes do primeiro loop de implementação. Em projetos novos, criar uma tarefa de scaffolding separada antes do primeiro loop de desenvolvimento evita misturar setup de projeto com implementação de funcionalidade.
Onde foi aplicada: backlog.md — considerar inserção de item de scaffolding antes de UC-001 em projetos futuros.

LL-002
Data: 2026-11-16
Loop: loop-001
O que aconteceu: A variável SimConnect de "motor ligado" não estava definida no contexto e precisou ser escolhida durante a implementação (`ENG COMBUSTION:1`).
Lição: Especificar variáveis SimConnect antes do refinamento técnico. Decisões de integração com APIs externas (SimConnect, neste caso) devem ser tomadas e registradas antes do refinamento técnico para evitar riscos abertos na implementação.
Onde foi aplicada: a registrar no refinamento técnico dos próximos UCs com integração SimConnect.

LL-003
Data: 2026-11-16
Loop: loop-001
O que aconteceu: O `domain_model.md` marcava o conjunto inicial de parâmetros como "Em aberto". A implementação precisou escolher 6 parâmetros ad hoc.
Lição: Conjunto inicial de parâmetros deve ser definido antes de UC-001. Itens marcados como "Em aberto" que bloqueiam implementação devem ser resolvidos antes de o loop começar.
Onde foi aplicada: a corrigir no domain_model.md antes do próximo loop.

LL-004
Data: 2026-11-16
Loop: loop-001
O que aconteceu: A convenção de código referenciava `eslint-config-electron` que não existe no registro npm. Substituído por `eslint:recommended` + `@typescript-eslint/recommended` + plugins React.
Lição: `eslint-config-electron` não existe como pacote npm com esse nome. Atualizar a convenção para refletir o preset real antes do próximo loop.
Onde foi aplicada: a corrigir no arquivo de convenções de código antes do próximo loop.

LL-005
Data: 2026-11-16
Loop: loop-001
O que aconteceu: O primeiro ciclo de implementação entregou apenas um `App.tsx` esqueleto. A revisão de usabilidade identificou 5 bloqueantes de UI (StatusBar, Notification, tipografia, tokens, layout).
Lição: UI mínima não é suficiente — componentes de feedback visual são critério de aceite implícito. Para UCs que envolvem coleta automática de dados, o feedback visual do estado do sistema deve ser incluído explicitamente nos critérios de aceite do refinamento técnico.
Onde foi aplicada: a incluir explicitamente nos critérios de aceite de UC-002 e seguintes.

LL-006
Data: 2026-11-16
Loop: loop-001
O que aconteceu: IBM Plex Sans foi carregada via Google Fonts CDN. Aplicações Electron frequentemente rodam offline (junto ao simulador, sem internet).
Lição: Fonte tipográfica via CDN externo é incompatível com uso offline do Electron. Fontes devem ser empacotadas localmente no instalador.
Onde foi aplicada: a corrigir no próximo loop — empacotar IBM Plex Sans como asset local.

## Modelo de lição

<!--
LL-001
Data:
Loop:
O que aconteceu:
Lição:
Onde foi aplicada:
-->
