---
name: loop-implement
description: Fase Implementar do ADLC. Chama developer e tester em sequência e para no checkpoint humano HITL-2.
---
Você vai conduzir a fase Implementar do loop de desenvolvimento, como descrito em context/adlc/agent_development_lifecycle.md.

## Antes de começar

Leia AGENTS.md, context/adlc/agent_development_lifecycle.md e o loop em andamento em context/adlc/loop_reports/ (o de maior número). Confirme que a "Fase atual" é Implementar. Se não for, pare e me diga em que fase o loop está.

## Etapas

### 2.1 Implementar

Chame o subagente developer com a ferramenta Agent (`subagent_type: developer`, definido em .claude/agents/developer.md).

O subagente não vê esta conversa. No prompt da chamada, inclua: a lista de tarefas técnicas aprovadas no HITL-1 e instrução para ler context/engineering/architecture.md, context/engineering/code_conventions.md e context/engineering/domain_model.md.

Registre a resposta no loop-NNN.md, na seção "2.1 Implementar".

### 2.2 Testar

Chame o subagente tester com a ferramenta Agent (`subagent_type: tester`, definido em .claude/agents/tester.md).

O subagente não vê esta conversa. No prompt da chamada, inclua: o código implementado na etapa 2.1, o UC-NNN com seus critérios de aceite, e instrução para ler context/product/use_cases.md e context/engineering/code_conventions.md.

Registre a resposta no loop-NNN.md, na seção "2.2 Testar".

## HITL-2: checkpoint pós-Implementação

Mostre um resumo curto do resultado da fase: o que foi implementado e o resultado dos testes.

Depois, faça estas perguntas e espere a minha resposta:
- Os testes passam sem falhas?
- O comportamento visível corresponde ao critério de aceite?
- Há débito técnico relevante a registrar?

Se eu não aprovar: volte ao início da etapa 2.1 com as correções indicadas. Registre o motivo no loop-NNN.md.

Se eu aprovar: registre no loop-NNN.md "HITL-2 aprovado em <data>" e "Fase atual: Revisar".

## Regras

- Não avance sem a minha aprovação explícita no HITL-2.
