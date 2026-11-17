# Loop 002

Loop: 002
Data de início: 2026-11-16
Item do backlog: 2 — Visualizar parâmetros em tempo real
Caso de uso: UC-002
Fase atual: Documentar

---
HITL-1 aprovado em 2026-11-16
HITL-2 aprovado em 2026-11-16
HITL-3 retorno: corrigir 3 itens menores de usabilidade e qualidade (aviso de sem sinal, erro nas consultas iniciais, anúncio duplo) — 2026-11-16
HITL-2 (2ª rodada) aprovado em 2026-11-16, com revisão curta (funcionalidade e usabilidade)
HITL-3 aprovado em 2026-11-16


## 1.1 Especificação de negócio

### Critérios de aceite atuais (use_cases.md) e problemas

- **CA-002-1:** "Dado que uma sessão está ativa, quando o piloto abre o painel do Blackbox Simulator, então os parâmetros do conjunto inicial são exibidos em uma janela separada com valores atualizados."
  - Contradiz o fluxo principal: o fluxo diz que o sistema exibe os parâmetros sozinho, e o critério supõe que o piloto abre o painel.
  - "Janela separada" não está definido: pode ser a própria janela do app (área principal, hoje vazia) ou uma segunda janela do Electron. O layout de design.md favorece a própria janela.
  - "Valores atualizados" não tem cadência nem atraso máximo.
- **CA-002-2:** "Dado que o painel está aberto, quando um novo valor de parâmetro chega do simulador, então o painel é atualizado sem que o desempenho do simulador seja afetado perceptivelmente."
  - "Perceptivelmente" não é mensurável (product.md já registra o limiar de atraso como em aberto).
  - Não diz se o painel mostra o valor lido do SimConnect a cada ciclo ou o valor já gravado no SQLite.

### Critérios faltantes (dependem de decisão humana)

- Estado sem sessão ativa (estado vazio com orientação, como em usability.md, ou painel com "—").
- Estado de sessão encerrada (congelar últimos valores, voltar ao estado vazio ou "—").
- Estado "sem sinal" de um parâmetro (previsto em design.md): quando se aplica.
- Maximizar e reduzir card (design.md, usability.md): dentro ou fora do escopo deste loop.
- Formatação dos valores: casas decimais, faixa e sinal.
- Acesso por teclado e valor sempre visível como texto (usability.md).

### Perguntas para decisão humana

1. "Janela separada" é a própria janela do app ou uma segunda janela?
2. O painel aparece sozinho quando a sessão fica ativa ou o piloto precisa abri-lo?
3. O conjunto inicial fica confirmado como os 6 parâmetros de domain_model.md (Altitude MSL ft, IAS kt, Velocidade vertical fpm, Rumo magnético °, Arfagem °, Rolagem °)? Quais rótulos finais ("proa" em usability.md ou "rumo magnético" em domain_model.md)?
4. Cadência de atualização do painel e atraso máximo aceitável.
5. O que o painel mostra sem sessão, com a sessão encerrada e quando a conexão cai.
6. Número de colunas da grade (sugestão: 3x2 para 6 parâmetros; abaixo de 600 px, uma coluna).
7. A maximização de cards entra neste loop?

### Decisões do humano (2026-11-16)

1. O painel fica na própria janela do app, na área principal, e aparece sozinho quando a sessão fica ativa. Não há segunda janela.
2. Estados: sem sessão, mensagem de orientação ("Inicie o simulador e ligue o motor para começar"); sessão encerrada, últimos valores congelados com aviso "Sessão encerrada"; conexão perdida durante a sessão, valores trocados por "—" (sem sinal).
3. Cadência: 1 s, a mesma da coleta, com o valor vindo da leitura do SimConnect. Atraso máximo aceitável entre o simulador e o painel: 2 s.
4. A maximização de cards fica fora deste loop e vira item do backlog.

Seguem o contexto atual até o HITL-1, que pode mudá-los:
- Conjunto inicial: os 6 parâmetros de domain_model.md, com os rótulos de lá (Altitude MSL, Velocidade IAS, Velocidade vertical, Rumo magnético, Arfagem, Rolagem).
- Grade de 3 colunas (3x2); abaixo de 600 px, uma coluna, como em design.md.

### Regras de negócio aplicáveis

- RN-002 (conjunto inicial): o painel mostra só parâmetros com `ativo = true`.
- RN-006 (não interferência): o painel só lê e exibe; sustenta o CA-002-2.
- Indiretas: RN-003 (início automático; se o painel aparecer sozinho), RN-004 (encerramento; quando o painel para de receber valores), RN-001 (coleta local; estados sem sinal e sem conexão).

### Termos relevantes do glossário

- Visualização em tempo real, Parâmetro de voo, Conjunto inicial de parâmetros, Sessão, Piloto.
- Faltam: "Painel de tempo real" (proposta: tela que exibe, durante uma sessão ativa, o valor atual de cada parâmetro do conjunto inicial) e, se for o caso, "Sem sinal".
- Ambiguidade: a barra de status mostra "Sem conexão" quando não há sessão, misturando "sem sessão" com "sem conexão com o simulador".

### Impactos propostos no contexto de produto

1. use_cases.md (UC-002): alinhar fluxo e CA-002-1; substituir "janela separada" pela forma decidida; pôr número no CA-002-2; incluir fluxos e critérios de sem sessão, sessão encerrada, perda de sinal e, se no escopo, maximizar; avaliar RN-001, RN-003 e RN-004 em "Regras aplicadas".
2. glossary.md: criar "Painel de tempo real" e, se for o caso, "Sem sinal".
3. product.md: resolver os itens em aberto "conjunto inicial de parâmetros" e "limiar de atraso".
4. business_rules.md: se a cadência ou o limiar virar regra reutilizável, criar RN-007.
5. Para 4.2 e 4.4: design.md (colunas da grade, estados do painel) e usability.md (rótulos, mensagem do estado vazio).

## 1.2 Refinamento técnico

### Entidades envolvidas

- **ParâmetroDeVoo**: catálogo exibido pelo painel, via `buscarParametrosAtivos()` (`ativo = 1`, RN-002). Usa `id`, `nome` e `unidade`.
- **LeituraDeParâmetro**: o painel recebe o valor lido do SimConnect a cada ciclo, em memória, antes do SQLite.
- **Sessão**: define o estado do painel (sem sessão, ativa, encerrada).
- **Estado de conexão com o SimConnect** (novo, de transporte): `'conectado' | 'desconectado'`, base do estado "sem sinal".

### Tarefas de implementação

Shared
1. `src/shared/types.ts`: `EstadoConexao` e `PacoteDeLeituras { sessaoId, timestamp, leituras: { parametroId, valor }[] }`.
2. `src/shared/ipc-channels.ts`: `parameter:list-active` (invoke), `parameter:readings` (push, um pacote por ciclo de 1 s), `connection:state-changed` (push) e `connection:get-state` (invoke, para não perder o evento inicial).

Main
3. `simconnect-client.ts`: `onConnectionChange` e `getEstadoConexao()`, emitindo só nas transições; `onParameterBatch`, uma vez por `simObjectData`. `onParameterReading` fica como está.
4. `collection-service.ts`: `onLeituras` só com sessão ativa, no mesmo ciclo da leitura, sem timer; `onConexaoAlterada` e `getEstadoConexao()`.
5. `src/main/ipc/parameter-handler.ts` (novo): handler de `parameter:list-active` e `emitParameterReadings`.
6. `src/main/ipc/connection-handler.ts` (novo): handler de `connection:get-state` e `emitConnectionState`.
7. Guarda `!win.isDestroyed()` em todos os `emit*` e `mainWindow = null` no `closed`.
8. `src/main/index.ts`: ligar eventos aos emissores e registrar handlers antes de `createWindow()`.

Preload e tipos do renderer
9. `preload.ts`: `listActiveParametros`, `getConnectionState`, `onParameterReadings` e `onConnectionStateChanged` (padrão ADR-005).
10. `electron-api.d.ts`: sincronizar `ElectronApi`.
11. `renderer/ipc/parameter-ipc.ts` e `connection-ipc.ts` (novos): wrappers tipados.

Renderer: hooks e lógica
12. `use-active-session.ts`: ouvir `onSessionEnded` e guardar a sessão encerrada.
13. `use-connection-state.ts` (novo).
14. `use-active-parameters.ts` (novo), na ordem de exibição da tarefa 17.
15. `use-live-readings.ts` (novo): um `setState` por pacote; desconectado com sessão ativa zera para "—"; nova sessão zera; sessão encerrada congela e ignora pacotes de outra sessão.
16. `derivePanelState({ sessao, conexao })`: sem sessão, depois encerrada, depois sem sinal, depois ativa.

Renderer: formatação (proposta)
17. `format-parameter-value.ts`. Grade 3x2: linha 1 com Altitude MSL, IAS e Velocidade vertical; linha 2 com Rumo magnético, Arfagem e Rolagem.

| Parâmetro | Casas | Regra | Exemplo |
|---|---|---|---|
| Altitude MSL (ft) | 0 | inteiro, só "−" | `4.500` |
| IAS (kt) | 0 | inteiro, negativo vira 0 | `112` |
| Velocidade vertical (fpm) | 0 | múltiplo de 10, "+" ou "−" explícito | `+650` |
| Rumo magnético (°) | 0 | 000 a 359, 360 vira 000 | `005` |
| Arfagem (°) | 1 | "+" nariz para cima | `+5,2` |
| Rolagem (°) | 1 | valor absoluto + E/D | `12,3 D` |

Gerais: `pt-BR` (vírgula decimal, ponto de milhar); `null`, `NaN` e `Infinity` viram "—"; "−0" vira "0"; unidade como rótulo à parte.

Renderer: componentes
18. `parameter-indicator.tsx`: rótulo, valor (IBM Plex Mono 24 px) e unidade; "—" sem sinal; `role="group"` com `aria-label` em texto; sem `aria-live`; `React.memo`.
19. `realtime-panel.tsx`: grade de indicadores; aviso "Sessão encerrada" com `role="status"`.
20. CSS em arquivo (`realtime-panel.css`): grade de 3 colunas e 1 coluna abaixo de 600 px.
21. `App.tsx`: sem sessão, "Inicie o simulador e ligue o motor para começar"; nos demais estados, `RealtimePanel` sozinho.
22. `StatusBar.tsx`: recebe a conexão e separa "sem sessão" de "sem conexão".

### Testes necessários

- CA-002-1: `App.test.tsx` (orientação sem sessão; grade aparece sozinha com os 6 rótulos na ordem; sessão já ativa na montagem), `parameter-handler.test.ts` (só `ativo = true`), `realtime-panel.test.tsx`.
- CA-002-2: `simconnect-client.test.ts` (um lote por `simObjectData`, nenhum envio ao simulador, RN-006), `collection-service.test.ts` (mesmo tick, só com sessão, com `sessaoId`), `parameter-handler.test.ts` (send no canal certo, nada com janela nula ou destruída), `use-live-readings.test.ts`, `App.test.tsx`. Atraso real: roteiro manual no Windows com MSFS.
- Estados: `panel-state.test.ts` (precedência), `use-active-session.test.ts` (encerrada), `App.test.tsx` (congelado, aviso, pacotes de outra sessão ignorados, nova sessão zera; sem sinal com "—" e `aria-label`), `connection-handler.test.ts`.
- Formatação: `format-parameter-value.test.ts`, cobrindo cada regra.
- StatusBar, acessibilidade, layout (classe `realtime-grid`; colunas conferidas à mão) e preload (`npm run build:preload`).

### Riscos e dependências

- UC-003 não existe: o estado "Sessão encerrada" fica implementado e testado com mocks, mas não ocorre no uso real até lá.
- Sinal de arfagem e rolagem no SimConnect precisa ser validado no MSFS (afeta exibição, gravação e debriefing).
- "Sem sinal" com a conexão aberta mas sem dados (menu, sem aeronave): sem limite de tempo, o painel fica com valores velhos.
- Rótulo da StatusBar para "conectado, sem sessão" não definido.
- Contraste do "—" (`color-text-disabled`, cerca de 2,3:1) abaixo dos 4,5:1 de usability.md.
- IBM Plex vem do Google Fonts, contra a "fonte local obrigatória" de design.md.
- Playwright sem configuração nem testes; layout e atraso validados à mão.
- Desempenho: 1 mensagem IPC por segundo com 6 números; riscos reais tratados nas tarefas 7 e 15 e no `React.memo`.
- Tensão com a diretriz "o renderer não mantém estado de sessão local": valores congelados tratados como estado de exibição temporário.
- Convenção: code_conventions.md pede arquivos em kebab-case; os componentes atuais estão em PascalCase.

### Impactos propostos no contexto de engenharia

- architecture.md: ADR-007 (leituras em tempo real por push, da memória, só com sessão ativa; estado de conexão por push e invoke); ajuste da diretriz de estado no renderer; lista dos novos canais.
- code_conventions.md: CSS em arquivo para media queries; utilitários de formatação ao lado do componente; kebab-case ou PascalCase; guarda `!win.isDestroyed()`; situação do Playwright.
- domain_model.md: nenhum na estrutura.
- design.md e usability.md (para 4.4): grade 3x2 e ordem; estados do painel e cor do "—"; estados da barra de status; maximização fora do escopo; rótulos finais; texto do estado vazio; regras de formatação; política de leitor de tela.

### Decisões do HITL-1 (2026-11-16)

1. Sinais de arfagem e rolagem: corrigidos só na exibição ("+" nariz para cima; rolagem em valor absoluto com E/D). O banco guarda o valor bruto do SimConnect. O sentido real será confirmado no teste manual no Windows antes de encerrar o loop.
2. Sem dados com a conexão aberta: após 2 s sem pacote novo, os valores viram "—" (sem sinal) e voltam quando os dados retornam.
3. Barra de status: "Aguardando motor" quando conectado sem sessão; "Sem conexão" só quando o simulador não está acessível, e vence "Sessão ativa" se a conexão cair durante o voo.
4. Padrões aprovados junto com o plano:
   - Fonte IBM Plex local (pacote npm), sem Google Fonts, cumprindo design.md.
   - "—" em `color-text-secondary` (#525252), para atingir o contraste mínimo de 4,5:1.
   - Formatação dos valores conforme a tabela da tarefa 17.
   - Arquivos novos em kebab-case, como pede code_conventions.md; os existentes não são renomeados neste loop.
   - Playwright fica para depois; layout e atraso validados à mão.
   - O estado "Sessão encerrada" fica implementado e testado com mocks; só ocorre no uso real com o UC-003.

## O que foi feito

### 2.1 Implementar (UC-002)

Tarefas 1 a 22 implementadas com os ajustes do HITL-1. `npm run build` e `npm run lint` sem erros; `npm run build:preload` ok. Sem commit; nada em context/ alterado pelo developer.

Arquivos novos:
- Main: `src/main/ipc/parameter-handler.ts`, `src/main/ipc/connection-handler.ts`.
- Renderer: `ipc/parameter-ipc.ts`, `ipc/connection-ipc.ts`; `hooks/use-connection-state.ts`, `hooks/use-active-parameters.ts` (`PARAMETER_DISPLAY_ORDER`), `hooks/use-live-readings.ts` (`SEM_DADOS_LIMITE_MS = 2000`); `components/panel-state.ts`, `components/format-parameter-value.ts` (constantes `PITCH_POSITIVO_NARIZ_PARA_BAIXO` e `BANK_POSITIVO_PARA_ESQUERDA`, a confirmar no Windows), `components/parameter-indicator.tsx`, `components/realtime-panel.tsx`, `components/realtime-panel.css`.

Arquivos alterados: `shared/types.ts`, `shared/ipc-channels.ts`, `simconnect-client.ts`, `collection-service.ts`, `session-handler.ts` (guarda `isDestroyed`), `main/index.ts`, `preload.ts`, `electron-api.d.ts`, `use-active-session.ts`, `App.tsx`, `StatusBar.tsx` (prop `conexao`), `renderer/index.tsx` e `styles/global.css` (fontes `@fontsource/ibm-plex-sans` e `@fontsource/ibm-plex-mono` locais, sem Google Fonts), `package.json`.

Desvios do plano:
- `derivePanelState` recebe também `semDados` (decisão 2 do HITL-1).
- Formatador, estado do painel e CSS ficam em `src/renderer/components/`, ao lado de quem usa.
- Lacunas resolvidas pelo developer, a confirmar: com sessão encerrada e simulador desconectado, a StatusBar mostra "Sem conexão"; "Aguardando motor" usa `color-text-secondary`.

Débito técnico:
- Possível condição de corrida em `use-active-session.ts` (anterior ao loop): a resposta de `getActiveSessao()` pode sobrescrever um evento mais novo.
- Fontsource importa todos os subsets; importar só latin reduziria o instalador.
- Sem `App.test.tsx` nem Playwright até a etapa 2.2.
- `session:ended` sem emissor no main até o UC-003.

Testes antigos quebrados pelas novas interfaces (17 de 58): `session-handler.test.ts` (2), `collection-service.test.ts` (8), `use-active-session.test.ts` (6, com import de tipos já errado antes do loop), `StatusBar.test.tsx` (1).

### 2.1 Implementar, 2ª rodada (ajustes do HITL-3)

- Aviso "Sem sinal do simulador" com `role="status"` acima da grade no estado sem sinal (`realtime-panel.tsx`).
- Consultas iniciais com tratamento de erro: `use-active-session.ts` (log, sai do carregamento, descarta a resposta se um evento chegar antes; eventos também encerram o carregamento), `use-connection-state.ts` (log, fica desconectado), `use-active-parameters.ts` (log e retorno `{ parametros, erro }`; o painel mostra "Não foi possível carregar os parâmetros.").
- Aviso "Sessão encerrada" sem `role="status"`; o anúncio fica com a Notification.
- Build, lint ok. 4 testes quebrados pelas mudanças pedidas (dois procuram o aviso por `role="status"`, dois esperam o retorno antigo de `useActiveParameters`).

## Testes

### 2.2 Testar (UC-002)

Resultado: `npm test` com 21 arquivos e 178 testes passando; `tsc` do renderer e do main sem erros; `npm run lint` sem erros nem avisos. Só arquivos de teste foram editados.

Testes antigos ajustados à nova interface: `session-handler.test.ts` (com janela destruída), `collection-service.test.ts` (mock completo, testes de `onLeituras` e conexão), `use-active-session.test.ts` (import corrigido, sessão encerrada), `StatusBar.test.tsx` (prop `conexao`, 4 rótulos).

Testes novos: `simconnect-client.test.ts` (conexão, lote por ciclo, nenhum envio ao simulador, RN-006), `parameter-handler.test.ts`, `connection-handler.test.ts`, `format-parameter-value.test.ts` (tabela da tarefa 17, sinais pelo sentido físico), `panel-state.test.ts`, `use-live-readings.test.ts` (limite de 2 s com fake timers), `use-connection-state.test.ts`, `use-active-parameters.test.ts`, `parameter-indicator.test.tsx`, `realtime-panel.test.tsx`, `App.test.tsx` (21 testes cobrindo CA-002-1, CA-002-2, sessão encerrada, sem sinal e StatusBar).

Cobertura: 100% em `main/db/` e `main/simconnect/` (meta de code_conventions.md); geral 88,75% de linhas, 97,4% de branches, 95,77% de funções. Sem cobertura só os pontos de entrada (`main/index.ts`, `preload.ts`, `renderer/index.tsx`).

Conferência no app (macOS, sem simulador): a janela mostra "Sem conexão" e "Inicie o simulador e ligue o motor para começar"; IBM Plex carregada localmente, sem Google Fonts; nenhum erro no console.

Observações para a revisão:
1. Ao encerrar a sessão, há dois `role="status"` (a notificação "Sessão encerrada. Dados salvos." e o aviso do painel); o leitor de tela pode anunciar duas vezes.
2. Velocidade vertical: `Math.round` é assimétrico no zero (+5 fpm vira "+10", −5 fpm vira "0").
3. O `tsconfig.json` raiz não define `jsx`, então `tsc -p tsconfig.json` acusa erros nos `.tsx` (anterior ao loop; o lint passa).

Só no roteiro manual no Windows com MSFS: atraso real, sentido dos sinais de arfagem e rolagem, colunas da grade.

### Decisões do HITL-2 (2026-11-16)

- Confirmadas as lacunas resolvidas pelo developer: "Sem conexão" vence "Encerrada" na barra de status; "Aguardando motor" em `color-text-secondary`.
- Arredondamento assimétrico da velocidade vertical perto de zero: registrado como débito técnico.

### 2.2 Testar, 2ª rodada (ajustes do HITL-3)

- 4 testes ajustados ao comportamento novo (aviso "Sessão encerrada" achado pelo texto e sem `role="status"`; retorno `{ parametros, erro }`).
- Testes novos: aviso "Sem sinal do simulador" (queda de conexão e 2 s sem pacote, some com pacote novo, StatusBar inalterada, ausente com sessão encerrada); anúncio único ao encerrar; rejeição das três consultas iniciais com log; descarte da resposta tardia de `getActiveSessao`; mensagem "Não foi possível carregar os parâmetros.".
- Resultado: 21 arquivos e 205 testes passando; `tsc` do renderer e lint sem erros. Os 5 arquivos alterados nesta rodada com 100% de linhas e branches; total 89,18% de linhas.

## Revisão e decisões

### 3. Revisão (2026-11-16)

Os 4 revisores aprovaram sem bloqueantes no código. Pendência anterior ao encerramento (decidida no HITL-1): roteiro manual no Windows com MSFS para confirmar os sinais de arfagem e rolagem, medir o atraso real (limite de 2 s) e conferir as colunas da grade.

#### 3.1 Funcionalidade
Todos os critérios atendidos no código; atraso real e sinais pendentes do teste manual.
Não bloqueantes:
1. `use-active-parameters.ts` não trata a rejeição de `listActiveParametros()`: painel sem cards e sem mensagem.
2. Dois `role="status"` ao encerrar a sessão.
3. "Sessão encerrada" só ocorre no uso real com o UC-003 (aceito no HITL-1).
4. Na montagem, a conexão começa como desconectado até a consulta responder: "—" e "Sem conexão" por um instante.
5. Condição de corrida em `use-active-session.ts` (anterior ao loop).
6. Sessão encerrada com a conexão caída congela com "—" em vez dos últimos valores; caso não coberto pelas decisões.

#### 3.2 Qualidade
Lint, tipos (renderer, main, preload) e 178 testes passando; nenhum `any`; meta de cobertura cumprida (100% em `main/db` e `main/simconnect`).
Não bloqueantes:
1. Promises sem `.catch` em `use-connection-state.ts`, `use-active-parameters.ts` e `use-active-session.ts` (este pode prender a tela em "Aguardando...").
2. Condição de corrida em `use-active-session.ts` (o padrão `recebeuEvento` de `use-connection-state.ts` resolveria).
3. Imports relativos em vez dos aliases `@main/`, `@renderer/` e `@shared/` (anterior ao loop).
4. Convenção do Prettier contraditória e formatador não aplicado (sem `.prettierrc` nem script).
5. Estilo misto (CSS em arquivo e inline) sem regra explícita.
6. Ramos `false` das constantes de sinal sem teste.
7. `tsconfig.json` raiz sem `jsx` (anterior ao loop).
8. Débitos já registrados: arredondamento da velocidade vertical, subsets do Fontsource, `session:ended` sem emissor, dois `role="status"`.

#### 3.3 Usabilidade
Diretrizes atendidas, com desvios menores.
Não bloqueantes:
1. Anúncio duplo de "Sessão encerrada" para leitor de tela (sugestão: tirar o `role="status"` do aviso do painel).
2. Sem dados com a conexão aberta: barra em "Sessão ativa" e valores "—", sem explicação para o piloto.
3. Valores congelados com o mesmo estilo dos valores ao vivo.
4. Notificação cobre o card do canto superior direito por 4 s.
5. Contraste da notificação `success` (branco sobre #24A148, cerca de 3,3:1; vem do loop-001).
6. StatusBar: `aria-label` em `<div>` sem role e sem região viva; perda de conexão não é anunciada.
7. Possível leitura em dobro nos cards (`role="group"` com `aria-label` e texto interno).
8. Estado vazio sem o motivo explícito.

#### 3.4 Arquitetura
Separação main/renderer, IPC tipado, ADR-005, preload mínimo, RN-006 e tipos compartilhados conformes.
Itens a documentar (previstos): ADR-007, ajuste da diretriz de estado no renderer, novos canais, utilitários em `components/`, convenção mista de nomes.
Não bloqueantes:
1. Slugs dos parâmetros escritos à mão em três lugares (main e renderer), fora de `shared/`.
2. Imports relativos em vez dos aliases.
3. `ParameterBatchPayload` poderia ser `Omit<PacoteDeLeituras, 'sessaoId'>`.
4. Filtro `ativo` repetido no renderer (a regra mora no main).
5. Estilos do indicador dentro de `realtime-panel.css`.
6. Parâmetro sem uso em `registerSessionHandlers` (anterior ao loop).
7. Promises sem tratamento de rejeição.

### 3. Revisão, 2ª rodada curta (2026-11-16)

Funcionalidade e usabilidade revisaram só os 3 ajustes: nenhum bloqueante e nenhuma regressão nos critérios do UC-002.

Não bloqueantes (funcionalidade):
1. `getActiveSessao` com erro e sessão já ativa: a tela mostra a orientação de "sem sessão" até o próximo evento, enquanto a coleta continua.
2. `getConnectionState` com erro e simulador já conectado: fica "desconectado" até a próxima transição (o evento só sai nas transições).
3. "Não foi possível carregar os parâmetros." sem orientação e sem nova tentativa automática.

Não bloqueantes (usabilidade):
1. Avisos com `role="status"` montados já com o texto podem não ser anunciados por alguns leitores de tela; o mais seguro é a região viva sempre montada.
2. "Sem sinal do simulador" não diz o que o piloto pode fazer (texto decidido no HITL-3).
3. "Não foi possível carregar os parâmetros." não orienta e não tenta de novo.
4. Erro, sem sinal e aviso informativo usam o mesmo estilo neutro, sem `color-error` nem `color-warning`.

### Decisões do HITL-3, 2ª rodada (2026-11-16)

- Revisão aprovada. Os 7 itens menores da 2ª rodada viram débito técnico, junto com os da 1ª rodada que não foram corrigidos.

### Decisões do HITL-3, 1ª rodada (2026-11-16)

- Voltar para Implementar só com 3 itens:
  1. Estado sem sinal (conexão perdida ou 2 s sem dados) explicado no painel com o aviso "Sem sinal do simulador".
  2. Tratamento de erro nas consultas iniciais (`getActiveSessao`, `getConnectionState`, `listActiveParametros`), para a tela não ficar presa em "Aguardando..." nem com o painel vazio sem explicação.
  3. Um único anúncio de "Sessão encerrada" para leitor de tela.
- Os demais itens menores da revisão viram débito técnico.
- Teste manual no Windows: commitar o loop numa branch `loop-002` (sem tocar na `main`), subir e gerar o instalador pelo workflow manual, como artefato.

## Contexto atualizado

## Lições
