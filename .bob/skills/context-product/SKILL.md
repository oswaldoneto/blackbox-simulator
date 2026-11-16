---
name: context-product
description: Cura o contexto de produto em context/product/ (product, glossary, business_rules, use_cases). Faz perguntas, propõe o conteúdo e só grava depois da minha aprovação. Use em Agent mode para preencher ou atualizar o contexto de produto.
---
Você vai curar o contexto de produto deste projeto junto comigo. O objetivo é que os quatro arquivos de context/product/ descrevam o produto com precisão, sem suposições, e continuem sincronizados entre si.

Se eu escrever algo junto com o comando, trate como o pedido desta rodada (por exemplo: um caso de uso novo, uma regra que mudou, ou informações sobre o produto). Se não escrever nada, revise os quatro arquivos e comece pelo primeiro que estiver vazio ou incompleto.

## Antes de começar

Leia AGENTS.md, README.md e os quatro arquivos de context/product/. Leia context/engineering/domain_model.md só para checar consistência de nomes; não altere esse arquivo.

Se context/product/ não existir, pare e diga que é preciso rodar /context-scaffold antes.

## Ordem de trabalho

Siga esta ordem, porque cada arquivo depende do anterior:

1. product.md: o que é o produto, o problema, os usuários e o escopo.
2. glossary.md: os termos que o produto usa.
3. business_rules.md: as regras que valem para mais de um caso de uso.
4. use_cases.md: as funcionalidades e os critérios de aceite.

## Como conduzir cada arquivo

1. Diga em uma frase o que falta ou o que vai mudar no arquivo.
2. Faça no máximo cinco perguntas curtas por rodada, só sobre o que não está no projeto.
3. Proponha o texto das seções, no formato do arquivo.
4. Espere a minha aprovação. Só grave depois dela. Se eu ajustar, proponha de novo.

Não invente informação. O que eu não souber responder vai para uma linha "Em aberto:" na seção correspondente.

## Regras por arquivo

### product.md
- Frases curtas, sem jargão de marketing.
- Escopo com duas listas explícitas: dentro e fora.
- Métricas de sucesso observáveis. Se não houver número, diga como será observado.

### glossary.md
- Uma linha por termo na tabela, com significado em uma frase.
- Todo termo do domínio usado em product.md, business_rules.md ou use_cases.md precisa estar no glossário.
- Um termo, um significado. Se dois nomes forem a mesma coisa, registre o principal e cite o outro no significado.

### business_rules.md
- Siga o modelo em comentário do arquivo. Identificador RN-NNN, em sequência. Nunca reutilize um identificador.
- Cada regra precisa ser verificável: deve ser possível escrever um teste para ela.
- "Aplica-se a" lista os casos de uso (UC-NNN) que usam a regra.
- Regra que deixou de valer não é apagada: marque como revogada, com a data e o motivo.

### use_cases.md
- Siga o modelo em comentário do arquivo. Identificador UC-NNN, em sequência. Nunca reutilize um identificador.
- Um caso de uso é uma funcionalidade pequena o bastante para ser entregue em um loop.
- Critérios de aceite no formato Dado, Quando, Então. Cada critério precisa virar um teste.
- Regras de negócio são citadas pelo identificador (RN-NNN), não repetidas.
- Mantenha o índice no topo atualizado.

## Sincronização

Ao final da rodada, antes de encerrar:

- Termos novos foram para o glossário.
- Toda RN citada em um caso de uso existe, e o "Aplica-se a" dela inclui esse caso de uso.
- Nos arquivos alterados, atualize a linha "Última atualização" do cabeçalho com a data de hoje.
- Mantenha o cabeçalho e o campo "Relacionados" como estão.

## Limites

- Só altere arquivos de context/product/.
- Se a mudança afetar outro tema (por exemplo, uma entidade nova no domain_model ou um item novo no backlog), não altere: liste como impacto no resumo final.
- Não escreva código e não faça commit.

## Resumo final

Termine com:

- Arquivos alterados.
- Identificadores criados ou alterados (RN e UC).
- Itens "Em aberto" que dependem de mim.
- Impactos em outros temas do contexto.
