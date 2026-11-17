# Design

> Propósito: Diretrizes de design da interface gráfica.
> Atualizar quando: mudar um padrão visual ou entrar um componente novo.
> Relacionados: [usability.md](usability.md)
> Última atualização: 2026-11-16 · loop-002

## Princípios visuais

- **Dados em evidência.** O conteúdo (números, gráficos) ocupa o máximo de espaço. Chrome e decoração são mínimos.
- **Hierarquia clara.** O valor atual de um parâmetro é sempre maior e mais visível que seu rótulo e histórico.
- **Consistência de layout.** Painéis e cards seguem a mesma estrutura em todas as telas, para que o piloto encontre a informação pelo hábito, não pela busca.
- **Tema claro.** A interface usa fundo branco/cinza claro para funcionar bem em ambientes com luz ambiente variada.

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

## Tipografia

| Papel | Família | Tamanho | Peso | Onde usar |
|-------|---------|---------|------|-----------|
| Título de tela | IBM Plex Sans | 20px | 600 | Cabeçalho de cada tela |
| Título de seção | IBM Plex Sans | 16px | 600 | Cabeçalho de card ou painel |
| Corpo | IBM Plex Sans | 14px | 400 | Textos descritivos, mensagens |
| Rótulo | IBM Plex Sans | 12px | 500 | Rótulos de parâmetros e metadados |
| Valor de parâmetro | IBM Plex Mono | 24px | 400 | Valor numérico atual de um parâmetro em tempo real |
| Valor secundário | IBM Plex Mono | 14px | 400 | Valores em tabelas e listas do debriefing |

- Fallback para ambas as famílias: `ui-sans-serif, system-ui, sans-serif` e `ui-monospace, monospace`.
- Fonte monoespaçada para valores numéricos evita que os dígitos saltem lateralmente quando o valor muda.
- **Fonte local obrigatória:** a fonte deve ser servida localmente no pacote Electron; Google Fonts (CDN externo) não é suportado em ambientes offline. Implementado no loop-002 com os pacotes `@fontsource/ibm-plex-sans` e `@fontsource/ibm-plex-mono`, importados pelo renderer.
- Valores de parâmetro usam `font-variant-numeric: tabular-nums` além da fonte monoespaçada.

## Componentes

### Indicador de parâmetro
- Usado em: painel de tempo real (UC-002).
- Estrutura: card com fundo `color-surface`, borda `color-border`, raio 4px, padding 16px; rótulo do parâmetro no topo e, abaixo, valor e unidade alinhados pela linha de base.
- Exibe: rótulo do parâmetro (tipografia Rótulo, `color-text-secondary`), valor atual (Valor de parâmetro, `color-text-primary`), unidade como rótulo à parte (Rótulo, `color-text-secondary`). O valor segue as regras de formatação de [usability.md](usability.md).
- Estados: **normal** (valor em `color-text-primary`), **sem sinal** (valor substituído por "—" em `color-text-secondary`, para cumprir o contraste de 4,5:1; decisão do HITL-1 do loop-002, que substitui o antigo "texto desabilitado").
- Valores congelados (sessão encerrada) usam o mesmo estilo dos valores ao vivo; a diferença é dada pelo aviso do painel.
- Maximização: prevista pelo princípio "Foco por demanda", mas fora do escopo do loop-002; virou item do backlog.
- Implementado em: UC-002 (`parameter-indicator.tsx`).

### Painel de tempo real
- Usado em: área principal da janela do app (UC-002). Não há segunda janela.
- Aparece sozinho quando há sessão (ativa ou encerrada); sem sessão, a área principal mostra a mensagem de orientação.
- Estrutura: aviso do painel (quando houver) acima da grade de indicadores de parâmetro.
- Estados (precedência: sem sessão, depois encerrada, depois sem sinal, depois ativa):
  - **Sem sessão:** painel não é exibido; a área principal mostra "Inicie o simulador e ligue o motor para começar".
  - **Ativa:** grade com os valores ao vivo, atualizados a cada ciclo de 1 s.
  - **Encerrada:** últimos valores congelados e aviso "Sessão encerrada".
  - **Sem sinal:** conexão com o simulador perdida durante a sessão ou 2 s sem dados novos; todos os valores viram "—" e aparece o aviso "Sem sinal do simulador". Os valores voltam quando os dados retornam.
  - **Erro ao carregar parâmetros:** se a consulta dos parâmetros ativos falhar, a grade é substituída pelo aviso "Não foi possível carregar os parâmetros."
- Enquanto a consulta inicial não responde, a área principal mostra "Aguardando..." em `color-text-secondary`.
- Implementado em: UC-002 (`realtime-panel.tsx`, `realtime-panel.css`).

### Aviso do painel
- Usado em: painel de tempo real (UC-002), para "Sessão encerrada", "Sem sinal do simulador" e "Não foi possível carregar os parâmetros.".
- Posição: acima da grade, com 16px de espaço abaixo.
- Estilo: tipografia Corpo, `color-text-secondary`, sem fundo nem ícone. Erro, sem sinal e aviso informativo usam o mesmo estilo neutro (ver "Em aberto").
- Implementado em: UC-002.

### Card de sessão
- Usado em: lista de voos (UC-004).
- Exibe: data e hora de início, duração, indicador de estado (ativa ou encerrada).
- Estados: **normal**, **selecionado** (borda `color-accent`, fundo `color-surface`).
- Interação: clique único seleciona e abre o debriefing.

### Gráfico de linha temporal
- Usado em: debriefing (UC-005).
- Exibe: um parâmetro ao longo do tempo da sessão; eixo X = tempo, eixo Y = valor.
- Pode ser maximizado para ocupar a área principal da tela.
- Cada série usa uma cor da paleta `color-chart-*`; a legenda sempre acompanha o gráfico.
- O eixo Y tem rótulo com a unidade do parâmetro.

### Notificação de sistema
- Usada em: confirmação de início/encerramento de sessão (UC-001, UC-003).
- Posição: canto superior direito, sobreposta ao conteúdo, sem bloquear a leitura.
- Desaparece automaticamente após 4 segundos.
- Estados: **informativo** (`color-accent`), **sucesso** (`color-success`), **erro** (`color-error`), **warning** (fundo `color-warning`, texto `color-text-primary` (#161616) para garantir contraste WCAG AA — razão ~12:1).
- Implementado em: UC-001.

### Indicador de estado da sessão
- Sempre visível na barra superior da aplicação.
- Exibe: ponto colorido + rótulo de texto ("Sem conexão", "Sessão ativa", "Encerrada", "Aguardando motor").
- Estados, em ordem de precedência (o primeiro que se aplica vence):
  - **Sem conexão:** simulador não acessível (`conexao === 'desconectado'`) → `color-error` + "Sem conexão". Vence os demais, inclusive "Sessão ativa" (queda durante o voo) e "Encerrada".
  - **Ativo:** conectado e `sessaoAtiva.status === 'ativa'` → `color-success` + "Sessão ativa".
  - **Encerrada:** conectado e sessão com status diferente de `'ativa'` → `color-text-secondary` + "Encerrada".
  - **Aguardando motor:** conectado e sem sessão → `color-text-secondary` + "Aguardando motor".
- "Sem conexão" se refere só à conexão com o simulador; não é mais usado para "sem sessão" (loop-002, HITL-1).
- Os 2 s sem dados com a conexão aberta não alteram a barra (continua "Sessão ativa"); o estado aparece no aviso do painel.
- Implementado em: UC-001; estados revistos no UC-002.

## Layout

### Estrutura geral
- Barra superior fixa: nome da aplicação à esquerda, indicador de estado da sessão à direita.
- Área de conteúdo abaixo da barra, sem menu lateral fixo.

### Tela: painel de tempo real (UC-002)
- Ocupa a área principal da janela do app.
- Grade de 3 colunas e 2 linhas (3x2), com 16px de espaço entre cards, para os 6 parâmetros do conjunto inicial:
  - Linha 1: Altitude MSL, Velocidade IAS, Velocidade vertical.
  - Linha 2: Rumo magnético, Arfagem, Rolagem.
- Cada indicador ocupa um card.
- Maximização de card (card ocupando a área de conteúdo, com botão "Reduzir" para voltar à grade): fora do escopo do loop-002; item do backlog.

### Tela: lista de voos (UC-004)
- Lista vertical de cards de sessão em ordem cronológica inversa.
- Estado vazio: mensagem centralizada com orientação de próximo passo.

### Tela: debriefing (UC-005)
- Área principal: gráfico de linha temporal do parâmetro selecionado.
- Painel lateral (ou abas): seletor de parâmetro para trocar o gráfico exibido.
- Qualquer gráfico pode ser maximizado para ocupar toda a área de conteúdo.

### Comportamento em janelas menores
- A grade do painel de tempo real colapsa para uma coluna quando a largura for inferior a 600px, mantendo a ordem dos parâmetros.
- A lista de voos e o debriefing mantêm layout de coluna única em qualquer largura.
- As colunas da grade foram conferidas só por teste e inspeção; a conferência visual no Windows com o MSFS faz parte do roteiro manual do loop-002.

## Em aberto e débitos de UX

Pontos levantados na revisão de usabilidade do loop-002 que ficaram como débito e dependem de decisão humana:

- **Cor dos avisos do painel:** erro ("Não foi possível carregar os parâmetros."), sem sinal e aviso informativo usam o mesmo estilo neutro; não está decidido se erro e sem sinal devem usar `color-error` ou `color-warning`.
- **Valores congelados:** na sessão encerrada, os valores têm o mesmo estilo dos valores ao vivo; não está decidido se devem ter tratamento visual próprio.
- **Notificação sobre o card:** a notificação do canto superior direito cobre o card desse canto por 4 s.
- **Contraste da notificação `success`:** texto branco sobre `#24A148` dá cerca de 3,3:1, abaixo dos 4,5:1 de usability.md (vem do loop-001).
