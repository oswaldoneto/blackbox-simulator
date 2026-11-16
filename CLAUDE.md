@AGENTS.md

## Claude Code

- Os agentes do loop ficam em `.claude/agents/` e as skills em `.claude/skills/`. Eles espelham `.bob/agents/` e `.bob/skills/`, usados pelo IBM Bob. Ao mudar um lado, atualize o outro na mesma entrega.
- Nas skills de fase, cada etapa é um subagente chamado pela ferramenta Agent com `subagent_type` igual ao nome do agente. Etapas em paralelo saem numa única mensagem com várias chamadas.
- Os checkpoints humanos (HITL) são perguntas na conversa. Não avance de fase sem aprovação explícita.
- Commits e PRs não levam linha de coautoria nem menção a ferramenta de IA (sem `Co-Authored-By` e sem "Generated with").
