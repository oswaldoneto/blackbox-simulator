# Design

> Propósito: Diretrizes de design da interface gráfica.
> Atualizar quando: mudar um padrão visual ou entrar um componente novo.
> Relacionados: [usability.md](usability.md)
> Última atualização: 2026-11-17 · loop-006

## Princípios visuais

- **Dados em evidência.** O conteúdo (números, gráficos) ocupa o máximo de espaço. Chrome e decoração são mínimos.
- **Hierarquia clara.** O valor atual de um parâmetro é sempre maior e mais visível que seu rótulo e histórico.
- **Consistência de layout.** Painéis e cards seguem a mesma estrutura em todas as telas, para que o piloto encontre a informação pelo hábito, não pela busca.
- **Tema claro.** A interface usa fundo branco/cinza claro para funcionar bem em ambientes com luz ambiente variada.
  - Exceção decidida (HITL-1 do loop-006): o painel de instrumentos do debriefing (UC-005) é escuro, para imitar um painel de avião. O resto da tela do voo (cabeçalho, reprodução, trajetória e perfil vertical) segue o tema claro. Os tokens do painel escuro são os `color-panel-*`, com contraste conferido (ver "Cores do debriefing").

## Cores

| Token | Hex | Uso |
|-------|-----|-----|
| `color-bg` | `#F5F7FA` | Fundo da aplicação |
| `color-surface` | `#FFFFFF` | Fundo de cards e painéis |
| `color-border` | `#DDE1E7` | Bordas de cards e separadores |
| `color-text-primary` | `#161616` | Texto principal, valores de parâmetros |
| `color-text-secondary` | `#525252` | Rótulos, metadados, timestamps |
| `color-text-disabled` | `#A8A8A8` | Texto desabilitado |
| `color-accent` | `#0F62FE` | Ações primárias, links, destaque de seleção |
| `color-success` | `#24A148` | Sessão ativa, estado OK |
| `color-warning` | `#F1C21B` | Alertas não críticos |
| `color-error` | `#DA1E28` | Erros, falha de conexão |
| `color-chart-1` | `#0F62FE` | Primeira série de gráfico |
| `color-chart-2` | `#FF832B` | Segunda série de gráfico |
| `color-chart-3` | `#24A148` | Terceira série de gráfico |
| `color-chart-4` | `#8A3FFC` | Quarta série de gráfico |

Regra: estado de sessão ativa usa `color-success` + rótulo "Sessão ativa". Estado encerrado usa `color-text-secondary` + rótulo "Encerrada". Cor nunca é o único indicador de estado.

### Cores do debriefing (loop-006, UC-005)

Tokens definidos em `src/renderer/styles/global.css`. Os contrastes marcados com (loop) foram medidos no loop-006; os marcados com (calc) foram calculados na documentação, pela fórmula de luminância relativa da WCAG.

Painel de instrumentos escuro:

| Token | Hex | Uso | Contraste |
|-------|-----|-----|-----------|
| `color-panel-bg` | `#2F3438` | Fundo do painel | — |
| `color-panel-bezel` | `#4A5056` | Aro dos mostradores, borda das alavancas, separador da coluna lateral | — |
| `color-panel-face` | `#161616` | Face dos mostradores e trilho das alavancas | — |
| `color-panel-housing` | `#3A3F44` | Caixa do quadrante de manete e mistura | — |
| `color-panel-title` | `#F4F4F4` | Título "Painel de instrumentos" | ~11,5:1 sobre `color-panel-bg` (calc) |
| `color-panel-text` | `#FFFFFF` | Valores, ponteiros, marcas e números das escalas | ~12,6:1 sobre `color-panel-bg`; ~18:1 sobre `color-panel-face` (calc) |
| `color-panel-label` | `#C6C6C6` | Rótulos e unidades dos instrumentos, escalas das alavancas e dos flapes | ~7,4:1 sobre `color-panel-bg` (calc) |
| `color-panel-muted` | `#A8A8A8` | "—", "N/A" e "Sem dados neste voo" no painel | ~5,3:1 sobre `color-panel-bg` (loop) |
| `color-panel-scale-label` | `#A8B3C2` | Legendas dentro dos mostradores ("KT", "RPM ×100", "ALT ×100 FT", "FPM ×100") | ~8,5:1 sobre `color-panel-face` (calc) |
| `color-panel-sky` | `#4A90D9` | Céu do horizonte artificial | — |
| `color-panel-ground` | `#8B5A2B` | Terra do horizonte artificial | — |
| `color-panel-marker` | `#FF832B` | Avião de referência do horizonte e índice da bússola | ~7,4:1 sobre `color-panel-face` (calc) |
| `color-panel-mixture` | `#FF6F75` | Alavanca de mistura | 3,94:1 sobre `color-panel-housing` (loop; era `#DA1E28`, com 2,13:1) |
| `color-panel-flap` | `#78A9FF` | Superfície do flape no indicador | — |
| `color-panel-wing` | `#DDE1E7` | Perfil da asa no indicador de flapes | — |
| `color-panel-tick` | `#8D96A3` | Marcas e contorno do indicador de flapes | — |

- O `#A8A8A8` de `color-panel-muted` é o mesmo hex de `color-text-disabled`, mas só é usado sobre o fundo escuro, onde passa dos 4,5:1. No tema claro o "—" e o "N/A" continuam em `color-text-secondary`.

Trajetória e perfil vertical (tema claro):

| Token | Hex | Uso | Contraste |
|-------|-----|-----|-----------|
| `color-track-flown` | `#0F62FE` | Trecho já voado da trajetória | 4,66:1 sobre `color-bg` (loop) |
| `color-track-remaining` | `#7A8290` | Trecho restante da trajetória | 3,61:1 sobre `color-bg` (loop; era `#C3CAD5`, com 1,54:1) |
| `color-profile-line` | `#0F62FE` | Linha da altitude no perfil | ~5:1 sobre `color-surface` (calc) |
| `color-profile-fill` | `#E5EDFF` | Área sob a linha da altitude | decorativo |
| `color-profile-fill-flown` | `#BFD2FF` | Área até o instante | decorativo; o cursor marca o instante |
| `color-profile-grid` | `#EEF0F3` | Linha de grade do meio do perfil | decorativo |

- Sem faixas de cor (arcos verde, amarelo e vermelho) na velocidade e no RPM, por enquanto: as faixas dependem da aeronave, que ainda não é gravada (decisão do HITL-1 do loop-006). As escalas são largas e genéricas (ver "Painel de instrumentos do debriefing").

## Tipografia

| Papel | Família | Tamanho | Peso | Onde usar |
|-------|---------|---------|------|-----------|
| Título de tela | IBM Plex Sans | 20px | 600 | Cabeçalho de cada tela |
| Título de seção | IBM Plex Sans | 16px | 600 | Cabeçalho de card ou painel |
| Corpo | IBM Plex Sans | 14px | 400 | Textos descritivos, mensagens |
| Rótulo | IBM Plex Sans | 12px | 500 | Rótulos de parâmetros e metadados |
| Valor de parâmetro | IBM Plex Mono | 24px | 400 | Valor numérico atual de um parâmetro em tempo real |
| Valor secundário | IBM Plex Mono | 14px | 400 | Valores em listas (card de sessão) e no debriefing (valores dos instrumentos, tempo do reprodutor, leituras da trajetória e do perfil) |

- Fallback para ambas as famílias: `ui-sans-serif, system-ui, sans-serif` e `ui-monospace, monospace`.
- Fonte monoespaçada para valores numéricos evita que os dígitos saltem lateralmente quando o valor muda.
- **Fonte local obrigatória:** a fonte deve ser servida localmente no pacote Electron; Google Fonts (CDN externo) não é suportado em ambientes offline. Implementado no loop-002 com os pacotes `@fontsource/ibm-plex-sans` e `@fontsource/ibm-plex-mono`, importados pelo renderer.
- Valores de parâmetro usam `font-variant-numeric: tabular-nums` além da fonte monoespaçada.

## Componentes

### Indicador de parâmetro
- Usado em: painel de tempo real (UC-002).
- Estrutura: card com fundo `color-surface`, borda `color-border`, raio 4px, padding 16px; rótulo do parâmetro no topo e, abaixo, valor e unidade alinhados pela linha de base.
- Exibe: rótulo do parâmetro (tipografia Rótulo, `color-text-secondary`), valor atual (Valor de parâmetro, `color-text-primary`), unidade como rótulo à parte (Rótulo, `color-text-secondary`). O valor segue as regras de formatação de [usability.md](usability.md).
- A linha de valor e unidade quebra (`flex-wrap: wrap`): quando o valor é longo (ex.: "123,45678 O" em card estreito), a unidade desce para a linha de baixo em vez de estourar o card (loop-003, confirmado no HITL-2).
- Estados:
  - **normal:** valor em `color-text-primary`.
  - **sem sinal:** valor substituído por "—" em `color-text-secondary`, para cumprir o contraste de 4,5:1 (decisão do HITL-1 do loop-002, que substitui o antigo "texto desabilitado").
  - **N/A (não aplicável):** a aeronave não possui o item (RN-007, UC-006). O valor é substituído por "N/A" no mesmo estilo do "—" (`color-text-secondary`); a unidade continua visível (decisão do HITL-1 do loop-003).
- Precedência dos estados do card: N/A, depois "—", depois valor. O card N/A continua "N/A" com sinal perdido e com a sessão encerrada.
- A lista de parâmetros N/A vem da sessão (decidida ao ligar o motor e válida a sessão toda); o card não decide sozinho.
- Valores congelados (sessão encerrada) usam o mesmo estilo dos valores ao vivo; a diferença é dada pelo aviso do painel.
- Maximização: prevista pelo princípio "Foco por demanda", mas fora do escopo do loop-002; virou item do backlog.
- Implementado em: UC-002 (`parameter-indicator.tsx`); estado N/A no UC-006.

### Painel de tempo real
- Usado em: área principal da janela do app (UC-002). Não há segunda janela.
- Aparece sozinho quando há sessão (ativa ou encerrada); sem sessão, a área principal mostra a mensagem de orientação.
- Estrutura: aviso do painel (quando houver) acima da grade de indicadores de parâmetro.
- Estados (precedência: sem sessão, depois encerrada, depois sem sinal, depois ativa):
  - **Sem sessão:** painel não é exibido; a área principal mostra "Inicie o simulador e ligue o motor para começar".
  - **Ativa:** grade com os valores ao vivo, atualizados a cada ciclo de 1 s.
  - **Encerrada:** últimos valores congelados e aviso "Sessão encerrada". Ocorre no uso real desde o loop-004 (UC-003): quando a sessão encerra (aeronave no solo e motor parado por 15 s seguidos) e também quando a gravação do encerramento falha (a tela mostra "Encerrada" e a falha aparece só na notificação de erro). O painel fica encerrado até o motor ser religado (nova sessão, com "Coleta iniciada") ou o app ser fechado.
  - **Sem sinal:** conexão com o simulador perdida durante a sessão ou 2 s sem dados novos; os valores viram "—" (exceto os cards N/A, que continuam "N/A") e aparece o aviso "Sem sinal do simulador". Os valores voltam quando os dados retornam.
  - **Erro ao carregar parâmetros:** se a consulta dos parâmetros ativos falhar, a grade é substituída pelo aviso "Não foi possível carregar os parâmetros."
- Enquanto a consulta inicial não responde, a área principal mostra "Aguardando..." em `color-text-secondary`.
- Reabertura do app (loop-004, UC-003): a sessão encerrada não é mostrada de novo; a área principal mostra a orientação "Inicie o simulador e ligue o motor para começar". Uma sessão ativa gravada passa por uma verificação de até 15 s; durante ela a tela mostra a orientação (e a barra "Aguardando motor", se conectado), mesmo com o motor ligado. Se o motor estiver ligado, a sessão é confirmada e aparece "Coleta iniciada" com o painel; se não, é encerrada em silêncio e a orientação continua.
- Implementado em: UC-002 (`realtime-panel.tsx`, `realtime-panel.css`); 12 parâmetros e estado N/A no UC-006; estado "Encerrada" no uso real e reabertura no UC-003.

### Aviso do painel
- Usado em: painel de tempo real (UC-002), para "Sessão encerrada", "Sem sinal do simulador" e "Não foi possível carregar os parâmetros.".
- Posição: acima da grade, com 16px de espaço abaixo.
- Estilo: tipografia Corpo, `color-text-secondary`, sem fundo nem ícone. Erro, sem sinal e aviso informativo usam o mesmo estilo neutro (ver "Em aberto").
- Implementado em: UC-002.

### Card de sessão
- Usado em: lista de voos (UC-004).
- Elemento: botão (`<button>`) da largura da lista, fundo `color-surface`, borda 1px `color-border`, raio 4px, padding 16px, texto alinhado à esquerda, 4px entre as linhas.
- Exibe, em duas linhas:
  - data · hora de início ("dd/mm/aaaa · HH:mm") em Valor secundário (IBM Plex Mono 14px, `color-text-primary`, `tabular-nums`);
  - rótulo "Duração" (Rótulo, `color-text-secondary`) seguido do valor h:mm:ss em Valor secundário.
- Não exibe indicador de estado (a lista só tem sessões encerradas) nem aeronave (o campo não é gravado hoje; decisão do HITL-1 do loop-005). Valor inválido ou ausente aparece como "—".
- Estados: **normal**; **hover** (borda `color-accent`); **foco** (contorno `color-accent` de 2px, afastado 2px). Não há estado "selecionado": o clique abre o voo direto.
- Interação: clique ou Enter abre a tela do voo (debriefing, desde o loop-006). Formatos e rótulo acessível em [usability.md](usability.md).
- Implementado em: UC-004 (`flight-card.tsx`, `flight-card.css`).

### Navegação da barra superior
- Usada em: barra superior, em todas as telas (UC-004).
- Botões "Painel" e "Voos" dentro de `<nav aria-label="Navegação principal">`, logo à direita do nome do app (24px do nome, 16px entre os botões), sempre visíveis, inclusive durante uma sessão ativa.
- Estilo: tipografia Corpo com peso 500 (IBM Plex Sans 14px/500), `color-text-secondary`, sem fundo nem borda, altura da barra (48px).
- Estados: **normal**; **hover** (`color-text-primary`); **atual** (`color-accent` + sublinhado de 2px `color-accent` + `aria-current="page"`); **foco** (contorno `color-accent` de 2px por dentro do botão).
- A tela do voo pertence à seção "Voos": com ela aberta, "Voos" fica marcado como atual.
- Clicar no botão da seção atual não muda nada na tela (ver "Em aberto e débitos de UX").
- Implementado em: UC-004 (`StatusBar.tsx`, `status-bar.css`).

### Componentes do debriefing (UC-005)

Referência visual: protótipo "Debriefing · opção D", aprovado antes do loop-006 (https://claude.ai/artifact/J3ykDbrQjy6Gc32oHSudjk). O que ficou fora do loop está em "Tela: debriefing". Textos e acessibilidade em [usability.md](usability.md).

Todos os componentes mostram o mesmo **instante selecionado** da linha do tempo, em segundos inteiros. O valor de cada parâmetro é a última leitura gravada até o instante, sem interpolar. Se a última leitura tiver 2 s ou mais, o parâmetro mostra "—".

#### Seção clara do debriefing
- Base da reprodução, da trajetória e do perfil vertical.
- Estilo de card: fundo `color-surface`, borda 1px `color-border`, raio 4px, padding 16px, 8px entre os itens.
- Cabeçalho da seção: título (Título de seção, 16px/600) à esquerda e leitura do instante à direita (Valor secundário, com rótulos e unidades em Rótulo, `color-text-secondary`). Quebra de linha quando falta largura.
- Legenda: 12px, `color-text-secondary`.
- "—" e textos de indisponível: `color-text-secondary`.

#### Cabeçalho do voo
- Título de tela "Voo de dd/mm/aaaa" (h1, 20px/600).
- Logo abaixo, a linha "Início HH:mm · Duração h:mm:ss" (Corpo, `color-text-secondary`; a duração em IBM Plex Mono com `tabular-nums`).
- Botão "Voltar à lista" à direita, alinhado pela base. O cabeçalho quebra em linhas quando falta largura.
- Botão "Voltar à lista": contorno de 1px e texto em `color-accent` (IBM Plex Sans 14px/500), fundo `color-surface`, raio 4px, padding 8px 16px, altura mínima de 44px; hover com fundo `color-bg`; foco com contorno `color-accent` de 2px, afastado 2px. Esc também volta à lista e para a reprodução.
- Implementado em: UC-005 (`flight-detail-page.tsx`, `flight-detail-page.css`).

#### Reprodutor
- Seção clara com rótulo acessível "Reprodução do voo", acima da trajetória e do painel.
- Linha de controles (quebra quando falta largura):
  - botão Reproduzir/Pausar: círculo de 44×44 px, fundo `color-accent`, ícone em `color-surface`; foco com contorno `color-accent` de 2px, afastado 2px;
  - grupo de velocidades 1×, 4× e 16×: botões segmentados de 48×36 px dentro de uma borda 1px `color-border`, raio 4px, em IBM Plex Mono 13px. Normal: fundo `color-surface`; hover: fundo `color-bg`; selecionado (`aria-pressed`): fundo `color-accent` e texto `color-surface`;
  - à direita, o tempo "h:mm:ss de h:mm:ss · HH:mm:ss" em IBM Plex Mono 14px com `tabular-nums`; o tempo decorrido em peso 500.
- Foco do grupo de velocidades (rodada curta do loop-006): contorno `color-accent` de 2px por dentro do botão (`outline-offset: -2px`) mais um anel interno `color-surface` de 4px (`box-shadow` inset). Assim o foco aparece nos dois estados: o contorno sobre o fundo branco e o anel branco sobre o fundo accent do botão selecionado, com 5,00:1. O contorno fica por dentro porque o grupo tem `overflow: hidden`.
- Linha do tempo: controle deslizante nativo da largura da seção, com `accent-color: color-accent`, passo de 1 s, de 0 até a duração; foco com contorno `color-accent` de 2px, afastado 2px.
- Abre pausado em 0:00:00, a 1×. Pausa sozinho no fim; Reproduzir no fim recomeça do zero.
- Sem marcadores de evento (decolagem e pouso), por enquanto.
- Implementado em: UC-005 (`flight-player.tsx`).

#### Trajetória
- Seção clara "Trajetória", com a latitude e a longitude do instante no cabeçalho (rótulo, valor e unidade; "—" em `color-text-secondary` sem posição).
- Desenho em SVG (`viewBox` 1000×700, `preserveAspectRatio` meet), sobre fundo `color-bg` com raio 4px. Sem mapa de fundo, sem grade e sem pista; norte para cima, com seta e "N" em `color-text-secondary` no canto superior direito.
- Traços (correção da rodada curta do loop-006):
  - trecho já voado: contínuo, 4px, `color-track-flown`, pontas e junções arredondadas;
  - trecho restante: pontilhado de 2px, `stroke-dasharray: 2 6`, pontas `round`, `color-track-remaining`;
  - os dois com `vector-effect: non-scaling-stroke`, para as espessuras valerem em px de tela (sem isso o viewBox afinaria o pontilhado para cerca de 1px);
  - as cores dos dois têm luminância parecida (cerca de 1,3:1 entre si); a separação vem da espessura e do padrão. Uma falha de dados aparece como um vão bem maior que o espaço entre os pontos.
- Perda de dados (mais de 2 s sem posição) interrompe a linha.
- Aeronave no instante: silhueta em `color-text-primary` com contorno `color-surface` de 2px, girada pelo rumo magnético; sem rumo, um círculo; sem posição nos 2 s até o instante, escondida.
- Legenda abaixo do desenho, que não depende só do nome da cor (texto em [usability.md](usability.md)).
- Trajetória indisponível (voo sem latitude e longitude): no lugar do desenho, mensagem centralizada em Corpo, `color-text-secondary`, dentro de uma caixa com borda tracejada 1px `color-border`, altura mínima de 320px.
- Implementado em: UC-005 (`trajectory-map.tsx`).

#### Painel de instrumentos do debriefing
- Bloco escuro (exceção ao "Tema claro"): fundo `color-panel-bg`, raio 8px, padding 16px, título "Painel de instrumentos" (16px/600, `color-panel-title`).
- Estrutura: grade de 3 colunas e 2 linhas com os seis mostradores redondos (velocímetro, horizonte artificial, altímetro; tacômetro, bússola, variômetro) e, à direita, uma coluna lateral separada por uma borda 1px `color-panel-bezel`, com o quadrante de manete e mistura e o indicador de flapes.
- Cada instrumento: desenho em SVG (largura máxima de 170px) e, abaixo, para cada parâmetro, o rótulo (11px/500, `color-panel-label`) e o valor (IBM Plex Mono 14px, `tabular-nums`, `color-panel-text`) com a unidade (12px, `color-panel-label`).
- Mostradores:
  - velocímetro: IAS de 0 a 200 kt;
  - horizonte artificial: arfagem e rolagem, com a arfagem limitada a ±25° no desenho;
  - altímetro: dois ponteiros;
  - tacômetro: RPM de 0 a 3.500;
  - bússola: rosa girada pelo rumo, índice fixo em `color-panel-marker`;
  - variômetro: VS de ±2.000 fpm;
  - quadrante de manete e mistura: alavancas de 0 a 100 %;
  - indicador de flapes: desenho esquemático proporcional ao %, de 0 a 100 %, sem graus (só o % é gravado).
- Sem faixas de cor, por enquanto (ver "Cores do debriefing").
- Estados de cada parâmetro (precedência: N/A, depois "Sem dados neste voo", depois "—", depois valor):
  - **valor:** ponteiro na posição e número com a unidade. Fora da escala, o ponteiro para no limite e o número mostra o valor real;
  - **N/A:** "N/A" em `color-panel-muted`, sem ponteiro;
  - **sem dados no instante:** "—" em `color-panel-muted`, sem ponteiro;
  - **sem dados neste voo** (parâmetro aplicável sem nenhuma leitura no voo, como os 6 parâmetros novos em voos antigos): "Sem dados neste voo" em `color-panel-muted`, sem ponteiro.
  - Nos três estados sem valor, a unidade some (ver "Em aberto").
- Implementado em: UC-005 (`instrument-panel.tsx`, `instrument-panel.css`, `instrument-slot.tsx`, `round-dial.tsx` e um arquivo por mostrador).

#### Perfil vertical
- Seção clara "Perfil vertical", com a altitude e a velocidade vertical do instante no cabeçalho (sem unidade quando o valor é "—" ou N/A).
- Gráfico de área em SVG (`viewBox` 1000×200, `preserveAspectRatio` none, altura de 180px), com a altitude ao longo da duração inteira:
  - área em `color-profile-fill`, e a parte até o instante em `color-profile-fill-flown`;
  - linha de 1,5px em `color-profile-line`; cursor vertical de 1,5px em `color-text-primary` no instante; uma linha de grade no meio em `color-profile-grid`; todos com `non-scaling-stroke`;
  - perda de dados interrompe a linha e a área.
- Eixo Y à esquerda só com o máximo e o mínimo do voo; eixo X embaixo com 5 marcas de tempo (0, 25, 50, 75 e 100 % da duração) em h:mm:ss. Os dois em IBM Plex Mono 11px, `color-text-secondary`.
- A redução de pontos é só no desenho e preserva máximos e mínimos.
- Sem altitude no voo: no lugar do gráfico, "<rótulo>: Sem dados neste voo" em Corpo, `color-text-secondary`.
- Implementado em: UC-005 (`vertical-profile.tsx`).

### Notificação de sistema
- Usada em: confirmação de início de sessão (UC-001), encerramento e falha ao gravar o encerramento (UC-003).
- Posição: canto superior direito, sobreposta ao conteúdo, sem bloquear a leitura.
- Largura máxima de 320 px; textos longos quebram em várias linhas (o texto de erro do UC-003 ocupa 3 a 4 linhas).
- Desaparece automaticamente após 4 segundos. Uma notificação nova substitui a anterior e o tempo de 4 s reinicia, inclusive quando o texto é igual (loop-004, HITL-3). Ex.: "Sessão encerrada. Dados salvos." seguida de "Coleta iniciada" 1 s depois fica 4 s completos na tela.
- Não pode ser fechada nem pausada pelo piloto.
- Estados: **informativo** (`color-accent`), **sucesso** (`color-success`), **erro** (`color-error`), **warning** (fundo `color-warning`, texto `color-text-primary` (#161616) para garantir contraste WCAG AA — razão ~12:1).
- No UC-003: sucesso "Sessão encerrada. Dados salvos." só depois de o encerramento ser gravado; erro "Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura." se a gravação falhar. O encerramento feito na abertura do app não gera notificação. Textos em [usability.md](usability.md).
- Implementado em: UC-001; sucesso e erro do encerramento e reinício do tempo no UC-003.

### Indicador de estado da sessão
- Sempre visível na barra superior da aplicação.
- Exibe: ponto colorido + rótulo de texto ("Sem conexão", "Sessão ativa", "Encerrada", "Aguardando motor").
- Estados, em ordem de precedência (o primeiro que se aplica vence):
  - **Sem conexão:** simulador não acessível (`conexao === 'desconectado'`) → `color-error` + "Sem conexão". Vence os demais, inclusive "Sessão ativa" (queda durante o voo) e "Encerrada".
  - **Ativo:** conectado e `sessaoAtiva.status === 'ativa'` → `color-success` + "Sessão ativa".
  - **Encerrada:** conectado e sessão com status diferente de `'ativa'` → `color-text-secondary` + "Encerrada". Ocorre no uso real desde o loop-004 (UC-003), inclusive na falha ao gravar o encerramento.
  - **Aguardando motor:** conectado e sem sessão → `color-text-secondary` + "Aguardando motor".
- "Sem conexão" se refere só à conexão com o simulador; não é mais usado para "sem sessão" (loop-002, HITL-1).
- Os 2 s sem dados com a conexão aberta não alteram a barra (continua "Sessão ativa"); o estado aparece no aviso do painel.
- Na verificação de até 15 s da reabertura do app, a barra mostra "Aguardando motor" (se conectado), mesmo com o motor ligado (loop-004).
- Implementado em: UC-001; estados revistos no UC-002; "Encerrada" no uso real no UC-003.

## Layout

### Estrutura geral
- Barra superior fixa (48px): nome da aplicação à esquerda, logo à direita dele a navegação "Painel"/"Voos", e o indicador de estado da sessão à direita (loop-005).
- A barra superior, o indicador de estado e a notificação de sistema ficam visíveis em todas as telas (painel, lista de voos e tela do voo, que é o debriefing desde o loop-006).
- Área de conteúdo abaixo da barra, sem menu lateral fixo. A tela mostrada na área de conteúdo é uma de três: painel de tempo real, lista de voos ou tela do voo.
- O app abre no painel.
- Volta automática ao painel: quando uma sessão começa (motor ligado) com a lista ou a tela do voo aberta, o painel aparece sozinho, com a notificação "Coleta iniciada" (UC-002 inalterado). O encerramento de uma sessão não troca de tela.
- A coleta continua normalmente em qualquer tela; ao voltar ao painel, os valores ao vivo estão lá.
- O painel tem um título "Painel de tempo real" visualmente oculto (h1 só para leitor de tela), que recebe o foco nas trocas de tela; ver [usability.md](usability.md).

### Tela: painel de tempo real (UC-002)
- Ocupa a área principal da janela do app.
- Grade de 4 colunas e 3 linhas (4x3), com 16px de espaço entre cards, para os 12 parâmetros, uma linha por grupo (loop-003, UC-006):
  - Linha 1 (voo): Altitude MSL, Velocidade IAS, Velocidade vertical, Rumo magnético.
  - Linha 2 (atitude e posição): Arfagem, Rolagem, Latitude, Longitude.
  - Linha 3 (motor e configuração): Manete, Mistura, RPM, Flapes.
- Os grupos não têm título nem separador visual; a divisão vem só da linha da grade (ver "Em aberto e débitos de UX").
- Cada indicador ocupa um card.
- Maximização de card (card ocupando a área de conteúdo, com botão "Reduzir" para voltar à grade): fora do escopo do loop-002; item do backlog.

### Tela: lista de voos (UC-004)
- Acesso: botão "Voos" da barra superior.
- Título de tela "Voos" (h1, Título de tela, 16px abaixo).
- Coluna única de cards de sessão, com 8px entre eles e rolagem vertical simples (sem paginação; filtro e busca fora do loop-005).
- Mostra só as sessões encerradas, inclusive curtas, de duração 0 e antigas, ordenadas pela hora de início, da mais recente para a mais antiga (desempate pela ordem de gravação). A sessão ativa não aparece.
- A lista é buscada a cada abertura da tela e de novo quando uma sessão encerra com ela aberta.
- Estados (textos em [usability.md](usability.md)):
  - **Carregando:** mensagem em Corpo, `color-text-secondary`, alinhada à esquerda, só se a busca passar de 500 ms.
  - **Vazio:** mensagem em Corpo, `color-text-secondary`, centralizada, com 48px de espaço vertical. Vale também quando só existe a sessão ativa.
  - **Erro:** mensagem em Corpo, `color-text-secondary`, alinhada à esquerda, só se a primeira carga falhar; sem nova tentativa automática. Uma falha numa nova busca mantém a lista anterior.
  - **Lista:** os cards.
- Implementado em: UC-004 (`pages/flight-list/flight-list-page.tsx`).

### Tela: debriefing (tela do voo, UC-005)
- Aberta pelo clique (ou Enter) num card da lista. Substituiu, no loop-006, a tela provisória do UC-004 (bloco "Data", "Hora de início" e "Duração" e o aviso "Debriefing disponível em breve").
- Coluna única de cima para baixo, com 16px entre os blocos:
  1. cabeçalho do voo;
  2. reprodutor;
  3. uma linha com a trajetória (à esquerda, base de 440px) e o painel de instrumentos (à direita, base de 600px e mais espaço quando sobra largura);
  4. perfil vertical.
- Estados (textos em [usability.md](usability.md)):
  - **Carregando:** só o cabeçalho e a mensagem em Corpo, `color-text-secondary`, só se a carga passar de 500 ms.
  - **Erro:** só o cabeçalho e a mensagem de erro, no mesmo estilo; sem nova tentativa automática (reabrir o voo carrega de novo).
  - **Voo sem leituras:** só o cabeçalho e a mensagem, no mesmo estilo; sem reprodutor, trajetória, painel nem perfil.
  - **Normal:** os quatro blocos.
  - Dentro do estado normal, a trajetória pode estar indisponível e cada parâmetro pode estar em N/A, "—" ou "Sem dados neste voo" (ver os componentes).
- Uma sessão que começa com a tela do voo aberta para a reprodução e leva ao painel com "Coleta iniciada".
- Fora do loop-006 (protótipo D e versão antiga desta seção): marcadores de evento e pista no mapa; faixas de cor por aeronave; ângulo real dos flapes; rumo verdadeiro; mapa de fundo; maximização de seção; gráficos por parâmetro com seletor; comparação entre voos, exportação, filtros e anotações. O que virou item está no backlog.
- Implementado em: UC-005 (`pages/flight-detail/`).

### Comportamento em janelas menores
- A janela tem tamanho mínimo de 640 x 480 px (loop-005), para a barra superior com a navegação não cortar o indicador de estado (antes, abaixo de cerca de 430 px, ele ficava cortado). Conferido no teste manual no Windows do loop-005 (v0.5.0).
- A grade do painel de tempo real tem 4 colunas acima de 900px, 2 colunas entre 600px e 900px e 1 coluna abaixo de 600px, sempre na ordem dos grupos (decisão do HITL-1 do loop-003).
- Com 12 cards, larguras de 900px ou menos podem exigir rolagem vertical para ver todos os parâmetros (consequência aceita da grade 4/2/1; ver "Em aberto e débitos de UX").
- A 2 colunas, cada grupo ocupa duas linhas da grade e a divisão entre grupos deixa de ser visível.
- A lista de voos mantém layout de coluna única em qualquer largura.
- Debriefing (loop-006): os blocos seguem em coluna única, mas a linha da trajetória com o painel de instrumentos quebra (`flex-wrap`): quando não cabem os dois lado a lado (cerca de 1.056px de conteúdo, as duas bases mais o espaço), o painel desce para baixo da trajetória. Dentro do painel, a coluna lateral (manete, mistura e flapes) desce para baixo da grade de mostradores quando falta largura; a grade fica sempre com 3 colunas, e os mostradores encolhem. O cabeçalho do voo, os controles do reprodutor e os cabeçalhos das seções também quebram em linhas. A 640×480 isso exige rolagem (ver "Em aberto").
- As colunas da grade (4/2/1) foram conferidas no teste manual no Windows com o MSFS 2024 do loop-003 (v0.3.0).

## Em aberto e débitos de UX

Pontos levantados na revisão de usabilidade do loop-002 que ficaram como débito e dependem de decisão humana:

- **Cor dos avisos do painel:** erro ("Não foi possível carregar os parâmetros."), sem sinal e aviso informativo usam o mesmo estilo neutro; não está decidido se erro e sem sinal devem usar `color-error` ou `color-warning`.
- **Valores congelados:** na sessão encerrada, os valores têm o mesmo estilo dos valores ao vivo; não está decidido se devem ter tratamento visual próprio.
- **Notificação sobre o card:** a notificação do canto superior direito cobre o card desse canto por 4 s.
- **Contraste da notificação `success`:** texto branco sobre `#24A148` dá cerca de 3,3:1, abaixo dos 4,5:1 de usability.md (vem do loop-001).

Pontos da revisão de usabilidade do loop-003:

- **Grupos sem título ou separador:** as três linhas da grade (voo, atitude e posição, motor e configuração) não têm título nem separador; a 2 colunas a divisão se perde. Decisão do HITL-3: débito de UX, para um loop de UX do painel junto com a maximização de card.
- **Rolagem com 12 cards:** em 900px ou menos, a grade de 2 ou 1 coluna pode exigir rolagem, em tensão com o princípio "Leitura rápida primeiro" de [usability.md](usability.md). Aceita como consequência da grade 4/2/1.

Pontos da revisão de usabilidade do loop-004 (UC-003). Decisão do HITL-3: débito de UX, para um loop de UX do painel junto com os débitos de notificação já registrados:

- **Tempo de leitura da notificação de erro:** o texto de erro do encerramento (19 palavras) provavelmente não é lido inteiro em 4 s com atenção dividida, e a notificação não pode ser fechada nem pausada (WCAG 2.2.1).
- **Notificação mais alta sobre o card:** com 3 a 4 linhas, a notificação de erro cobre mais o card do canto superior direito por 4 s (agrava "Notificação sobre o card").
- **Falha só visível na notificação:** na falha ao gravar o encerramento, painel e barra mostram "Encerrada" como no sucesso; a falha só aparece na notificação de 4 s.
- **Orientação durante a verificação na abertura:** por até 15 s após abrir o app, com o motor já ligado, a tela mostra "Aguardando motor" e a orientação para ligar o motor.

Pontos da revisão de usabilidade do loop-005 (UC-004). Decisão do HITL-3: débito de UX (os itens da rodada curta foram direto para débito, pela regra da rodada curta única). Os débitos de acessibilidade do loop estão em [usability.md](usability.md):

- **Borda do card de sessão:** o card é um botão, mas a borda `color-border` sobre `color-bg` tem contraste de cerca de 1,2:1, abaixo dos 3:1 usuais para contorno de componente.
- **"—" em cor primária:** no card de sessão, o "—" de valor inválido usa `color-text-primary`; no painel ele usa `color-text-secondary`. Na tela do voo deixou de valer no loop-006: a duração inválida aparece na linha de início e duração, em `color-text-secondary`.
- **Clique na seção atual:** clicar em "Painel" ou "Voos" estando na própria seção não dá retorno visual.
- **Alinhamento dos estados da lista:** o estado vazio é centralizado, enquanto carregando e erro ficam alinhados à esquerda.
- **Duração da tela do voo** (só em h:mm:ss): resolvido no loop-006: a duração e o tempo decorrido têm versão por extenso para leitor de tela (ver [usability.md](usability.md)).

Pontos da revisão de usabilidade do loop-006 (UC-005). Decisão do HITL-3: débito de UX (os demais não bloqueantes da revisão e os da rodada curta viram débito). As perguntas de diretriz e os débitos de acessibilidade estão em [usability.md](usability.md):

- **Tamanhos fora da escala tipográfica:** 13px nos botões de velocidade, 11px nos rótulos dos instrumentos e nos eixos do perfil, e 9 a 10px nas legendas e escalas dentro dos SVG. Os textos dos SVG ficam com cerca de 7 a 8,5px efetivos depois da escala do desenho.
- **Alvos abaixo de 44px:** os botões de velocidade têm 48×36px, e o polegar da linha do tempo é o nativo, menor que 44px. O botão Reproduzir/Pausar e o "Voltar à lista" já têm 44px. Depende da pergunta "o alvo de 44px vira diretriz?".
- **Unidade em N/A e "—":** nos instrumentos e no perfil vertical a unidade some quando o valor é N/A, "—" ou "Sem dados neste voo"; no painel de tempo real e na trajetória ela fica. Depende da pergunta "N/A mantém a unidade vale no debriefing?".
- **Rolagem tira a reprodução da vista:** a tela do voo exige rolagem, e ao descer até o perfil vertical os controles de reprodução saem da vista.
- **`color-text-secondary` dentro do painel escuro:** o centro dos ponteiros e a dobradiça do flape usam `color-text-secondary` (#525252) em vez de um token `color-panel-*`; sobre a face #161616 o contraste é baixo (gráfico, não texto).
- **"—" em todos os instrumentos em 0:00:00:** a primeira leitura pode chegar até 1 s depois do início, então o voo pode abrir com todos os instrumentos em "—".
- **Contraste gráfico da borda do grupo de velocidades:** a borda `color-border` fica abaixo de 3:1 (o tracejado da trajetória e a alavanca de mistura foram corrigidos na rodada curta). Depende da pergunta "o contraste gráfico de 3:1 vira diretriz?".
