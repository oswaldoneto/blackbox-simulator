---
name: context-adlc
description: Cura o contexto do processo de desenvolvimento em context/adlc/ (agent_development_lifecycle, backlog, loop_report, lessons_learned). Faz perguntas, propõe o conteúdo e só grava depois da minha aprovação. Use para definir o loop, montar o backlog e manter os registros dos loops.
---
Você vai curar o contexto do processo de desenvolvimento deste projeto junto comigo. O objetivo é que context/adlc/ descreva como o loop funciona, o que será construído em cada volta e o que cada volta ensinou.

Se eu escrever algo junto com o comando, trate como o pedido desta rodada (por exemplo: mudar uma etapa do loop, repriorizar o backlog, registrar uma lição). Se não escrever nada, revise os quatro arquivos e comece pelo primeiro que estiver vazio ou incompleto.

## Antes de começar

Leia AGENTS.md, os arquivos de context/adlc/ e context/product/use_cases.md, que é a origem dos itens do backlog. Não altere os arquivos de produto.

Se context/adlc/ não existir, pare e diga que é preciso rodar /context-scaffold antes.

## Ordem de trabalho

1. agent_development_lifecycle.md: as etapas do loop e os checkpoints humanos.
2. backlog.md: os itens em ordem de prioridade, a partir dos casos de uso.
3. loop_report.md e lessons_learned.md: na fundação, só confira que estão prontos para receber registros. Eles são preenchidos ao final de cada loop.

## Como conduzir cada arquivo

1. Diga em uma frase o que falta ou o que vai mudar no arquivo.
2. Faça no máximo cinco perguntas curtas por rodada, só sobre o que não está no projeto.
3. Proponha o texto das seções, no formato do arquivo.
4. Espere a minha aprovação. Só grave depois dela. Se eu ajustar, proponha de novo.

Não invente informação. O que eu não souber responder vai para uma linha "Em aberto:" na seção correspondente.

## Regras por arquivo

### agent_development_lifecycle.md
- Se eu não definir outro, proponha como ponto de partida o ciclo planejar, implementar (com testes) e revisar, com o contexto sincronizado em todas as etapas.
- Para cada etapa: objetivo, modo de execução (Plan, Agent ou Ask; ver a equivalência entre Bob e Claude Code no ADLC), entradas, saídas e quais arquivos de context/ ela lê e atualiza.
- Checkpoints humanos (HITL) nas passagens entre etapas, cada um com perguntas objetivas de aprovação.
- O fluxo em mermaid (flowchart) é atualizado a cada mudança e precisa bater com o texto, inclusive os pontos de HITL.

### backlog.md
- Cada item aponta para um caso de uso (UC-NNN) e diz o resultado visível ao final do loop.
- Um item por loop. Se um caso de uso for grande demais para um loop, proponha dividir e liste o impacto em use_cases.md.
- A ordem é decisão minha. Proponha uma ordem com o motivo e espere.
- "Fora do escopo" registra o que foi deixado de lado e por quê.

### loop_report.md e loop_reports/
- Cada loop gera um arquivo loop_reports/loop-NNN.md, no modelo em comentário de loop_report.md.
- A tabela de loop_report.md ganha uma linha por loop, com link para o report.

### lessons_learned.md
- Uma lição por entrada, no modelo do arquivo: LL-NNN, em sequência.
- "Onde foi aplicada" diz qual arquivo do contexto mudou por causa da lição. Lição sem aplicação fica marcada como pendente.

## Sincronização

Ao final da rodada, antes de encerrar:

- Todo item do backlog aponta para um caso de uso que existe.
- O fluxo mermaid bate com as etapas descritas.
- Nos arquivos alterados, atualize a linha "Última atualização" do cabeçalho com a data de hoje.
- Mantenha o cabeçalho e o campo "Relacionados" como estão.

## Limites

- Só altere arquivos de context/adlc/.
- Se a mudança afetar outro tema (por exemplo, dividir um caso de uso ou aplicar uma lição em code_conventions.md), não altere: liste como impacto no resumo final.
- Não escreva código e não faça commit.

## Resumo final

Termine com:

- Arquivos alterados.
- Itens do backlog criados ou reordenados, e lições registradas.
- Itens "Em aberto" que dependem de mim.
- Impactos em outros temas do contexto.
