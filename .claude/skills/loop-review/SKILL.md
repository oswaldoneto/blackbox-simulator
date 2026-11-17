---
name: loop-review
description: Fase Revisar do ADLC. Chama reviewer-functionality, reviewer-quality, reviewer-usability e reviewer-architecture em paralelo e para no checkpoint humano HITL-3.
---
Você vai conduzir a fase Revisar do loop de desenvolvimento, como descrito em context/adlc/agent_development_lifecycle.md.

## Antes de começar

Leia AGENTS.md, context/adlc/agent_development_lifecycle.md e o loop em andamento em context/adlc/loop_reports/ (o de maior número). Confirme que a "Fase atual" é Revisar. Se não for, pare e me diga em que fase o loop está.

## Etapas

Chame ao mesmo tempo, numa única mensagem com várias chamadas à ferramenta Agent, um subagente para cada persona (`subagent_type` igual ao nome): reviewer-functionality, reviewer-quality, reviewer-usability e reviewer-architecture. Cada um recebe no prompt da chamada: o UC-NNN, a lista de arquivos implementados neste loop e os arquivos de contexto que a etapa lê (conforme ADLC).

- **reviewer-functionality** (.claude/agents/reviewer-functionality.md): inclua use_cases.md e os arquivos de código implementado.
- **reviewer-quality** (.claude/agents/reviewer-quality.md): inclua code_conventions.md e os arquivos de código implementado.
- **reviewer-usability** (.claude/agents/reviewer-usability.md): inclua usability.md, design.md e os arquivos de componentes implementados.
- **reviewer-architecture** (.claude/agents/reviewer-architecture.md): inclua architecture.md, code_conventions.md e os arquivos de código implementado.

Junte as respostas num único relatório no loop-NNN.md, na seção "3. Revisão", separando bloqueantes de não bloqueantes por revisor.

## HITL-3: checkpoint pós-Revisão

Mostre um resumo curto: quantos revisores aprovaram, quais bloqueantes foram encontrados (se houver) e quais itens menores ficaram para débito.

Depois, faça estas perguntas e espere a minha resposta:
- Todos os agentes de revisão aprovaram sem bloqueantes?
- Problemas menores foram registrados como débito ou lição?
- O loop pode ser considerado concluído?

Se houver bloqueante: retorna ao HITL-2 após correção. Registre o motivo no loop-NNN.md e atualize "Fase atual: Implementar".

Se eu decidir corrigir itens não bloqueantes: no máximo uma rodada curta por loop (Implementar e Testar só os ajustes, revisão só pelos revisores envolvidos). O que a rodada curta levantar vai direto para débito técnico, salvo bloqueante.

Se eu aprovar: registre no loop-NNN.md "HITL-3 aprovado em <data>" e "Fase atual: Documentar".

## Regras

- Não escreva código.
- Não avance sem a minha aprovação explícita no HITL-3.
