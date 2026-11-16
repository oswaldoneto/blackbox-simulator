---
name: context-engineering
description: Cura o contexto de engenharia em context/engineering/ (domain_model, architecture, code_conventions). Faz perguntas, propõe o conteúdo e só grava depois da minha aprovação. Use para preencher ou atualizar o modelo de domínio, a arquitetura e as convenções de código.
---
Você vai curar o contexto de engenharia deste projeto junto comigo. O objetivo é que context/engineering/ registre o domínio, as decisões de arquitetura e as convenções que os agentes de código devem seguir, sincronizados com o produto e com o código.

Se eu escrever algo junto com o comando, trate como o pedido desta rodada (por exemplo: uma decisão de arquitetura, uma entidade nova, uma convenção). Se não escrever nada, revise os três arquivos e comece pelo primeiro que estiver vazio ou incompleto.

## Antes de começar

Leia AGENTS.md, os três arquivos de context/engineering/ e, para entender o domínio, context/product/glossary.md, context/product/business_rules.md e context/product/use_cases.md. Se já existir código no projeto, leia a estrutura de pastas e os arquivos de configuração para que o contexto descreva o que existe de fato. Não altere arquivos de produto nem código.

Se context/engineering/ não existir, pare e diga que é preciso rodar /context-scaffold antes.

## Ordem de trabalho

1. domain_model.md: entidades, atributos e relacionamentos. Vem primeiro porque traduz o produto em dados.
2. architecture.md: visão C4, diretrizes e decisões. Depende do domínio.
3. code_conventions.md: como o código é escrito. Depende da arquitetura e da stack escolhida.

## Como conduzir cada arquivo

1. Diga em uma frase o que falta ou o que vai mudar no arquivo.
2. Faça no máximo cinco perguntas curtas por rodada, só sobre o que não está no projeto.
3. Quando houver uma decisão técnica a tomar, apresente duas opções com o trade-off de cada uma e recomende uma com o motivo. Eu decido.
4. Proponha o texto das seções, no formato do arquivo.
5. Espere a minha aprovação. Só grave depois dela. Se eu ajustar, proponha de novo.

Não invente informação. O que eu não souber responder vai para uma linha "Em aberto:" na seção correspondente.

## Regras por arquivo

### domain_model.md
- Nomes de entidades e atributos seguem o glossário de produto.
- Cada atributo com tipo e unidade, quando houver unidade.
- O diagrama mermaid (classDiagram) é atualizado a cada mudança e precisa bater com o texto.

### architecture.md
- C4 nível 1 (Contexto) e nível 2 (Contêineres) em mermaid. Níveis mais baixos só se eu pedir.
- Toda decisão vira um ADR no modelo do arquivo: ADR-NNN, em sequência, com status proposta, aceita ou substituída.
- ADR não é apagado. Uma decisão nova que muda outra marca a anterior como substituída e cita o novo ADR.
- Diretrizes escritas como regras que um agente consegue seguir.

### code_conventions.md
- Convenções concretas e verificáveis, com um exemplo curto quando ajudar.
- Coerentes com a stack e as decisões de architecture.md.
- Incluem testes (onde ficam, como nomear, como rodar) e commits (formato da mensagem).
- "O que evitar" lista erros que já aconteceram ou que a arquitetura proíbe.

## Sincronização

Ao final da rodada, antes de encerrar:

- Entidades e atributos batem com o glossário e com o diagrama.
- Convenções não contradizem nenhum ADR aceito.
- Nos arquivos alterados, atualize a linha "Última atualização" do cabeçalho com a data de hoje.
- Mantenha o cabeçalho e o campo "Relacionados" como estão.

## Limites

- Só altere arquivos de context/engineering/.
- Se a mudança afetar outro tema (por exemplo, um termo novo para o glossário ou uma regra de negócio), não altere: liste como impacto no resumo final.
- Não escreva código e não faça commit.

## Resumo final

Termine com:

- Arquivos alterados.
- ADRs criados ou alterados.
- Itens "Em aberto" que dependem de mim.
- Impactos em outros temas do contexto.
