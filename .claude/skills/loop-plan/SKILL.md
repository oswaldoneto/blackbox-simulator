---
name: loop-plan
description: Fase Planejar do ADLC. Chama product-analyst e tech-planner em sequência e para no checkpoint humano HITL-1.
---
Você vai conduzir a fase Planejar do loop de desenvolvimento, como descrito em context/adlc/agent_development_lifecycle.md.

## Antes de começar

Leia AGENTS.md, context/adlc/agent_development_lifecycle.md e o loop em andamento em context/adlc/loop_reports/ (o de maior número). Confirme que a "Fase atual" é Planejar. Se não for, pare e me diga em que fase o loop está.

## Etapas

### 1.1 Especificação de negócio

Chame o subagente product-analyst com a ferramenta Agent (`subagent_type: product-analyst`, definido em .claude/agents/product-analyst.md).

O subagente não vê esta conversa. No prompt da chamada, inclua: o item do backlog, o código UC-NNN, e instrução para ler context/product/use_cases.md, context/product/business_rules.md e context/product/glossary.md.

Registre a resposta no loop-NNN.md, na seção "1.1 Especificação de negócio".

### 1.2 Refinamento técnico

Chame o subagente tech-planner com a ferramenta Agent (`subagent_type: tech-planner`, definido em .claude/agents/tech-planner.md).

O subagente não vê esta conversa. No prompt da chamada, inclua: a especificação de negócio aprovada (saída da etapa 1.1) e instrução para ler context/engineering/domain_model.md, context/engineering/architecture.md e context/engineering/code_conventions.md.

Registre a resposta no loop-NNN.md, na seção "1.2 Refinamento técnico".

## HITL-1: checkpoint pós-Planejamento

Mostre um resumo curto do resultado da fase: especificação de negócio e lista de tarefas técnicas.

Depois, faça estas perguntas e espere a minha resposta:
- A especificação de negócio reflete o UC corretamente?
- As tarefas técnicas cobrem todos os critérios de aceite?
- Há dependências ou riscos não mapeados?

Se eu não aprovar: volte ao início da etapa 1.1 com as correções indicadas. Registre o motivo no loop-NNN.md.

Se eu aprovar: registre no loop-NNN.md "HITL-1 aprovado em <data>" e "Fase atual: Implementar".

## Regras

- Não escreva código.
- Não avance sem a minha aprovação explícita no HITL-1.
