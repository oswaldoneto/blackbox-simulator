# Usabilidade

> Propósito: Diretrizes de usabilidade e acessibilidade.
> Atualizar quando: uma diretriz mudar ou um teste com usuários trouxer um aprendizado.
> Relacionados: [../product/product.md](../product/product.md)
> Última atualização: 2026-11-16

## Princípios

- **Leitura rápida primeiro.** O piloto está com atenção dividida entre o simulador e o painel. Toda informação relevante é visível sem rolagem e sem abrir submenus.
- **Interações breves.** Qualquer ação no painel de tempo real é concluída em no máximo um clique ou tecla. Fluxos que exigem mais de uma etapa pertencem ao debriefing, não ao painel de voo.
- **Foco por demanda.** O piloto pode maximizar qualquer seção ou gráfico individualmente para ter foco maior naquele dado. A maximização não altera os dados exibidos, apenas a área de visualização.
- **Estado sempre visível.** A interface sempre mostra se a sessão está ativa, encerrada ou se não há conexão com o simulador. Nunca deixa o piloto adivinhar o estado do sistema.
- **Sem surpresas.** Nenhuma ação destrutiva (ex.: encerramento de sessão) é executada sem que o sistema confirme visualmente o que aconteceu.

## Acessibilidade

- Contraste mínimo de 4,5:1 entre texto e fundo (WCAG AA) em todos os elementos de texto.
- Todos os elementos interativos são acessíveis por teclado (Tab, Enter, Esc).
- Gráficos e indicadores numéricos têm texto alternativo ou rótulo visível com o valor atual, para que a informação não dependa só de cor.
- Cores não são o único meio de distinguir estados (ex.: sessão ativa vs. encerrada usa cor + rótulo de texto).

## Feedback e mensagens de erro

- Toda operação que leva mais de 500 ms mostra um indicador de carregamento.
- Quando a sessão inicia automaticamente, o sistema exibe uma notificação discreta confirmando o início da coleta.
- Quando a sessão encerra automaticamente, o sistema exibe uma notificação discreta confirmando o encerramento e a persistência dos dados.
- Mensagens de erro descrevem o que aconteceu e o que o piloto pode fazer. Exemplo: "Não foi possível conectar ao simulador. Verifique se o Microsoft Flight Simulator 2024 está em execução."
- Estados vazios (ex.: nenhum voo registrado) explicam o motivo e orientam o próximo passo. Exemplo: "Nenhum voo registrado. Inicie o simulador e ligue o motor para começar."

## Linguagem

- Idioma: português do Brasil.
- Tom: direto e técnico, sem jargão de marketing. O usuário é um piloto familiarizado com termos de aviação.
- Os termos da interface seguem o glossário de produto: **sessão**, **parâmetro de voo**, **debriefing**, **piloto**, **voo**.
- Rótulos de parâmetros usam a nomenclatura aeronáutica padrão (ex.: altitude, velocidade vertical, proa — a definir quando o conjunto inicial de parâmetros for estabelecido).
- Botões e ações usam verbos no infinitivo: "Iniciar", "Encerrar", "Selecionar", "Maximizar".

Em aberto: nomenclatura exata dos rótulos dos parâmetros (depende da definição do conjunto inicial de parâmetros).
