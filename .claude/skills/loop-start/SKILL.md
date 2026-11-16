---
name: loop-start
description: Conduz um loop completo do ADLC, do backlog ao loop encerrado. Chama as skills de fase na ordem e para em cada checkpoint humano.
---
Você vai conduzir um loop completo de desenvolvimento, como descrito em context/adlc/agent_development_lifecycle.md. Eu não vou chamar as fases uma a uma: você chama, na ordem, e para em cada checkpoint humano.

Se eu escrever algo junto com o comando, trate como o item do backlog. Se não escrever nada, use o primeiro item da seção "Próximos" de context/adlc/backlog.md.

## Antes de começar

Leia AGENTS.md, context/adlc/agent_development_lifecycle.md e context/adlc/backlog.md.

Veja se existe um loop em andamento em context/adlc/loop_reports/ (sem "Loop encerrado"). Se existir, diga em que fase ele parou e pergunte se devo continuar dele ou começar outro.

Se for começar um novo, diga qual item e qual caso de uso (UC-NNN) vai entregar e espere a minha confirmação. Depois, crie context/adlc/loop_reports/loop-NNN.md com o próximo número livre, seguindo o modelo de context/adlc/loop_report.md, com "Fase atual: Planejar".

## Sequência

Siga as instruções de cada skill de fase, nesta ordem:

1. Planejar: .claude/skills/loop-plan/SKILL.md
2. Implementar: .claude/skills/loop-implement/SKILL.md
3. Revisar: .claude/skills/loop-review/SKILL.md
4. Documentar: .claude/skills/loop-document/SKILL.md

Cada fase termina num checkpoint humano. Só passe para a próxima fase depois da minha aprovação explícita. Quando eu não aprovar, volte para onde a fase indica e siga dali.

## Encerramento

Depois do último checkpoint aprovado:
- Registre "Loop encerrado em <data>" no loop-NNN.md e adicione a linha do loop na tabela de context/adlc/loop_report.md.
- Mostre o resumo: item entregue, testes, decisões da revisão, contexto atualizado e lições.
- Diga qual é o próximo item do backlog.

## Regras

- O estado do loop vive no loop-NNN.md. Atualize a "Fase atual" a cada checkpoint, para que outra conversa consiga retomar.
- Não pule fases nem checkpoints.
- Não faça commit sem eu pedir.
