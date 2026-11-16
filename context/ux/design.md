# Design

> Propósito: Diretrizes de design da interface gráfica.
> Atualizar quando: mudar um padrão visual ou entrar um componente novo.
> Relacionados: [usability.md](usability.md)
> Última atualização: 2026-11-16

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

## Componentes

### Indicador de parâmetro
- Usado em: painel de tempo real (UC-002).
- Exibe: rótulo do parâmetro (rótulo), valor atual (valor de parâmetro), unidade (rótulo).
- Estados: **normal** (texto primário), **sem sinal** (valor substituído por "—", texto desabilitado).
- Pode ser maximizado para ocupar o painel inteiro (princípio "Foco por demanda").

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
- Estados: **informativo** (`color-accent`), **sucesso** (`color-success`), **erro** (`color-error`).

### Indicador de estado da sessão
- Sempre visível na barra superior da aplicação.
- Exibe: ponto colorido + rótulo de texto ("Sessão ativa", "Encerrada", "Sem conexão").
- Cores: ativo = `color-success`, encerrada = `color-text-secondary`, sem conexão = `color-error`.

## Layout

### Estrutura geral
- Barra superior fixa: nome da aplicação à esquerda, indicador de estado da sessão à direita.
- Área de conteúdo abaixo da barra, sem menu lateral fixo.

### Tela: painel de tempo real (UC-002)
- Grade de indicadores de parâmetro em N colunas (a definir conforme o conjunto inicial de parâmetros).
- Cada indicador ocupa um card; qualquer card pode ser maximizado para tela cheia.
- Maximização: o card ocupa toda a área de conteúdo; botão "Reduzir" retorna à grade.

### Tela: lista de voos (UC-004)
- Lista vertical de cards de sessão em ordem cronológica inversa.
- Estado vazio: mensagem centralizada com orientação de próximo passo.

### Tela: debriefing (UC-005)
- Área principal: gráfico de linha temporal do parâmetro selecionado.
- Painel lateral (ou abas): seletor de parâmetro para trocar o gráfico exibido.
- Qualquer gráfico pode ser maximizado para ocupar toda a área de conteúdo.

### Comportamento em janelas menores
- A grade do painel de tempo real colapsa para uma coluna quando a largura for inferior a 600px.
- A lista de voos e o debriefing mantêm layout de coluna única em qualquer largura.

Em aberto: número de colunas da grade do painel de tempo real (depende da definição do conjunto inicial de parâmetros).
