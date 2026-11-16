# Produto

> Propósito: Visão de alto nível do produto: o que é, que problema resolve e para quem.
> Atualizar quando: mudar o problema, o público ou o escopo do produto.
> Relacionados: [glossary.md](glossary.md)
> Última atualização: 2026-11-16

## Visão

Blackbox Simulator é uma ferramenta que coleta, registra e visualiza os parâmetros de voo gerados por simuladores caseiros (como Microsoft Flight Simulator 2024), funcionando como uma caixa-preta digital para uso em treinamento.

## Problema

Simuladores de voo caseiros expõem uma quantidade grande de dados de sensores durante o voo, mas não oferecem ferramentas para analisá-los de forma estruturada. Sem uma ferramenta adequada, o piloto não consegue identificar com precisão onde errou nem acompanhar a evolução das suas habilidades ao longo do tempo.

## Usuários

- **Piloto virtual**: usuário de simulador de voo que quer melhorar suas técnicas com base em dados.
- **Piloto real**: profissional ou estudante de aviação que usa o simulador como complemento ao treinamento prático e quer análise orientada a dados.

## Proposta de valor

Transformar os dados brutos do simulador em informação acionável, permitindo que o piloto entenda o que aconteceu em cada voo e tome decisões de treinamento baseadas em evidências.

## Escopo

### Dentro do escopo

- Coleta de um conjunto inicial de parâmetros de voo a partir do simulador rodando na mesma máquina; novos parâmetros poderão ser adicionados em versões futuras.
- Registro persistente dos dados de cada voo.
- Visualização dos parâmetros em tempo real durante o voo.
- Análise e revisão dos dados após o voo.

### Fora do escopo

- Execução remota ou em nuvem: o software roda na mesma máquina do simulador.
- Controle ou interferência no voo em andamento.
- Integração com aeronaves reais ou sistemas de aviação certificados.
- Suporte a hardware físico de simulação (painéis, yokes, pedais).

## Métricas de sucesso

- Após um voo completo (ex.: circuito de tráfego padrão), todos os parâmetros do conjunto inicial estão disponíveis para revisão sem perda de dados.
- O piloto consegue identificar, na análise pós-voo, ao menos um ponto específico de melhoria por sessão.
- A visualização em tempo real não introduz atraso perceptível na experiência do simulador.

Em aberto: limiar numérico aceitável de atraso na visualização em tempo real.
Em aberto: definição do conjunto inicial de parâmetros a coletar.
