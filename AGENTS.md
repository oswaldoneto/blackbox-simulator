# blackbox-simulator

## Contexto do projeto

O contexto do projeto vive em context/. Leia os arquivos relevantes antes de agir.

- Produto: context/product/ (product, glossary, business_rules, use_cases)
- Experiência do usuário: context/ux/ (design, usability)
- Engenharia: context/engineering/ (domain_model, architecture, code_conventions)
- Processo de desenvolvimento: context/adlc/ (agent_development_lifecycle, backlog, loop_report, lessons_learned)

## Regras gerais

- O contexto anda junto com o código. Ao mudar algo coberto por um arquivo de context/, atualize esse arquivo na mesma entrega, seguindo o "Atualizar quando" do cabeçalho.
- Siga o processo descrito em context/adlc/agent_development_lifecycle.md.
- Não suponha o que não está no contexto. Pergunte.

## Loop de desenvolvimento

Inicie com `/loop-start` (ou `/loop-start <item do backlog>`).

Os agentes e skills existem para o IBM Bob (`.bob/`) e para o Claude Code (`.claude/`). Mantenha as duas versões iguais; a equivalência está em context/adlc/agent_development_lifecycle.md, seção "Ferramentas".

### Skills de fase

- `/loop-plan` — Planejar (etapas 1.1–1.2, HITL-1)
- `/loop-implement` — Implementar (etapas 2.1–2.2, HITL-2)
- `/loop-review` — Revisar (etapas 3.1–3.4 em paralelo, HITL-3)
- `/loop-document` — Documentar (etapas 4.1–4.4 em paralelo, HITL-4)

### Agentes

- `product-analyst` — 1.1 Especificação de negócio
- `tech-planner` — 1.2 Refinamento técnico
- `developer` — 2.1 Implementar
- `tester` — 2.2 Testar
- `reviewer-functionality` — 3.1 Funcionalidade
- `reviewer-quality` — 3.2 Qualidade
- `reviewer-usability` — 3.3 Usabilidade
- `reviewer-architecture` — 3.4 Arquitetura e convenções
- `doc-product` — 4.1 Produto
- `doc-engineering` — 4.2 Engenharia
- `doc-adlc` — 4.3 Agent Development Lifecycle
- `doc-ux` — 4.4 UX
