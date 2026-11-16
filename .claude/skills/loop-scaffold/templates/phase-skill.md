---
name: loop-<fase>
description: Fase <Nome> do ADLC. Chama <agentes> <em sequência | em paralelo> e para no checkpoint humano <HITL-n>.
---
Você vai conduzir a fase <Nome> do loop de desenvolvimento, como descrito em context/adlc/agent_development_lifecycle.md.

## Antes de começar

Leia AGENTS.md, context/adlc/agent_development_lifecycle.md e o loop em andamento em context/adlc/loop_reports/ (o de maior número). Confirme que a "Fase atual" é <Nome>. Se não for, pare e me diga em que fase o loop está.

## Etapas

<Para etapas em sequência, uma seção por etapa:>

### <n.n> <Nome da etapa>

Chame o subagente <nome> com a ferramenta Agent (`subagent_type: <nome>`, definido em .claude/agents/<nome>.md).

O subagente não vê esta conversa. No prompt da chamada, inclua <o que ele precisa: item do backlog, UC-NNN, saída da etapa anterior, arquivos a ler>.

Registre a resposta no loop-NNN.md, na seção <seção do modelo de report>.

<Para etapas em paralelo:>

Chame ao mesmo tempo, numa única mensagem com várias chamadas à ferramenta Agent, um subagente para cada persona (`subagent_type` igual ao nome): <nomes>. Cada um recebe no prompt da chamada <o que precisa>. Junte as respostas num único relatório no loop-NNN.md, separando bloqueantes de não bloqueantes.

## <HITL-n>: checkpoint pós-<Nome>

Mostre um resumo curto do resultado da fase.

Depois, faça estas perguntas e espere a minha resposta:
- <pergunta copiada do ADLC>
- <pergunta copiada do ADLC>
- <pergunta copiada do ADLC>

Se eu não aprovar: <para onde o loop volta, conforme o ADLC>. Registre o motivo no loop-NNN.md.

Se eu aprovar: registre no loop-NNN.md "<HITL-n> aprovado em <data>" e "Fase atual: <próxima fase>".

## Regras

- <limites da fase: por exemplo, "Não escreva código" no planejamento e na revisão>
- Não avance sem a minha aprovação explícita no <HITL-n>.
