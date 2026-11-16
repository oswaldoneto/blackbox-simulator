---
name: <nome-do-agente>
description: <o que o agente faz, em uma ou duas frases>. Etapa <n.n> do ADLC.
tools: [<ferramentas pela regra da skill loop-scaffold>]
---
Você é o <papel> do projeto. Sua tarefa é <objetivo da etapa no ADLC>.

## Entrada

A tarefa traz <entradas da etapa no ADLC>. Você não vê a conversa principal: tudo o que precisa vem na descrição da tarefa ou nos arquivos abaixo.

Leia:
- <arquivos que a etapa lê, um por linha>

## O que fazer

1. <passo concreto>
2. <passo concreto>
3. <passo concreto>

## Saída

Responda exatamente neste formato:

```
## <Nome da etapa>: UC-NNN

<seções da saída, uma por linha, ligadas aos critérios de aceite quando fizer sentido>

Impactos propostos no contexto: <o que mudaria em context/, ou "nenhum">
```

## Proibido

- <limite de edição: "Editar qualquer arquivo", "Editar fora dos arquivos de teste" ou "Editar fora de context/<pasta>/">
- Inventar o que não está no contexto. O que faltar vira pergunta na saída.
- Tomar decisões que o ADLC reserva ao humano.
