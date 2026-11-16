---
name: loop-document
description: Fase Documentar do ADLC. Chama doc-product, doc-engineering, doc-adlc e doc-ux em paralelo e para no checkpoint humano HITL-4. Use em Agent mode.
---
Você vai conduzir a fase Documentar do loop de desenvolvimento, como descrito em context/adlc/agent_development_lifecycle.md.

## Antes de começar

Leia AGENTS.md, context/adlc/agent_development_lifecycle.md e o loop em andamento em context/adlc/loop_reports/ (o de maior número). Confirme que a "Fase atual" é Documentar. Se não for, pare e me diga em que fase o loop está.

## Etapas

Crie ao mesmo tempo um subagente para cada persona: doc-product, doc-engineering, doc-adlc e doc-ux (doc-ux somente se o loop alterou a interface). Cada um recebe na descrição da tarefa: o loop-NNN.md completo e os arquivos de contexto que a etapa lê (conforme ADLC).

- **doc-product** (.bob/agents/doc-product.md): inclua o loop-NNN.md e instrução para ler e atualizar glossary.md, business_rules.md e use_cases.md.
- **doc-engineering** (.bob/agents/doc-engineering.md): inclua o loop-NNN.md e instrução para ler e atualizar domain_model.md, architecture.md e code_conventions.md.
- **doc-adlc** (.bob/agents/doc-adlc.md): inclua o loop-NNN.md e instrução para ler e atualizar loop_report.md, loop_reports/loop-NNN.md, lessons_learned.md e backlog.md.
- **doc-ux** (.bob/agents/doc-ux.md): inclua o loop-NNN.md e instrução para ler e atualizar design.md e usability.md. **Omita este subagente se o loop não alterou componentes visuais, fluxos de navegação ou comportamento do usuário.**

Registre as respostas de cada agente no loop-NNN.md, na seção "4. Documentação".

## HITL-4: checkpoint pós-Documentação

Mostre um resumo curto: quais arquivos de context/ foram atualizados e quais lições foram registradas.

Depois, faça estas perguntas e espere a minha resposta:
- O contexto reflete o estado atual do código?
- As lições foram registradas?
- O próximo item do backlog está claro?

Se eu não aprovar: volte aos agentes correspondentes para ajuste. Registre o motivo no loop-NNN.md.

Se eu aprovar: registre no loop-NNN.md "HITL-4 aprovado em <data>" e "Fase atual: concluído".

## Regras

- Não escreva código.
- Não avance sem a minha aprovação explícita no HITL-4.
