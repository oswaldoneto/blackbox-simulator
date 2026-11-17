# Usabilidade

> Propósito: Diretrizes de usabilidade e acessibilidade.
> Atualizar quando: uma diretriz mudar ou um teste com usuários trouxer um aprendizado.
> Relacionados: [../product/product.md](../product/product.md)
> Última atualização: 2026-11-16 · loop-002

## Princípios

- **Leitura rápida primeiro.** O piloto está com atenção dividida entre o simulador e o painel. Toda informação relevante é visível sem rolagem e sem abrir submenus.
- **Interações breves.** Qualquer ação no painel de tempo real é concluída em no máximo um clique ou tecla. Fluxos que exigem mais de uma etapa pertencem ao debriefing, não ao painel de voo.
- **Foco por demanda.** O piloto pode maximizar qualquer seção ou gráfico individualmente para ter foco maior naquele dado. A maximização não altera os dados exibidos, apenas a área de visualização. (No painel de tempo real, a maximização ficou fora do loop-002 e é item do backlog.)
- **Estado sempre visível.** A interface sempre mostra se a sessão está ativa, encerrada ou se não há conexão com o simulador. Nunca deixa o piloto adivinhar o estado do sistema.
- **Sem surpresas.** Nenhuma ação destrutiva (ex.: encerramento de sessão) é executada sem que o sistema confirme visualmente o que aconteceu.

## Acessibilidade

- Contraste mínimo de 4,5:1 entre texto e fundo (WCAG AA) em todos os elementos de texto.
- Todos os elementos interativos são acessíveis por teclado (Tab, Enter, Esc).
- Gráficos e indicadores numéricos têm texto alternativo ou rótulo visível com o valor atual, para que a informação não dependa só de cor.
- Cores não são o único meio de distinguir estados (ex.: sessão ativa vs. encerrada usa cor + rótulo de texto).
- O "—" de sem sinal usa `color-text-secondary` (não `color-text-disabled`, que fica abaixo de 4,5:1).

### Leitor de tela no painel de tempo real (UC-002)

- Cada indicador de parâmetro é um grupo (`role="group"`) com `aria-label` em texto, no formato "<rótulo>: <valor> <unidade>" ou "<rótulo>: sem sinal".
- Os indicadores não têm `aria-live`: a atualização a cada segundo não é anunciada, para não sobrecarregar o leitor de tela.
- O encerramento da sessão é anunciado uma única vez, pela notificação "Sessão encerrada. Dados salvos."; o aviso "Sessão encerrada" do painel não tem `role="status"`.
- O aviso "Sem sinal do simulador" tem `role="status"`, para ser anunciado.

Débitos de acessibilidade (revisão do loop-002, sem decisão):
- Avisos com `role="status"` montados já com o texto podem não ser anunciados por alguns leitores de tela; uma região viva sempre montada seria mais segura. Não decidido.
- O indicador de estado da barra usa `aria-label` em `<div>` sem role e sem região viva; a perda de conexão não é anunciada.
- Os cards podem ser lidos em dobro (`aria-label` do grupo e texto interno).

## Feedback e mensagens de erro

- Toda operação que leva mais de 500 ms mostra um indicador de carregamento.
- Quando a sessão inicia automaticamente, o sistema exibe uma notificação discreta confirmando o início da coleta.
- Quando a sessão encerra automaticamente, o sistema exibe uma notificação de sucesso confirmando o encerramento: "Sessão encerrada. Dados salvos." A notificação usa o tipo `success` e desaparece em 4 segundos.
- Mensagens de erro descrevem o que aconteceu e o que o piloto pode fazer. Exemplo: "Não foi possível conectar ao simulador. Verifique se o Microsoft Flight Simulator 2024 está em execução."
- Estados vazios (ex.: nenhum voo registrado) explicam o motivo e orientam o próximo passo. Exemplo: "Nenhum voo registrado. Inicie o simulador e ligue o motor para começar."

### Painel de tempo real (UC-002)

- Cadência: os valores são atualizados a cada 1 s, com o valor lido do simulador. Atraso máximo aceitável entre o simulador e o painel: 2 s (a medir no roteiro manual no Windows com o MSFS).
- Limite de sem sinal: se a conexão com o simulador cair durante a sessão ou se passarem 2 s sem dados novos, os valores viram "—" e o painel mostra o aviso. Os valores voltam sozinhos quando os dados retornam.
- Textos do painel:

| Situação | Texto |
|---|---|
| Sem sessão (área principal) | "Inicie o simulador e ligue o motor para começar" |
| Carregando o estado inicial | "Aguardando..." |
| Sessão encerrada (aviso, valores congelados) | "Sessão encerrada" |
| Sem sinal (aviso, valores "—") | "Sem sinal do simulador" |
| Falha ao carregar os parâmetros (aviso no lugar da grade) | "Não foi possível carregar os parâmetros." |
| Barra superior, conectado sem sessão | "Aguardando motor" |
| Barra superior, simulador inacessível | "Sem conexão" |

Débitos (revisão do loop-002, sem decisão):
- "Sem sinal do simulador" e "Não foi possível carregar os parâmetros." não dizem o que o piloto pode fazer, contrariando a diretriz de mensagens de erro acima. O texto "Sem sinal do simulador" foi decidido no HITL-3.
- A falha ao carregar os parâmetros não tem nova tentativa automática.
- O estado sem sessão não explica o motivo, só orienta o próximo passo.
- Se a consulta inicial da sessão ou da conexão falhar, a tela pode mostrar "sem sessão" ou "Sem conexão" até o próximo evento, mesmo com a coleta em andamento.

## Linguagem

- Idioma: português do Brasil.
- Tom: direto e técnico, sem jargão de marketing. O usuário é um piloto familiarizado com termos de aviação.
- Os termos da interface seguem o glossário de produto: **sessão**, **parâmetro de voo**, **debriefing**, **piloto**, **voo**.
- Rótulos de parâmetros usam a nomenclatura aeronáutica padrão, com os nomes de [domain_model.md](../engineering/domain_model.md). Rótulos do conjunto inicial: **Altitude MSL** (ft), **Velocidade IAS** (kt), **Velocidade vertical** (fpm), **Rumo magnético** (°), **Arfagem** (°), **Rolagem** (°). Usa-se "Rumo magnético", não "proa".
- A unidade é exibida como rótulo à parte, nunca dentro do valor.
- Botões e ações usam verbos no infinitivo: "Iniciar", "Encerrar", "Selecionar", "Maximizar".

## Formatação de valores numéricos

Regras do painel de tempo real (UC-002):

| Parâmetro | Casas | Regra | Exemplo |
|---|---|---|---|
| Altitude MSL (ft) | 0 | inteiro; só o sinal de menos aparece | `4.500` |
| Velocidade IAS (kt) | 0 | inteiro; negativo vira 0 | `112` |
| Velocidade vertical (fpm) | 0 | múltiplo de 10; "+" ou "−" explícito | `+650` |
| Rumo magnético (°) | 0 | 3 dígitos, de 000 a 359; 360 vira 000 | `005` |
| Arfagem (°) | 1 | "+" com o nariz para cima, "−" para baixo | `+5,2` |
| Rolagem (°) | 1 | valor absoluto + "E" (esquerda) ou "D" (direita); zero sem letra | `12,3 D` |

Regras gerais:
- Locale `pt-BR`: vírgula decimal e ponto de milhar.
- Negativos usam o sinal de menos tipográfico (U+2212, "−"), não o hífen.
- "−0" é exibido como "0".
- Valor ausente ou inválido (`null`, `NaN`, `Infinity`) é exibido como "—".
- Os sinais de arfagem e rolagem são corrigidos só na exibição; o sentido real será confirmado no roteiro manual no Windows com o MSFS.
- Débito: o arredondamento da velocidade vertical é assimétrico perto de zero (+5 fpm vira "+10", −5 fpm vira "0").
