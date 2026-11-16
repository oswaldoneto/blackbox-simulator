---
name: context-ux
description: Cura o contexto de experiência do usuário em context/ux/ (design, usability). Faz perguntas, propõe o conteúdo e só grava depois da minha aprovação. Use para preencher ou atualizar as diretrizes de interface e usabilidade.
---
Você vai curar o contexto de experiência do usuário deste projeto junto comigo. O objetivo é que context/ux/ tenha diretrizes concretas o bastante para um agente de código construir a interface sem adivinhar, e que continuem sincronizadas com o produto.

Se eu escrever algo junto com o comando, trate como o pedido desta rodada (por exemplo: uma cor nova, um componente, uma diretriz que mudou). Se não escrever nada, revise os dois arquivos e comece pelo primeiro que estiver vazio ou incompleto.

## Antes de começar

Leia AGENTS.md, os dois arquivos de context/ux/ e, para entender quem usa o produto e o que ele faz, context/product/product.md e context/product/use_cases.md. Não altere os arquivos de produto.

Se context/ux/ não existir, pare e diga que é preciso rodar /context-scaffold antes.

## Ordem de trabalho

1. usability.md: princípios, acessibilidade, feedback e linguagem. Vem primeiro porque depende de quem é o usuário.
2. design.md: princípios visuais, cores, tipografia, componentes e layout, coerentes com a usabilidade.

## Como conduzir cada arquivo

1. Diga em uma frase o que falta ou o que vai mudar no arquivo.
2. Faça no máximo cinco perguntas curtas por rodada, só sobre o que não está no projeto.
3. Proponha o texto das seções, no formato do arquivo.
4. Espere a minha aprovação. Só grave depois dela. Se eu ajustar, proponha de novo.

Não invente informação. O que eu não souber responder vai para uma linha "Em aberto:" na seção correspondente.

## Regras por arquivo

### usability.md
- Diretrizes escritas como regras verificáveis, não como intenções. Exemplo: "toda ação demorada mostra um indicador de carregamento", não "o sistema deve ser fluido".
- Acessibilidade: contraste mínimo de texto, navegação por teclado e texto alternativo em imagens e gráficos.
- Mensagens de erro dizem o que aconteceu e o que fazer.
- Linguagem: idioma, tom e termos. Os termos seguem o glossário de produto.

### design.md
- Cores em hexadecimal, cada uma com o seu uso (fundo, texto, destaque, erro).
- Tipografia: famílias, tamanhos e onde cada um é usado.
- Componentes: nome, quando usar e estados (normal, desabilitado, erro, carregando).
- Layout: estrutura das telas e comportamento em telas menores.
- Nada que contradiga usability.md.

## Sincronização

Ao final da rodada, antes de encerrar:

- Os termos usados nas diretrizes batem com o glossário de produto.
- Nos arquivos alterados, atualize a linha "Última atualização" do cabeçalho com a data de hoje.
- Mantenha o cabeçalho e o campo "Relacionados" como estão.

## Limites

- Só altere arquivos de context/ux/.
- Se a mudança afetar outro tema (por exemplo, um termo novo para o glossário ou um critério de aceite de interface), não altere: liste como impacto no resumo final.
- Não escreva código e não faça commit.

## Resumo final

Termine com:

- Arquivos alterados.
- Itens "Em aberto" que dependem de mim.
- Impactos em outros temas do contexto.
