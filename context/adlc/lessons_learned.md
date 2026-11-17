# Lições aprendidas

> Propósito: O que cada loop ensinou, e onde a lição foi aplicada no contexto.
> Atualizar quando: no final de cada loop.
> Relacionados: [loop_report.md](loop_report.md)
> Última atualização: 2026-11-16 · loop-002

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

LL-007
Data: 2026-11-16
Loop: loop-002
O que aconteceu: A especificação de negócio (1.1) do UC-002 levantou 7 perguntas para decisão humana (forma do painel, aparecimento automático, conjunto inicial e rótulos, cadência e atraso, estados sem sessão, encerrada e sem conexão, grade, maximização). Elas foram respondidas pelo humano antes do refinamento técnico (1.2).
Lição: Perguntar as decisões humanas levantadas na 1.1 antes de iniciar a 1.2. Assim o refinamento técnico parte de decisões tomadas em vez de adivinhar, e o HITL-1 fica restrito ao que o refinamento técnico trouxe de novo.
Onde foi aplicada: loop-002, seção "Decisões do humano" da 1.1 em loop_reports/loop-002.md.

LL-008
Data: 2026-11-16
Loop: loop-002
O que aconteceu: O encerramento do loop-001 deixou o item 2 (UC-002) em "Em andamento" no backlog sem loop aberto, o que divergiu da regra do loop-start ao iniciar o loop-002.
Lição: "Em andamento" só deve ter item quando há loop aberto. No encerramento, o item entregue vai para "Concluídos" e "Em andamento" fica vazio; quem move o próximo item para "Em andamento" é o loop-start.
Onde foi aplicada: backlog.md no encerramento do loop-002 ("Em andamento" vazio).

LL-009
Data: 2026-11-16
Loop: loop-002
O que aconteceu: A revisão não teve bloqueantes, mas encontrou itens menores com impacto no piloto (aviso de sem sinal, erro nas consultas iniciais, anúncio duplo). O HITL-3 mandou corrigir só esses 3; depois da correção, a revisão foi refeita só por funcionalidade e usabilidade, sobre os ajustes.
Lição: Quando o retorno do HITL-3 é pequeno e localizado, uma 2ª rodada curta, só com os revisores envolvidos e só sobre os ajustes, basta. Os demais itens menores vão para débito técnico registrado.
Onde foi aplicada: loop-002, HITL-3 (1ª e 2ª rodadas) e "Débito técnico do loop" em loop_reports/loop-002.md.

LL-010
Data: 2026-11-16
Loop: loop-002
O que aconteceu: O sentido dos sinais de arfagem e rolagem no SimConnect, o atraso real entre o simulador e o painel e as colunas da grade não podem ser validados nos testes automatizados nem no macOS, sem o simulador.
Lição: Validações que dependem do simulador real devem ser identificadas no refinamento técnico e ter roteiro manual no Windows com MSFS antes de encerrar o loop, com um instalador gerado a partir da branch do loop.
Onde foi aplicada: loop-002, decisões do HITL-1 (validação manual) e do HITL-3 (branch `loop-002` e instalador pelo workflow manual).

LL-011
Data: 2026-11-16
Loop: loop-002
O que aconteceu: O loop-002 foi o primeiro a rodar no Claude Code, com agentes e skills espelhando a configuração do .bob.
Lição: Com duas configurações de agentes para o mesmo processo, elas precisam ficar equivalentes: ao mudar um agente ou uma skill numa, espelhar na outra na mesma entrega.
Onde foi aplicada: context/adlc/agent_development_lifecycle.md, seção "Ferramentas", e AGENTS.md (seção "Loop de desenvolvimento").

## Modelo de lição

<!--
LL-001
Data:
Loop:
O que aconteceu:
Lição:
Onde foi aplicada:
-->
