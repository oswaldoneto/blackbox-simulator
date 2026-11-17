# Loop 005

Loop: 005
Data de início: 2026-11-17
Item do backlog: 4 — Selecionar voo para debriefing
Caso de uso: UC-004
Fase atual: concluído

---
HITL-1 aprovado em 2026-11-17
HITL-2 aprovado em 2026-11-17
HITL-3 retorno (rodada curta única): pacote de acessibilidade e layout — 2026-11-17
HITL-2 (rodada curta) aprovado em 2026-11-17, com revisão curta (usabilidade)
HITL-3 aprovado em 2026-11-17
HITL-4 aprovado em 2026-11-17 (encerramento condicionado ao teste manual no Windows)
Teste manual no Windows aprovado em 2026-11-17 (v0.5.0): barra com navegação, lista de voos com data, hora e duração locais, tela provisória, volta automática ao painel, sessão ativa fora da lista, atualização ao encerrar, teclado, largura mínima da janela e leitor de tela
Loop encerrado em 2026-11-17

## 1.1 Especificação de negócio

### Critérios de aceite atuais e problemas

- CA-004-1: "todas as sessões" contradiz o fluxo (só encerradas); a ativa não tem duração; design.md prevê indicador ativa/encerrada no card; "data, hora" e a ordenação não dizem de qual campo.
- CA-004-2: depende do UC-005 (não entregue); "seleção é confirmada" diverge do clique único de design.md.
- CA-004-3: a pré-condição "ao menos uma sessão encerrada" torna o fluxo A impossível; "sem sessões registradas" difere de "sem encerradas"; texto do estado vazio não definido (usability.md tem só exemplo).

### Perguntas para decisão humana

1. Seleção neste loop sem o UC-005: (a) tela de debriefing provisória (cabeçalho da sessão, aviso e voltar); (b) UC-005 mínimo; (c) lista sem seleção. Carregar e cortar as leituras na hora de fim fica no UC-005?
2. Navegação: onde fica o acesso à lista e a volta ao painel; lista acessível durante sessão ativa; barra de estado visível na lista.
3. Sessão que começa com a lista (ou o debriefing) aberta: troca para o painel sozinha (UC-002) ou fica; lista atualiza ao encerrar uma sessão.
4. Quais sessões aparecem: ativa; curtas (filtro do UC-003 fluxo G); duração 0; antigas; a de falha de gravação ainda ativa no banco.
5. Formato: fuso local; data dd/mm/aaaa; hora 24 h com ou sem segundos; duração hh:mm:ss (24 h ou mais; zero); hora de fim.
6. Outras informações: aeronave (campo existe na Sessão); aviso para sessões antigas sem os 6 parâmetros novos.
7. Ordenação (início ou fim; desempate) e volume (rolagem, paginação; filtro e busca fora).
8. Erro ao ler a lista: mensagem e nova tentativa.

### Decisões do humano (2026-11-17)

1. Seleção: tela provisória do voo com data, hora e duração, o aviso "Debriefing disponível em breve" e um botão para voltar à lista. Carregar e cortar as leituras fica para o UC-005, que depois preenche essa tela.
2. Navegação: botões "Painel" e "Voos" na barra superior, sempre visíveis, inclusive durante uma sessão ativa. A barra de estado continua visível em todas as telas. A coleta continua normalmente com a lista aberta.
3. Sessão que começa com a lista ou a tela do voo aberta: o painel aparece sozinho, com "Coleta iniciada" (UC-002 inalterado).
4. Voos na lista: todas as sessões encerradas, inclusive curtas, de duração 0 e antigas. A sessão ativa não aparece. Nada é ocultado.

Padrões assumidos até o HITL-1, que pode mudá-los:
- Formato: fuso local da máquina; data dd/mm/aaaa; hora de início em 24 h sem segundos (HH:mm); duração h:mm:ss (horas sem limite; zero aparece "0:00:00"); a hora de fim não aparece na lista.
- Ordenação por hora de início, da mais recente para a mais antiga; desempate pela ordem de gravação.
- Rolagem simples, sem paginação; filtro e busca fora deste loop.
- Card do voo: data, hora de início e duração; aeronave só se o campo estiver gravado de fato (a confirmar no refinamento técnico); sem aviso para sessões antigas (fica para o UC-005).
- Lista atualiza sozinha quando uma sessão encerra com ela aberta.
- Estado vazio: "Nenhum voo registrado. Inicie o simulador e ligue o motor para começar." Vale também quando só existe a sessão ativa.
- Erro ao carregar: "Não foi possível carregar a lista de voos. Feche e abra o aplicativo para tentar de novo.", sem nova tentativa automática.
- Indicador de carregamento se a lista demorar mais de 500 ms.
- Teclado: Tab percorre os voos, Enter abre, Esc na tela do voo volta à lista.
- A sessão de falha de gravação (ativa no banco até a próxima abertura) não aparece na lista até ser encerrada.
- Pré-condição do UC-004 deixa de exigir sessão encerrada; critérios numerados; RN-004 e RN-006 em "Regras aplicadas"; termo "Lista de voos" no glossário.

### Regras de negócio aplicáveis

- RN-005 (retenção; ocultar é só filtro; volume crescente).
- RN-004 (define sessão encerrada, hora de fim e duração; incluir em "Regras aplicadas").
- RN-003 (se a lista reagir a sessão iniciada) e RN-006 (abrir a lista não afeta coleta nem simulador).
- RN-002 e RN-007 só se a tela de debriefing mostrar parâmetros.

### Termos relevantes do glossário

Voo / Sessão, Sessão encerrada, Duração (formato definido no UC-004), Debriefing, Piloto, Painel de tempo real. Termo novo: "Lista de voos". Possível: "Sessão curta".

### Impactos propostos no contexto de produto

- UC-004: pré-condição; fluxo com navegação; fluxos alternativos (só ativa, sessão começa ou encerra com a lista aberta, erro, filtros); CA-004-1 com sessões encerradas, campo, ordenação e formato; CA-004-2 conforme a decisão 1; CA-004-3 com texto; critérios numerados; RN-004 (e RN-003, RN-006); status "Em andamento".
- UC-003: observação do formato e fluxo G. UC-002: fluxo principal 1 se a lista não trocar para o painel. UC-005: carga e corte das leituras.
- glossary.md: "Lista de voos"; "Duração" com o formato; "Sessão curta" se houver filtro. RN-004 (e RN-003, RN-006) com o UC-004.
- Para UX: card de sessão de design.md; texto oficial do estado vazio em usability.md.

## 1.2 Refinamento técnico

### Entidades envolvidas

- Sessão: única entidade lida; a lista mostra `status = 'encerrada'`; o card usa `iniciadaEm` e a duração calculada no renderer.
- Campo `aeronave`: não é preenchido hoje (`collection-service.ts` cria com `''`; nenhum código lê a aeronave do SimConnect). `aerodromoOrigem` e `aerodromoDestino` também sempre `null`. A aeronave fica fora do card.
- Leituras e parâmetros não entram (ficam para o UC-005).

### Tarefas de implementação

1. Canal invoke `session:list-ended` em `shared/ipc-channels.ts` (retorna `Sessao[]`).
2. `session-repository.ts`: `listarSessoesEncerradas()` com `WHERE status = 'encerrada' ORDER BY iniciada_em DESC, rowid DESC`.
3. `session-handler.ts`: handler do canal; na falha, log e rejeição.
4. `preload.ts` e `electron-api.d.ts`: `listSessoesEncerradas()`.
5. `renderer/ipc/session-ipc.ts`: wrapper.
6. Navegação por estado no `App.tsx` (`painel`, `voos`, `voo` com a sessão), sem roteador; hooks de sessão, conexão, parâmetros, leituras e notificação continuam no topo do App; `StatusBar` e `Notification` visíveis em todas as telas; `session:started` volta ao painel.
7. `StatusBar.tsx`: `<nav>` com botões "Painel" e "Voos", `aria-current`, destaque em `color-accent`, à direita do nome do app.
8. `components/format-flight-time.ts`: data dd/mm/aaaa, hora HH:mm (h23), duração h:mm:ss sem limite de horas; `timeZone` opcional para testes determinísticos.
9. `hooks/use-sessoes-encerradas.ts`: busca na montagem, nova busca em `session:ended`, descarte de respostas antigas, erro sem nova tentativa, indicador após 500 ms.
10. `pages/flight-list/flight-list-page.tsx`: título "Voos", coluna única, rolagem, estados carregando, vazio, erro e lista.
11. `components/flight-card.tsx`: `<button>` com data · hora e duração (Plex Mono 14 px), `aria-label` completo, foco visível; sem indicador de estado nem "selecionado".
12. `pages/flight-detail/flight-detail-page.tsx`: tela provisória com título, data, hora, duração, "Debriefing disponível em breve" e "Voltar à lista"; Esc volta; foco devolvido ao card de origem.
13. Estilos inline com tokens; CSS em arquivo só para `:focus-visible`/`:hover`.
14. Versão 0.5.0 na entrega.

### Testes necessários

Repositório com SQL real (só encerradas, ordem, desempate, duração 0, banco vazio, sessões antigas); handler (lista e erro); formatador (fusos fixos, virada de dia, meia-noite, durações, horário de verão, valores inválidos); card, lista e tela provisória; App (clique abre o voo, voltar, estado vazio com sessão ativa, navegação mantém valores ao vivo, barra visível nas 3 telas, volta ao painel em `session:started`, `session:ended` não troca de tela); hook (nova busca em `session:ended`, sem nova busca em `end-failed`, resposta antiga descartada, erro, indicador de 500 ms com fake timers); teclado (Tab, Enter, Esc com foco devolvido). Fake de `window.electronApi` ganha `listSessoesEncerradas`.

Roteiro manual no Windows (9 passos): estado vazio; voo curto; voo no topo com hora local; lista aberta e motor ligado volta ao painel; sessão ativa não aparece e painel segue ao vivo; lista atualiza ao encerrar; teclado; sessões antigas com duração 0; fuso local.

### Riscos e dependências

- Volume sem paginação nem índice (pode virar item de backlog).
- Ordenação por texto depende do formato ISO UTC de `iniciada_em`.
- Encerramento silencioso na abertura não emite push: a lista aberta nos primeiros 15 s só mostra a sessão ao ser reaberta.
- Erro numa nova busca com a lista já carregada: substituir a lista pelo erro ou manter a anterior.
- Textos não definidos: "Carregando voos...", título "Voos", "Voo de dd/mm/aaaa", "Voltar à lista".
- Layout da barra superior muda a "Estrutura geral" de design.md.
- Card de sessão de design.md prevê indicador ativa/encerrada e "selecionado", que perdem o sentido.
- Push de sessão iniciada perdido antes de montar (abre no Painel, sem efeito).
- Relógio e fuso vêm do Windows.

### Impactos propostos no contexto

- architecture.md: canal `session:list-ended`; ADR-010 (navegação por estado no App); diretriz da tela atual como estado de exibição; em aberto paginação e índice.
- domain_model.md: `aeronave` e aeródromos gravados vazios; formato h:mm:ss da duração.
- code_conventions.md: pasta `pages/`; formatador de data e hora; teste de fuso com `timeZone` fixo; fake da ponte com cada função nova.
- design.md: barra superior com navegação; card de sessão revisto; tela da lista de voos; tela provisória; volta automática ao painel.
- usability.md: textos da lista; formato de data, hora e duração; teclado; erro sem nova tentativa.

### Decisões do HITL-1 (2026-11-17)

1. Aeronave fora do card; item novo no backlog para gravar a aeronave (e aeródromos) em voos futuros (registrar na fase Documentar).
2. Erro numa nova busca com a lista já carregada: mantém a lista anterior e só registra no log; a mensagem de erro aparece só se a primeira carga falhar.
3. Padrões aprovados com o plano: botões "Painel" e "Voos" logo à direita do nome do app; card sem indicador de ativa/encerrada nem "selecionado"; textos "Carregando voos...", título "Voos", "Voo de dd/mm/aaaa" e "Voltar à lista"; sessão encerrada silenciosamente na abertura só aparece ao reabrir a lista; versão 0.5.0; demais padrões da seção 1.1 confirmados.

## O que foi feito

### 2.1 Implementar (UC-004)

Tarefas 1 a 14 implementadas com os ajustes do HITL-1. Código de produção compila (`tsc` do main sem os testes); lint limpo; preload reempacotado; versão 0.5.0. Sem commit; nada em context/ alterado pelo developer.

Arquivos novos: `components/format-flight-time.ts` (data, hora, duração; `timeZone` opcional), `hooks/use-sessoes-encerradas.ts` (`CARREGANDO_LIMITE_MS = 500`), `pages/flight-list/flight-list-page.tsx`, `components/flight-card.tsx` e `flight-card.css`, `pages/flight-detail/flight-detail-page.tsx` e `flight-detail-page.css`, `components/status-bar.css`.

Arquivos alterados: `shared/ipc-channels.ts` (`session:list-ended`), `session-repository.ts` (`listarSessoesEncerradas`), `session-handler.ts` (handler com log e rejeição), `preload.ts`, `electron-api.d.ts`, `session-ipc.ts`, `App.tsx` (navegação por estado; volta ao painel em `session:started`; foco devolvido ao card), `StatusBar.tsx` (nav "Painel"/"Voos" com `aria-current`, accent e sublinhado), `package.json`.

Desvios:
- `useSessoesEncerradas` chamado pela página da lista (busca a cada abertura; a sessão encerrada em silêncio na abertura aparece ao reabrir a lista).
- Após erro na primeira carga, um `session:ended` posterior ainda busca e um sucesso troca o erro pela lista.
- Rótulo "Duração" no card.
- Foco ao abrir o voo vai para "Voltar à lista".
- Valor inválido, fim nulo ou duração negativa aparecem como "—".
- Rótulos "Navegação principal" (nav) e "Hora de início" (tela provisória).

Débito: sem paginação nem índice; busca a cada abertura; foco perdido se a sessão de origem sumir da lista; clicar no botão da tela atual não dá retorno visual.

Testes quebrados: 1 falha (`session-handler.test.ts`, agora 2 handlers) e erros de tipo em `App.test.tsx` (fake sem `listSessoesEncerradas`) e `StatusBar.test.tsx` (props novas).

### 2.1 Implementar, 2ª rodada (ajustes do HITL-3)

- Foco ao trocar de tela: painel com h1 visualmente oculto "Painel de tempo real" (`tabIndex={-1}`), focado ao ir pela barra ou na volta automática vinda de outra tela; carga inicial não move o foco; título "Voos" focado sem card de origem; se o card de origem sumiu, foco no título "Voos"; abrir um voo mantém o foco em "Voltar à lista".
- Tela do voo: `aria-describedby` do botão aponta para o título e o aviso.
- `formatarDuracaoPorExtenso` (singular/plural, partes zero omitidas, "0 segundos", "duração indisponível"); `aria-label` do card por extenso; texto visível h:mm:ss.
- `BrowserWindow` com `minWidth: 640` e `minHeight: 480`.
- Lint e `tsc` limpos; 16 testes quebrados pelo `aria-label` novo (`flight-card`, `flight-list-page`, `App`).
- Débito: cálculo de horas/minutos/segundos repetido nas duas funções de duração; estilo "visualmente oculto" inline em `App.tsx`.

## Testes

### 2.2 Testar (UC-004)

Resultado: 30 arquivos e 554 testes passando; `npm run build`, `tsc` do renderer e lint sem erros. Só arquivos de teste editados; nenhum bug de produção encontrado.

Testes antigos ajustados: `session-handler.test.ts` (2 handlers), `App.test.tsx` (fake com `listSessoesEncerradas`), `StatusBar.test.tsx` (props de navegação).

Testes novos: `session-repository-sqlite.test.ts` (8, SQL real: só encerradas, ordem, desempate, curtas e duração 0, antigas); `session-repository.test.ts` (SQL esperado); `session-handler.test.ts` (lista, vazia, erro); `format-flight-time.test.ts` (23, fusos fixos); `use-sessoes-encerradas.test.ts` (19, fake timers); `flight-card.test.tsx`; `flight-list-page.test.tsx`; `flight-detail-page.test.tsx`; `StatusBar.test.tsx` (7 de navegação); `App.test.tsx` (22 do UC-004: critérios, navegação, teclado, volta ao painel, valores ao vivo após navegar, atualização da lista).

Cobertura: arquivos do UC-004 com 100% de linhas; ramos sem teste só em fallbacks inalcançáveis (`format-flight-time.ts`, `App.tsx`); total 92,8% de linhas e 96,3% de ramos.

Conferência no app (macOS, sem simulador e sem voos): barra com "Painel", "Voos" e "Sem conexão"; clique em "Voos" mostra o título e o estado vazio oficial, com "Voos" marcado (`aria-current`); console sem erros.

### Decisões do HITL-2 (2026-11-17)

- Confirmados os desvios do developer: lista buscada a cada abertura da tela; rótulo "Duração" no card; foco em "Voltar à lista" ao abrir um voo; após erro na primeira carga, um `session:ended` com busca bem-sucedida troca o erro pela lista.

### 2.2 Testar, 2ª rodada (ajustes do HITL-3)

- 16 testes atualizados para o `aria-label` novo; 2 testes renomeados para o padrão "deve".
- Testes novos: 17 de `formatarDuracaoPorExtenso`; foco no título "Voos" (5) e no título oculto do painel, carga inicial sem mover o foco, volta automática e `aria-describedby` (13 em `App.test.tsx`, 2 em `flight-detail-page.test.tsx`).
- O tester encontrou um defeito do ajuste 3: com hora de fim nula o rótulo saía "duração duração indisponível". O developer corrigiu no card (constante `DURACAO_INDISPONIVEL` exportada, contrato do formatador mantido).
- Resultado final: 30 arquivos e 593 testes passando; build, `tsc` do renderer e lint sem erros. `minWidth`/`minHeight` ficam para o roteiro manual.
- Débito: o card compara strings com `DURACAO_INDISPONIVEL` (alternativa: formatador devolver `null`).

## Revisão e decisões

### 3. Revisão (2026-11-17)

Os 4 revisores aprovaram sem bloqueantes. Pendência para antes do encerramento: roteiro manual de 9 passos no Windows.

#### 3.1 Funcionalidade
CA-004-1 a CA-004-3, navegação, volta ao painel, atualização da lista, erro, carregamento e teclado atendidos; UC-001, UC-002, UC-003 e UC-006 sem regressão.
Não bloqueantes: foco perdido se a sessão de origem sumir (débito do 2.1); clique na seção atual sem retorno visual (débito do 2.1); sem paginação nem índice; Esc ouvido no `document` inteiro (conflito futuro possível); textos de produto desatualizados (fase Documentar).

#### 3.2 Qualidade
Lint, 554 testes, build, `tsc` do renderer e do preload sem erros; nenhum `any`; meta de cobertura atingida; arquivos do UC-004 com 100% de linhas.
Não bloqueantes: dois nomes de `it` fora do padrão "deve" (`App.test.tsx:1081`, `use-sessoes-encerradas.test.ts:136`); estilos de título e família de fonte repetidos.

#### 3.3 Usabilidade
Contraste de textos, foco visível, teclado, estrutura da lista, estado sempre visível, carregamento, mensagens e formatos conformes.
Não bloqueantes:
1. Foco cai no `body` quando `session:started` desmonta o card ou o botão "Voltar à lista".
2. Troca de tela pela barra não é anunciada (foco não vai ao título).
3. Tela provisória com foco em "Voltar à lista" sem leitura do título e do aviso.
4. Estado vazio sem anúncio; carregando com `role="status"` montado já com texto.
5. Duração em h:mm:ss no `aria-label` pode ser lida como hora; "—" dentro do rótulo.
6. Barra superior sem largura mínima: abaixo de cerca de 430 px o indicador de estado fica cortado.
7. Borda do card como botão com contraste de cerca de 1,2:1.
8. "—" do card e da tela do voo em `color-text-primary` (no painel é `color-text-secondary`).
9. Clique na seção atual sem retorno visual.
10. Estado vazio centralizado e carregando/erro à esquerda.
Itens a documentar: estrutura da barra, card de sessão revisto, tela da lista, tela provisória, volta automática ao painel, exceção dos substantivos "Painel"/"Voos" na regra do verbo no infinitivo.

#### 3.4 Arquitetura
Separação main/renderer, canal tipado, preload mínimo, wrappers, navegação sem desmontar os hooks de push, RN-006, tipos e estrutura de pastas conformes.
Não bloqueantes: `format-flight-time.ts` em `components/` usado também por uma página (decidir onde ficam utilitários usados por páginas); CSS em arquivo com a regra base da classe além das pseudo-classes (registrar na convenção).

### 3. Revisão, rodada curta (2026-11-17)

Usabilidade revisou só os ajustes: sem bloqueantes; os 4 ajustes resolvem os itens 1, 3, 5 e 6 da primeira revisão e o foco perdido do débito do 2.1.
Não bloqueantes (direto para débito, pela regra da rodada curta única):
1. Ao voltar do voo, o foco fica no `body` enquanto a lista é buscada de novo, e permanece lá se a busca falhar (o erro é anunciado por `role="alert"`).
2. A duração na tela provisória do voo aparece só em h:mm:ss, sem versão por extenso para leitor de tela (tratar no UC-005).

### Decisões do HITL-3, rodada curta (2026-11-17)

- Revisão aprovada; os 2 itens da rodada curta vão para débito (regra da rodada curta única).

### Decisões do HITL-3, 1ª rodada (2026-11-17)

- Rodada curta única (regra do ADLC) com 5 ajustes:
  1. Ao trocar de tela (pela barra, ao abrir um voo, ao voltar à lista e na volta automática ao painel), o foco vai para o título da tela nova; no painel, que não tem título visível, um título acessível para receber o foco. Exceção já decidida: ao abrir um voo, o foco continua em "Voltar à lista" (ajuste 2 cobre a leitura).
  2. Na tela do voo, o botão "Voltar à lista" ganha `aria-describedby` apontando para o título e o aviso "Debriefing disponível em breve".
  3. Duração por extenso no `aria-label` do card (ex.: "1 hora, 12 minutos e 5 segundos"; "0 segundos"; valor ausente como "duração indisponível"), sem mudar o texto visível h:mm:ss.
  4. Largura mínima da janela de cerca de 640 px, para a barra superior não cortar o indicador de estado.
  5. Renomear os dois testes fora do padrão "deve".
- Convenção: utilitários de exibição usados por componentes e páginas ficam em `components/` (registrar na fase Documentar).
- Demais itens menores viram débito. O que a rodada curta levantar vai direto para débito, salvo bloqueante.

### 4. Documentação (2026-11-17)

- 4.1 Produto: UC-004 reescrito (pré-condição, fluxo com navegação, fluxos A a G, "Fora do escopo", CA-004-1 a CA-004-8, regras RN-003 a RN-006, status "Em andamento"); UC-005 ligado à tela provisória e com "Em aberto" do loop-005; UC-003 (fluxo G e formato da duração); glossário com "Lista de voos", "Tela do voo" e o formato da duração; RN-003, RN-004 e RN-006 com o UC-004. product.md e UC-002 sem mudança.
- 4.2 Engenharia: ADR-010 (navegação por estado); canal `session:list-ended`; diretrizes de estado de exibição e janela mínima; domain_model.md com `aeronave`/aeródromos vazios e formato da duração; code_conventions.md com `pages/`, utilitários em `components/`, `timeZone` fixo nos testes, CSS base junto das pseudo-classes e os débitos do loop. Em aberto: paginação e índice; ordem por texto.
- 4.3 ADLC: débito técnico (15 itens), limitações conhecidas (2), roteiro de 11 passos no Windows, lições LL-020 a LL-023, backlog (item 4 concluído; item 9 "Gravar aeronave e aeródromos"; débitos de acessibilidade da lista no item 6; índice e paginação no item 8). Perguntas: item 2 da 1ª revisão de usabilidade dado como resolvido; LL-021 no ADLC; duração por extenso como critério do UC-005; demais débitos da lista no item 6.
- 4.4 UX: design.md com estrutura geral e navegação, card de sessão, tela da lista, tela provisória, janela mínima e débitos; usability.md com acessibilidade da navegação e da lista, textos, exceção dos substantivos de navegação e formato de data, hora e duração.

### Decisões do HITL-4 (2026-11-17)

- Regra da rodada curta ampliada: defeitos introduzidos pelos próprios ajustes são corrigidos dentro da rodada e não contam como itens novos. Registrada em agent_development_lifecycle.md e nas skills loop-review do .bob e do .claude.
- Backlog: item 6 renomeado para "UX do painel e da lista de voos", com todos os débitos de UX da lista (clique na seção atual, cor do "—", alinhamento dos estados, além dos de acessibilidade). Duração por extenso na tela do voo fica no UC-005 (item 5).
- Item 2 da 1ª revisão de usabilidade (troca de tela sem anúncio) considerado resolvido pelo ajuste 1 da rodada curta.
- Publicar a v0.5.0 (merge na main e tag) para o teste manual no Windows.

## Débito técnico do loop

Lista única dos itens que foram para débito: débitos do developer na 2.1 (1ª e 2ª rodadas), do tester na 2.2 (2ª rodada), achados não bloqueantes das revisões (1ª rodada e rodada curta), riscos da 1.2 sem tratamento e decisões dos HITL. Não estão aqui: os 5 ajustes corrigidos na rodada curta (foco ao trocar de tela, `aria-describedby` na tela do voo, duração por extenso no `aria-label`, largura mínima da janela, nomes de teste fora do padrão "deve"), o foco perdido quando a sessão de origem some da lista (resolvido pelo ajuste 1), o defeito "duração duração indisponível" (corrigido na própria rodada curta), os itens de contexto previstos para a fase Documentar (textos de produto, convenção de utilitários em `components/`, CSS em arquivo com a regra base da classe), as limitações conhecidas e o item novo do backlog (subseções abaixo) e as validações no Windows (pendência abaixo).

Observação: a rodada curta de usabilidade citou como resolvidos os itens 1, 3, 5 e 6 da 1ª revisão. O item 2 (troca de tela pela barra não anunciada) foi tratado pelo ajuste 1 (foco no título da tela nova) e não entra aqui; confirmar no HITL-4.

Funcionalidade e dados
1. Lista sem paginação e consulta sem índice; o volume cresce com o uso (RN-005) (2.1, 3.1, risco da 1.2).
2. A lista é buscada de novo a cada abertura da tela (2.1; comportamento confirmado no HITL-2).
3. A ordenação depende de `iniciada_em` gravado como texto ISO em UTC; outro formato quebraria a ordem (risco da 1.2).
4. O Esc da tela do voo é ouvido no `document` inteiro; pode conflitar com outros atalhos no futuro (3.1).

Usabilidade
5. Clicar no botão da tela atual ("Painel" ou "Voos") não dá retorno visual (2.1, 3.1, 3.3).
6. Estado vazio da lista sem anúncio por leitor de tela; o indicador de carregamento usa `role="status"` montado já com o texto (3.3).
7. Ao voltar do voo, o foco fica no `body` enquanto a lista é buscada de novo, e permanece lá se a busca falhar (o erro é anunciado por `role="alert"`) (3.3, rodada curta).
8. Borda do card do voo, que é um botão, com contraste de cerca de 1,2:1 (3.3).
9. "—" do card e da tela do voo em `color-text-primary`; no painel é `color-text-secondary` (3.3).
10. Estado vazio centralizado, e carregando e erro alinhados à esquerda (3.3).
11. A duração na tela provisória do voo aparece só em h:mm:ss, sem versão por extenso para leitor de tela; tratar no UC-005, que preenche essa tela (3.3, rodada curta).

Qualidade e arquitetura
12. Cálculo de horas, minutos e segundos repetido em `formatarDuracao` e `formatarDuracaoPorExtenso` (2.1, 2ª rodada).
13. Estilo "visualmente oculto" do título do painel escrito inline em `App.tsx` (2.1, 2ª rodada).
14. O card compara strings com `DURACAO_INDISPONIVEL` para montar o rótulo; alternativa: o formatador devolver `null` (2.2, 2ª rodada).
15. Estilos de título e família de fonte repetidos entre as telas (3.2).

### Limitações conhecidas (não são débito)

Registradas por decisão do HITL-1:
- Sessão encerrada em silêncio na abertura do app (verificação de até 15 s do UC-003) não emite push: com a lista já aberta, ela só aparece ao reabrir a lista.
- A aeronave não aparece no card do voo: o campo `aeronave` nunca foi gravado (e `aerodromoOrigem` e `aerodromoDestino` ficam sempre `null`). Gravar esses dados virou item novo do backlog (item 9).

### Pendência antes do encerramento (não é débito)

Roteiro manual no Windows com MSFS 2024, sobre um instalador gerado da branch do loop (como nos loops anteriores), a partir dos 9 passos da seção 1.2, com dois passos acrescentados para o que os testes automatizados não cobrem (largura mínima da janela, da rodada curta, e leitura por leitor de tela):

1. Estado vazio: sem sessões encerradas no banco, "Voos" mostra "Nenhum voo registrado. Inicie o simulador e ligue o motor para começar."
2. Voo curto: um voo curto encerrado aparece na lista com data, hora de início e duração.
3. Voo no topo: o voo mais recente aparece no topo, com a hora de início no horário local do Windows.
4. Lista aberta e motor ligado: com a lista (ou a tela do voo) aberta, ligar o motor leva ao painel com "Coleta iniciada".
5. Sessão ativa: a sessão em andamento não aparece na lista, e o painel segue ao vivo ao voltar a ele.
6. Atualização da lista: com a lista aberta, o encerramento de uma sessão (15 s com motor parado no solo) faz o voo aparecer sem reabrir a tela.
7. Teclado: Tab percorre os voos, Enter abre a tela do voo, Esc volta à lista com o foco no card de origem.
8. Sessões antigas: sessões das versões anteriores, inclusive as de duração 0 ("0:00:00"), aparecem na lista.
9. Fuso local: data e hora conferem com o relógio e o fuso do Windows.
10. Largura mínima: a janela não fica mais estreita que 640 px (altura mínima 480 px), e na largura mínima a barra superior mostra o nome do app, "Painel", "Voos" e o indicador de estado sem corte.
11. Foco e leitor de tela (Narrador do Windows): ao trocar de tela pela barra, o foco vai ao título da tela nova ("Voos" ou o título oculto "Painel de tempo real") e ele é lido; o card é lido com a duração por extenso; na tela do voo, "Voltar à lista" é lido com o título e o aviso "Debriefing disponível em breve".

## Contexto atualizado

Resumo do que a fase Documentar atualiza, por área, conforme os impactos propostos nas etapas 1.1, 1.2 e 3 e as decisões dos HITL. As etapas 4.1, 4.2 e 4.4 rodam em paralelo com esta; o resultado de cada uma é conferido no HITL-4.

### 4.1 Produto
- `use_cases.md` (UC-004): pré-condição sem exigir sessão encerrada; fluxo principal com a navegação pelos botões "Painel" e "Voos"; seleção abre a tela provisória do voo (data, hora, duração, "Debriefing disponível em breve", "Voltar à lista"); fluxos alternativos (só sessão ativa, sessão que começa com a lista ou a tela do voo aberta, sessão que encerra com a lista aberta, erro na carga, erro numa nova busca mantém a lista anterior); CA-004-1 com sessões encerradas, campos, ordenação por início (mais recente primeiro) e formatos (dd/mm/aaaa, HH:mm, h:mm:ss); CA-004-2 conforme a tela provisória; CA-004-3 com o texto do estado vazio; critérios numerados; RN-004 e RN-006 (e RN-003) em "Regras aplicadas"; status "Em andamento".
- `use_cases.md` (UC-003 e UC-005): UC-003 com a observação do formato da duração; UC-005 recebe a carga e o corte das leituras na hora de fim, o preenchimento da tela provisória e a duração por extenso para leitor de tela.
- `business_rules.md`: RN-004 e RN-006 (e RN-003) passam a listar o UC-004.
- `glossary.md`: termo novo "Lista de voos"; "Duração" com o formato h:mm:ss.

### 4.2 Engenharia
- `architecture.md`: canal invoke `session:list-ended`; ADR-010 (navegação por estado no `App.tsx`, sem roteador, com os hooks de push no topo); diretriz da tela atual como estado de exibição; janela com largura mínima de 640 px e altura mínima de 480 px; em aberto paginação e índice da lista.
- `domain_model.md`: `aeronave`, `aerodromoOrigem` e `aerodromoDestino` hoje gravados vazios; formato h:mm:ss da duração.
- `code_conventions.md`: pasta `pages/`; utilitários de exibição usados por componentes e páginas ficam em `components/` (decisão do HITL-3); formatador de data e hora com `timeZone` opcional e testes de fuso com `timeZone` fixo; CSS em arquivo com a regra base da classe além das pseudo-classes; fake de `window.electronApi` com cada função nova.

### 4.3 ADLC
- `loop_reports/loop-005.md`: "Débito técnico do loop", limitações conhecidas, pendência do Windows, "Contexto atualizado" e "Lições".
- `lessons_learned.md`: LL-020 a LL-023.
- `backlog.md`: item 4 movido para Concluídos; "Em andamento" vazio; item 9 novo ("Gravar aeronave e aeródromos"); item 6 ampliado com os débitos de acessibilidade da lista de voos; item 8 ampliado com índice e paginação da lista.
- `loop_report.md`: linha do loop-005 adicionada no encerramento, após o HITL-4 e o teste no Windows.

### 4.4 UX
- `design.md`: barra superior com os botões "Painel" e "Voos" à direita do nome do app (`aria-current`, destaque em `color-accent`); card de sessão revisto (botão com data · hora e duração, sem indicador de ativa/encerrada nem "selecionado"); tela da lista de voos (título "Voos", coluna única com rolagem, estados carregando, vazio, erro e lista); tela provisória do voo; volta automática ao painel quando uma sessão começa; largura mínima da janela.
- `usability.md`: textos da lista ("Carregando voos...", estado vazio, erro, "Voo de dd/mm/aaaa", "Voltar à lista", "Debriefing disponível em breve"); formato de data, hora e duração; duração por extenso no rótulo acessível; teclado (Tab, Enter, Esc com foco devolvido); foco no título ao trocar de tela; erro sem nova tentativa; exceção dos substantivos "Painel" e "Voos" na regra do verbo no infinitivo; débitos de acessibilidade em aberto.

## Lições

Ver `context/adlc/lessons_learned.md` (LL-020 a LL-023).

- LL-020: a regra de no máximo uma rodada curta foi aplicada pela primeira vez e funcionou; os itens novos foram direto para débito.
- LL-021: um defeito introduzido pela própria rodada curta foi corrigido dentro dela; esse tipo de defeito não conta como "item novo".
- LL-022: abrir o app de verdade pelo protocolo de depuração (CDP) para navegar e ler a tela complementou os testes sem o Windows.
- LL-023: o refinamento técnico descobriu que o campo `aeronave` nunca foi gravado; dados que o produto promete exibir devem ser conferidos no código antes da especificação.
