# Lições aprendidas

> Propósito: O que cada loop ensinou, e onde a lição foi aplicada no contexto.
> Atualizar quando: no final de cada loop.
> Relacionados: [loop_report.md](loop_report.md)
> Última atualização: 2026-11-17 · loop-005

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

LL-012
Data: 2026-11-17
Loop: loop-003
O que aconteceu: O `tsconfig.main.json` compila os testes junto com o código do main. Na 2.1, a mudança de tipo em `Sessao` (campo `parametrosNaoAplicaveis`) quebrou o `npm run build` por causa dos testes antigos, e o build só voltou a passar na 2.2, quando o tester ajustou os testes. Os testes também vão para `dist/main`.
Lição: Quando o build do código de produção depende dos testes, a 2.1 não consegue entregar um build verde sem editar testes, o que embaralha a fronteira entre implementar (2.1) e testar (2.2). Separar a compilação dos testes do build de produção devolve à 2.1 um critério de pronto próprio.
Onde foi aplicada: débito técnico 5 em loop_reports/loop-003.md; a tratar num loop futuro.

LL-013
Data: 2026-11-17
Loop: loop-003
O que aconteceu: Além dos testes do migrator com mocks, a 2.2 criou `migrator-sqlite.test.ts`, que roda o SQL real das migrations com `node:sqlite` (banco novo, banco do loop-002 com dados, reexecução, falha desfeita). O app também foi aberto sobre o banco real do loop-002, e a migração registrou 001 e 002 em `schema_migrations` com 12 parâmetros ativos.
Lição: Mudança de schema deve ser testada com SQL real e sobre um banco de verdade da versão anterior. Mocks confirmam a ordem das chamadas, mas não que o SQL roda nem que os dados existentes sobrevivem.
Onde foi aplicada: loop-003, decisão 4 do HITL-1 (teste real com `node:sqlite`) e etapa 2.2; convenção a registrar em code_conventions.md (4.2).

LL-014
Data: 2026-11-17
Loop: loop-003
O que aconteceu: As decisões de produto do UC-006 foram tomadas antes do loop, via `/context-product`. Mesmo assim, a 1.1 levantou 9 pontos para decisão humana: critério de N/A, momento da decisão, prioridade sobre "—", formatos, motor 1, debriefing, sessões antigas e layout do painel.
Lição: Decidir o produto antes do loop reduz as perguntas da 1.1, mas não basta descrever o que entra. O `/context-product` deve aprofundar critérios de estados especiais (como N/A), formatos de exibição e casos limite (zero, sessões antigas, troca de aeronave) para que a 1.1 chegue com menos lacunas.
Onde foi aplicada: a aplicar no `/context-product` dos próximos itens.

LL-015
Data: 2026-11-17
Loop: loop-003
O que aconteceu: A revisão de usabilidade apontou que Manete, Mistura e RPM não indicam o motor lido. No HITL-3, o humano decidiu que o produto suporta, por enquanto, só aeronaves de um motor: os rótulos ficaram sem o motor e o CA-006-3 (motor 1 em multimotor) deixou de ser critério.
Lição: Uma decisão de escopo pode resolver um achado de revisão com menos trabalho que uma mudança de interface. Ela também pode chegar no meio do loop; quando chega, precisa ser propagada ao produto (product.md, UC) e ao roteiro manual na fase Documentar. Perguntar o escopo (como "multimotor entra?") já na 1.1 evitaria a decisão tardia.
Onde foi aplicada: loop-003, decisões do HITL-3; product.md e UC-006 na 4.1.

LL-016
Data: 2026-11-17
Loop: loop-004
O que aconteceu: Como no loop-002, a revisão não teve bloqueantes, mas encontrou itens de tela pequenos (mensagem de erro do encerramento e tempo da notificação), e o humano preferiu corrigi-los numa 2ª rodada curta, só com usabilidade. A 2ª rodada aprovou os ajustes, mas levantou 4 novos itens menores (tempo de leitura do erro, notificação mais alta sobre o card, anúncio da notificação remontada, "próxima abertura"), que foram para débito.
Lição: Uma rodada curta sobre ajustes de tela tende a gerar novos achados menores sobre os próprios ajustes, e sem um critério de parada o loop pode girar em rodadas sucessivas. Vale definir um critério, por exemplo: no máximo uma rodada curta por loop, e o que ela levantar sem bloqueante vai direto para débito. O critério é decisão do humano e ainda não foi tomado.
Onde foi aplicada: loop-004, decisões do HITL-3 (1ª e 2ª rodadas); regra registrada no HITL-4 em agent_development_lifecycle.md (HITL-3) e nas skills loop-review (.bob e .claude).

LL-017
Data: 2026-11-17
Loop: loop-004
O que aconteceu: Na 2ª rodada, o tester criou testes com fake timers para o reinício dos 4 s da notificação. O orquestrador removeu a correção (`key={notification.id}`) e 4 testes de `App.test.tsx` falharam; com a correção, todos passaram.
Lição: Um teste de mutação simples (remover a correção e ver o teste falhar) é uma forma barata de confirmar que o teste pega o problema que motivou o ajuste, sobretudo em comportamentos com tempo, em que um teste pode passar por acaso.
Onde foi aplicada: loop-004, etapa 2.2 da 2ª rodada.

LL-018
Data: 2026-11-17
Loop: loop-004
O que aconteceu: As decisões de comportamento com tempo (15 s de motor parado no solo, contagem mantida na queda de conexão, hora de fim no início do período) ficaram fáceis de testar porque o detector de encerramento foi feito como função pura medida pelos instantes das amostras, sem timer. Foram 26 testes com amostras e instantes explícitos. Só a verificação na abertura, que depende de um prazo sem amostras, precisou de fake timers.
Lição: Regras de negócio com tempo devem ser medidas pelos instantes dos dados sempre que possível, numa função pura com o estado guardado fora dela. Isso deixa cada decisão do humano verificável por um caso de teste explícito e reserva timers só para o que depende da ausência de dados.
Onde foi aplicada: loop-004, tarefa 2 da 1.2 e etapa 2.2; convenção a registrar em code_conventions.md (4.2).

LL-019
Data: 2026-11-17
Loop: loop-004
O que aconteceu: Durante uma pergunta com várias decisões, o humano respondeu parte delas por mensagem livre. Só as decisões respondidas foram registradas; as demais foram perguntadas de novo.
Lição: Quando a resposta a uma pergunta múltipla chega parcial ou em texto livre, registrar só o que foi decidido de forma explícita e perguntar de novo o restante, em vez de inferir a escolha pelo padrão proposto.
Onde foi aplicada: loop-004, registro das decisões dos HITL em loop_reports/loop-004.md.

LL-020
Data: 2026-11-17
Loop: loop-005
O que aconteceu: A regra de no máximo uma rodada curta por loop, criada no HITL-4 do loop-004 (LL-016), foi aplicada pela primeira vez. O HITL-3 escolheu 5 ajustes; a revisão curta, só de usabilidade, aprovou os ajustes e levantou 2 itens novos menores (foco no `body` durante a recarga da lista e duração da tela do voo sem versão por extenso), que foram direto para débito, sem uma 2ª rodada.
Lição: A regra funcionou como critério de parada: o humano escolheu de uma vez o pacote de ajustes que valia corrigir, e os achados da rodada curta não abriram outra rodada. Vale manter a regra e, ao escolher os ajustes no HITL-3, agrupar num só pacote tudo o que se quer corrigir no loop.
Onde foi aplicada: loop-005, decisões do HITL-3 (1ª rodada e rodada curta) em loop_reports/loop-005.md; regra em agent_development_lifecycle.md (HITL-3).

LL-021
Data: 2026-11-17
Loop: loop-005
O que aconteceu: Na 2.2 da rodada curta, o tester encontrou um defeito causado pelo próprio ajuste 3: com hora de fim nula, o rótulo do card saía "duração duração indisponível". O developer corrigiu dentro da rodada (constante `DURACAO_INDISPONIVEL`), antes da revisão curta.
Lição: Um defeito introduzido pelos ajustes da rodada curta não é "item novo" levantado por ela: é parte do ajuste não terminado e deve ser corrigido dentro da própria rodada, não mandado para débito. A regra da rodada curta única fala só do que a revisão levanta; deixar explícita essa distinção é decisão do humano.
Onde foi aplicada: loop-005, etapa 2.2 da rodada curta; regra registrada no HITL-4 em agent_development_lifecycle.md (HITL-3) e nas skills loop-review (.bob e .claude).

LL-022
Data: 2026-11-17
Loop: loop-005
O que aconteceu: Sem o simulador e sem o Windows, o app foi aberto no macOS e conferido pelo protocolo de depuração do Chromium (CDP): navegação para "Voos", leitura do título, do estado vazio oficial e do `aria-current`, e console sem erros. Isso complementou os testes automatizados, que rodam em jsdom.
Lição: Conferir o app real pelo CDP (navegar, clicar e ler a tela e os atributos de acessibilidade) é um passo barato entre os testes automatizados e o roteiro manual no Windows. Ele confirma a ligação real entre main, preload e renderer e deixa para o Windows só o que depende do simulador ou do sistema (fuso, largura da janela, leitor de tela).
Onde foi aplicada: loop-005, conferência no app da etapa 2.2.

LL-023
Data: 2026-11-17
Loop: loop-005
O que aconteceu: A 1.1 propôs mostrar a aeronave no card do voo porque o campo existe na Sessão. O refinamento técnico (1.2) descobriu que `aeronave` nunca foi gravado (criado com `''`, sem leitura do SimConnect) e que os aeródromos ficam sempre `null`. No HITL-1, a aeronave saiu do card e virou item novo do backlog.
Lição: Antes de especificar que o produto exibe um dado, confirmar no código que ele é de fato gravado. Um campo no modelo de domínio não garante que tenha valor. Na 1.1, dados a exibir vindos do banco devem entrar como "a confirmar no refinamento técnico", e o domain_model.md deve indicar campos ainda não preenchidos.
Onde foi aplicada: loop-005, 1.2 e decisão 1 do HITL-1; domain_model.md (4.2) com os campos gravados vazios; backlog item 9.

## Modelo de lição

<!--
LL-001
Data:
Loop:
O que aconteceu:
Lição:
Onde foi aplicada:
-->
