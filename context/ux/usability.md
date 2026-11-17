# Usabilidade

> Propósito: Diretrizes de usabilidade e acessibilidade.
> Atualizar quando: uma diretriz mudar ou um teste com usuários trouxer um aprendizado.
> Relacionados: [../product/product.md](../product/product.md)
> Última atualização: 2026-11-17 · loop-004

## Princípios

- **Leitura rápida primeiro.** O piloto está com atenção dividida entre o simulador e o painel. Toda informação relevante é visível sem rolagem e sem abrir submenus. (Exceção aceita no loop-003: com 12 cards no painel de tempo real, larguras de 900px ou menos podem exigir rolagem; ver [design.md](design.md).)
- **Interações breves.** Qualquer ação no painel de tempo real é concluída em no máximo um clique ou tecla. Fluxos que exigem mais de uma etapa pertencem ao debriefing, não ao painel de voo.
- **Foco por demanda.** O piloto pode maximizar qualquer seção ou gráfico individualmente para ter foco maior naquele dado. A maximização não altera os dados exibidos, apenas a área de visualização. (No painel de tempo real, a maximização ficou fora do loop-002 e é item do backlog.)
- **Estado sempre visível.** A interface sempre mostra se a sessão está ativa, encerrada ou se não há conexão com o simulador. Nunca deixa o piloto adivinhar o estado do sistema.
- **Sem surpresas.** Nenhuma ação destrutiva (ex.: encerramento de sessão) é executada sem que o sistema confirme visualmente o que aconteceu.

## Acessibilidade

- Contraste mínimo de 4,5:1 entre texto e fundo (WCAG AA) em todos os elementos de texto.
- Todos os elementos interativos são acessíveis por teclado (Tab, Enter, Esc).
- Gráficos e indicadores numéricos têm texto alternativo ou rótulo visível com o valor atual, para que a informação não dependa só de cor.
- Cores não são o único meio de distinguir estados (ex.: sessão ativa vs. encerrada usa cor + rótulo de texto).
- O "—" de sem sinal e o "N/A" de não aplicável usam `color-text-secondary` (não `color-text-disabled`, que fica abaixo de 4,5:1).

### Leitor de tela no painel de tempo real (UC-002)

- Cada indicador de parâmetro é um grupo (`role="group"`) com `aria-label` em texto, no formato "<rótulo>: <valor> <unidade>", "<rótulo>: sem sinal" ou, para parâmetro que a aeronave não possui, "<rótulo>: não aplicável" (loop-003). A precedência é a mesma do card: não aplicável, depois sem sinal, depois valor.
- Os indicadores não têm `aria-live`: a atualização a cada segundo não é anunciada, para não sobrecarregar o leitor de tela.
- O encerramento da sessão é anunciado uma única vez, pela notificação "Sessão encerrada. Dados salvos."; o aviso "Sessão encerrada" do painel não tem `role="status"`. Na falha ao gravar o encerramento (loop-004), quem anuncia é a notificação de erro.
- A notificação de sistema, inclusive a de erro, usa `role="status"` e `aria-live="polite"`.
- O aviso "Sem sinal do simulador" tem `role="status"`, para ser anunciado.

Débitos de acessibilidade (revisão do loop-002, sem decisão):
- Avisos com `role="status"` montados já com o texto podem não ser anunciados por alguns leitores de tela; uma região viva sempre montada seria mais segura. Não decidido.
- O indicador de estado da barra usa `aria-label` em `<div>` sem role e sem região viva; a perda de conexão não é anunciada.
- Os cards podem ser lidos em dobro (`aria-label` do grupo e texto interno).

Débitos de acessibilidade (revisão do loop-004; decisão do HITL-3: débito para um loop de UX do painel):
- A notificação de erro usa `role="status"`/`aria-live="polite"`; o usual para erro seria `role="alert"`.
- Cada notificação nova é remontada (para reiniciar os 4 s) já com o texto; isso estende o risco de não anúncio, descrito acima, à notificação que substitui outra.

## Feedback e mensagens de erro

- Toda operação que leva mais de 500 ms mostra um indicador de carregamento.
- Quando a sessão inicia automaticamente, o sistema exibe uma notificação discreta confirmando o início da coleta.
- Quando a sessão encerra automaticamente, o sistema exibe uma notificação de sucesso confirmando o encerramento: "Sessão encerrada. Dados salvos." A notificação usa o tipo `success`, só aparece depois de o encerramento ser gravado e desaparece em 4 segundos.
- Mensagens de erro descrevem o que aconteceu e o que o piloto pode fazer. Exemplo: "Não foi possível conectar ao simulador. Verifique se o Microsoft Flight Simulator 2024 está em execução."

### Encerramento da sessão (UC-003)

| Situação | Notificação | Tipo |
|---|---|---|
| Encerramento gravado | "Sessão encerrada. Dados salvos." | `success` |
| Falha ao gravar o encerramento | "Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura." | `error` |
| Sessão restaurada confirmada na abertura (motor ligado) | "Coleta iniciada" | `success` |
| Sessão encerrada na abertura do app | sem notificação (silencioso) | — |
| Falha ao gravar o encerramento feito na abertura | sem notificação; só log (a próxima abertura tenta de novo) | — |

- Exceção decidida à diretriz de mensagens de erro (HITL-3 do loop-004): o texto de erro do encerramento não pede ação ao piloto; em vez disso, diz que os dados do voo foram mantidos e que o encerramento será concluído na próxima abertura.
- Toda notificação nova fica 4 s completos na tela, mesmo que substitua outra ou repita o texto.
- Débito (HITL-3 do loop-004): "próxima abertura" pode não deixar claro que é a abertura do app. Os demais débitos de leitura da notificação de erro estão em [design.md](design.md), "Em aberto e débitos de UX".
- Estados vazios (ex.: nenhum voo registrado) explicam o motivo e orientam o próximo passo. Exemplo: "Nenhum voo registrado. Inicie o simulador e ligue o motor para começar."

### Painel de tempo real (UC-002)

- Cadência: os valores são atualizados a cada 1 s, com o valor lido do simulador. Atraso máximo aceitável entre o simulador e o painel: 2 s (conferido nos testes manuais no Windows com o MSFS 2024 dos loops 002 e 003).
- Limite de sem sinal: se a conexão com o simulador cair durante a sessão ou se passarem 2 s sem dados novos, os valores viram "—" e o painel mostra o aviso. Os valores voltam sozinhos quando os dados retornam. Cards N/A continuam "N/A".
- Não aplicável (UC-006, RN-007): o parâmetro que a aeronave não possui mostra "N/A" a sessão toda, com a unidade mantida. Flapes são N/A em aeronave sem flapes; Mistura é N/A em motor que não é a pistão. Um 0 válido (flapes recolhidos, RPM 0) aparece como 0, não como N/A.
- Textos do painel:

| Situação | Texto |
|---|---|
| Sem sessão (área principal) | "Inicie o simulador e ligue o motor para começar" |
| Carregando o estado inicial | "Aguardando..." |
| Sessão encerrada (aviso, valores congelados) | "Sessão encerrada" |
| Sem sinal (aviso, valores "—") | "Sem sinal do simulador" |
| Parâmetro que a aeronave não possui (no lugar do valor) | "N/A" |
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
- Rótulos de parâmetros usam a nomenclatura aeronáutica padrão, com os nomes de [domain_model.md](../engineering/domain_model.md). Rótulos do conjunto de 12 parâmetros, na ordem do painel:
  - Conjunto inicial (loop-002): **Altitude MSL** (ft), **Velocidade IAS** (kt), **Velocidade vertical** (fpm), **Rumo magnético** (°), **Arfagem** (°), **Rolagem** (°). Usa-se "Rumo magnético", não "proa".
  - Ampliação (loop-003, UC-006): **Latitude** (°), **Longitude** (°), **Manete** (%), **Mistura** (%), **RPM** (rpm), **Flapes** (%).
- O produto suporta, por enquanto, só aeronaves de um motor (decisão do HITL-3 do loop-003). Por isso "Manete", "Mistura" e "RPM" não indicam o motor no rótulo.
- A unidade é exibida como rótulo à parte, nunca dentro do valor.
- Botões e ações usam verbos no infinitivo: "Iniciar", "Encerrar", "Selecionar", "Maximizar".

## Formatação de valores numéricos

Regras do painel de tempo real (UC-002; 6 parâmetros novos no UC-006):

| Parâmetro | Casas | Regra | Exemplo |
|---|---|---|---|
| Altitude MSL (ft) | 0 | inteiro; só o sinal de menos aparece | `4.500` |
| Velocidade IAS (kt) | 0 | inteiro; negativo vira 0 | `112` |
| Velocidade vertical (fpm) | 0 | múltiplo de 10; "+" ou "−" explícito | `+650` |
| Rumo magnético (°) | 0 | 3 dígitos, de 000 a 359; 360 vira 000 | `005` |
| Arfagem (°) | 1 | "+" com o nariz para cima, "−" para baixo | `+5,2` |
| Rolagem (°) | 1 | valor absoluto + "E" (esquerda) ou "D" (direita); zero sem letra | `12,3 D` |
| Latitude (°) | 5 | graus decimais em valor absoluto + "N" ou "S"; zero aparece "0,00000" sem letra | `23,55052 S` |
| Longitude (°) | 5 | graus decimais em valor absoluto + "L" ou "O"; zero aparece "0,00000" sem letra | `46,63331 O` |
| Manete (%) | 0 | inteiro; reverso com "−" | `85`, `−20` |
| Mistura (%) | 0 | inteiro | `100` |
| RPM (rpm) | 0 | inteiro, com ponto de milhar | `2.450` |
| Flapes (%) | 0 | inteiro, limitado a 0..100 (extensão física da superfície, não o detente) | `30` |

Regras gerais:
- Latitude e longitude: o "°" fica no rótulo da unidade, não no valor (decisão do HITL-1 do loop-003).
- O banco grava os valores com precisão total; o arredondamento é só na exibição.
- Locale `pt-BR`: vírgula decimal e ponto de milhar.
- Negativos usam o sinal de menos tipográfico (U+2212, "−"), não o hífen.
- "−0" é exibido como "0".
- Valor ausente ou inválido (`null`, `NaN`, `Infinity`) é exibido como "—".
- Os sinais de arfagem e rolagem são corrigidos só na exibição; o sentido foi confirmado no teste manual no Windows com o MSFS 2024 (loop-002).
- Débito: o arredondamento da velocidade vertical é assimétrico perto de zero (+5 fpm vira "+10", −5 fpm vira "0").
