---
name: loop-scaffold
description: Cria no Bob os agentes e as skills do loop de desenvolvimento a partir de context/adlc/agent_development_lifecycle.md. Um agente por etapa, uma skill por fase e a skill loop-start, que conduz o loop inteiro. Use em Agent mode, na fundação do projeto ou quando o ADLC mudar.
---
Você vai criar a estrutura do loop de desenvolvimento dentro do Bob. A fonte é o processo descrito em context/adlc/agent_development_lifecycle.md. Não invente etapas: tudo o que você criar precisa sair desse arquivo.

Os modelos ficam nesta pasta da skill:
- .bob/skills/loop-scaffold/templates/agent.md
- .bob/skills/loop-scaffold/templates/phase-skill.md
- .bob/skills/loop-scaffold/templates/loop-start.md

## Antes de começar

Leia AGENTS.md, context/adlc/agent_development_lifecycle.md e os três modelos.

Se o ADLC não existir ou não tiver fases, etapas e checkpoints humanos (HITL), pare e diga que é preciso rodar /context-adlc antes.

## 1. Levante o que criar

A partir do ADLC, monte três listas:

1. Agentes: um por etapa (por exemplo, 1.1, 2.2, 3.4). Nome em inglês, kebab-case, pelo papel: product-analyst, tech-planner, developer, tester, reviewer-<foco>, doc-<contexto>.
2. Skills de fase: uma por fase, com o verbo em inglês: loop-plan, loop-implement, loop-review, loop-document. Para cada uma, anote se as etapas rodam em sequência ou em paralelo, o HITL que fecha a fase com as perguntas de aprovação, e para onde o loop volta quando o humano não aprova.
3. Orquestrador: a skill loop-start.

Para cada agente, defina o teto de ferramentas com esta regra:
- Analisa, planeja ou revisa: [read]. Revisor que precisa rodar lint ou testes: [read, command].
- Implementa: [read, edit, command].
- Testa: [read, edit, command], editando só arquivos de teste.
- Documenta: [read, edit], editando só a sua pasta de context/.

Mostre as três listas numa tabela, com nome, etapa, ferramentas e o arquivo que será criado. Espere a minha aprovação antes de criar qualquer arquivo.

## 2. Crie os arquivos

Depois da aprovação:

1. Um arquivo por agente em .bob/agents/<nome>.md, a partir de templates/agent.md. O corpo usa o objetivo, as entradas, as saídas e os arquivos lidos da etapa no ADLC.
2. Uma skill por fase em .bob/skills/loop-<fase>/SKILL.md, a partir de templates/phase-skill.md. Copie as perguntas do HITL exatamente como estão no ADLC.
3. A skill .bob/skills/loop-start/SKILL.md, a partir de templates/loop-start.md, com as fases na ordem do ADLC.
4. No AGENTS.md, acrescente ao final a seção "Loop de desenvolvimento": como iniciar (/loop-start), as skills de fase e os agentes, um por linha. Mantenha tudo o que já está lá.

## Regras

- Não sobrescreva arquivos existentes. Se um já existir, pule e informe no final.
- Não altere nada em context/.
- Não escreva código e não faça commit.

## Resumo final

Termine com:
- Arquivos criados e pulados.
- O lembrete: reinicie o Bob para as novas skills aparecerem no menu /.
- A recomendação: em Permissions, ative o auto-approve só para Subagent e deixe Mode desmarcado. As paradas do loop são os HITL.
