# Loop 006

Loop: 006
Data de início: 2026-11-17
Item do backlog: 5 — Visualizar dados do debriefing
Caso de uso: UC-005
Fase atual: concluído

## Resumo (modelo de loop_report.md)

Loop: 006
Data: 2026-11-17
Item do backlog: 5 — Visualizar dados do debriefing (UC-005)

Plano:
- 1.1: 14 critérios de aceite (CA-005-1 a 14) e 16 perguntas, todas aprovadas na opção (a). Recorte: cabeçalho, carga com corte na hora de fim, reprodução (1×, 4×, 16×), mapa sem fundo e sem pista, painel de instrumentos sem faixas de cor, perfil vertical, N/A e "sem dados". Ficaram fora: marcadores de evento e pista, faixas por aeronave, ângulo real dos flapes, rumo verdadeiro, mapa de fundo, maximização, gráficos por parâmetro, comparação, exportação, filtros e anotações.
- 1.2: canal `session:get-readings` com resposta em colunas (`LeiturasDoVoo`/`SerieDeLeituras`), sem migração nova; funções puras em `pages/flight-detail/` (valor no instante sem interpolar, redução de pontos, projeção, escalas, reprodução); hooks `use-dados-do-voo` e `use-reproducao`; 8 mostradores; medição de um voo de 3 h. HITL-1 aprovou as 8 decisões técnicas na opção (a).

O que foi feito:
- Tarefas 1 a 20 implementadas e a 21 preparada (consulta de 129.600 linhas em cerca de 58 ms no macOS, usando o índice). Tela do voo reescrita com reprodução, trajetória, painel de instrumentos escuro e perfil vertical, conforme o protótipo "Debriefing · opção D".
- Rodada curta do HITL-3: foco visível no botão de velocidade selecionado, legenda do mapa, contraste 3:1 do tracejado e da alavanca de mistura, anúncio de "voo sem leituras" (`aria-describedby` e `role="status"`), constantes de tempo em `components/limites-de-tempo.ts`, `use-reproducao` em `pages/flight-detail/`, trajetória restante em pontilhado com `vector-effect: non-scaling-stroke`.

Testes:
- 38 arquivos e 761 testes passando ao fim da rodada curta; lint e tsc das 3 configs limpos. CA-005-1 a 14 cobertos; 100 % das linhas em `pages/flight-detail/` e no main/db do loop; `use-dados-do-voo` com 94,9 %.
- Ficam para o teste manual no Windows: setas do controle deslizante, foco visível e contraste, NVDA, voo real, voo da v0.2.0, mistura N/A, voo longo (com a medição do main), pausa do simulador e janela de 640×480.

Revisão e decisões:
- 3.1, 3.2 e 3.4 aprovadas; 3.3 com 1 bloqueante (foco invisível no botão de velocidade selecionado), resolvido na rodada curta única.
- HITL-2: resposta com outro `sessaoId` vira débito; flapes em 0–100 e IAS negativa como 0 aceitos; setas no teste manual.
- HITL-3: rodada curta única com os ajustes listados acima; os dois efeitos dos próprios ajustes (tracejado pouco distinto do azul e anúncio do voo sem leituras) foram corrigidos dentro da rodada, conforme a regra da LL-021; a instrumentação fica até o teste no Windows; os demais não bloqueantes viraram débito no backlog (itens 8, 10, 12, 13, 11 e 9).

Contexto atualizado (fase Documentar, conferido no HITL-4):
- Produto (4.1): UC-005 reescrito, ajustes no UC-004 e no UC-003, RN-003/004/007 aplicadas ao UC-005, RN-008 e termos novos do glossário, conforme os impactos da 1.1.
- Engenharia (4.2): canal `session:get-readings`, ADR-011, ADR-010, "Em aberto" do desempenho, `LeiturasDoVoo`/`SerieDeLeituras` e convenções de `pages/flight-detail/`, conforme os impactos da 1.2 e da revisão curta.
- ADLC (4.3): este report, LL-024 a LL-028 e backlog.
- UX (4.4): seção "Tela: debriefing" de design.md pelo protótipo D, exceção do painel escuro e decisões de contraste e foco.

Lições: LL-024 a LL-028 em lessons_learned.md.

---

Registro detalhado

Referência de interface: protótipo aprovado antes do loop, "Debriefing · opção D" (https://claude.ai/artifact/J3ykDbrQjy6Gc32oHSudjk; cópia local da sessão em /private/tmp/claude-501/-Users-oswaldo-Projects-dio-blackbox-simulator/d138fc2c-c1eb-4747-ae00-ff6a6c5d1de1/scratchpad/proto/project/D-Instrumentos.dc.html). Ele traz:
- cabeçalho do voo com "Voltar à lista";
- reprodução com Play/Pause, velocidades 1×, 4× e 16×, controle deslizante da linha do tempo e marcadores de evento;
- mapa da trajetória;
- painel de instrumentos escuro, com velocímetro, horizonte artificial, altímetro, tacômetro, bússola, variômetro, manete, mistura e flapes;
- perfil vertical.

Questões levantadas no protótipo:
- as faixas de cor de velocidade e RPM são de um Cessna 172 e dependem da aeronave (item 9 do backlog) ou de faixas genéricas;
- o ângulo dos flapes é ilustrativo, porque só o % é gravado;
- os marcadores de evento dependem de detectar decolagem e pouso;
- os gráficos de voos longos precisam de redução de pontos.

---
HITL-1 aprovado em 2026-11-17: as 8 decisões técnicas na opção (a), sem riscos novos.
HITL-2 aprovado em 2026-11-17: (1) fica registrado como débito técnico; (2) aceito como está, flapes em 0–100 e IAS negativa como 0; (3) as setas são conferidas no teste manual.
HITL-3 retorno, em rodada curta única (2026-11-17):
- correções: o bloqueante do foco invisível; a legenda do mapa no texto sugerido; contraste 3:1 no tracejado e na alavanca de mistura; o anúncio de "voo sem leituras"; as constantes de tempo num módulo próprio, sem React; `use-reproducao` dentro de `pages/flight-detail/`;
- o texto da trajetória indisponível foi aprovado como está;
- a instrumentação fica até o teste no Windows e sai num loop seguinte;
- os demais não bloqueantes viram débito.
HITL-2 (rodada curta) aprovado em 2026-11-17.
HITL-3 (rodada curta) em 2026-11-17: os dois efeitos dos próprios ajustes são corrigidos dentro da rodada (tracejado distinto do azul; mensagem de voo sem leituras também em `role="status"`).
HITL-3 aprovado em 2026-11-17; os demais não bloqueantes viram débito.
HITL-4 aprovado em 2026-11-17: a legenda mantém "Tracejado"; os itens 11, 12 e 13 ficam no fim do backlog. O encerramento depende do teste manual no Windows.
Loop encerrado em 2026-11-17, por decisão do humano, antes do teste manual no Windows. O roteiro (voo real, voo da v0.2.0, mistura N/A, voo longo com o log de tempo, setas do controle, foco no 1×, NVDA e janela de 640×480) fica pendente para a v0.6.0.

## 1.1 Especificação de negócio

### Critérios de aceite propostos ([Pn] = depende da pergunta n)

- CA-005-1 (abertura): título "Voo de dd/mm/aaaa", início HH:mm e duração h:mm:ss. Só são carregadas as leituras entre a hora de início e a hora de fim, inclusive; a espera de 15 s do UC-003 não aparece. A reprodução abre pausada em 0:00:00 [P14].
- CA-005-2 (os 12 parâmetros): todos com valor numérico visível nos formatos de usability.md. Velocímetro: IAS. Horizonte artificial: arfagem e rolagem. Altímetro: altitude. Tacômetro: RPM. Bússola: rumo. Variômetro: VS. Alavancas: manete e mistura. Indicador: flapes [P4]. Latitude e longitude ficam no texto da trajetória.
- CA-005-3 (linha do tempo): controle deslizante (mouse ou setas). Instrumentos, aeronave no mapa e cursor do perfil seguem o instante [P5]. Mostra o tempo decorrido "h:mm:ss de h:mm:ss" e a hora local [P16].
- CA-005-4 (reprodução): Reproduzir e Pausar a 1×, 4× ou 16×. Pausa no fim; Reproduzir no fim recomeça do zero.
- CA-005-5 (trajetória): trajetória inteira, sem mapa de fundo e com o norte para cima. O trecho até o instante fica em azul, o restante tracejado, e a aeronave é orientada pelo rumo [P10].
- CA-005-6 (perfil vertical): altitude ao longo da duração inteira, com cursor no instante. Mínimos e máximos são preservados na redução de pontos [P11].
- CA-005-7 (N/A): parâmetro da lista parametrosNaoAplicaveis aparece "N/A" o voo todo, sem ponteiro, com rótulo acessível "<rótulo>: não aplicável". N/A vence "sem dados".
- CA-005-8 (perda de dados no instante): instante sem leitura mostra "—", com rótulo acessível "<rótulo>: sem dados"; mapa e perfil mostram o trecho interrompido [P6].
- CA-005-9 (voo sem os 6 parâmetros novos): parâmetro aplicável sem nenhuma leitura no voo mostra "Sem dados neste voo"; o mapa vira uma mensagem de trajetória indisponível [P7].
- CA-005-10 (voo sem leituras): mostra o cabeçalho com uma mensagem própria, sem reprodução, instrumentos, mapa nem perfil [P8].
- CA-005-11 (carregamento e erro): mensagem de carregamento depois de 500 ms e mensagem de erro que diz o que fazer [P9].
- CA-005-12 (duração por extenso): a duração e o tempo decorrido são lidos por extenso pelo leitor de tela, e o texto visível fica em h:mm:ss [P15].
- CA-005-13 (navegação): "Voltar à lista" ou Esc volta à lista e para a reprodução. Uma sessão que começa para a reprodução e abre o painel com "Coleta iniciada" (CA-004-5).
- CA-005-14 (fora da escala): o ponteiro para no limite da escala e o número mostra o valor real [P2].

### Regras de negócio

- RN-002 e RN-005 já estão no UC-005.
- Faltam no UC-005: RN-003 (sessão que começa leva ao painel), RN-004 (a hora de fim limita a linha do tempo) e RN-007 (N/A, prioridade sobre "sem dados" e sessões antigas com a lista vazia).
- Possível regra nova, RN-008 "Fidelidade aos dados gravados": o debriefing mostra só valores gravados, sem interpolar, e elementos derivados só aparecem quando os dados os sustentam [P5, P6].

### Glossário

- Termos novos: Linha do tempo, Instante selecionado, Reprodução, Trajetória, Perfil vertical, Painel de instrumentos, Sem dados, Voo sem os parâmetros novos.
- Termos a atualizar: Tela do voo (deixa de ser provisória), Debriefing e N/A.

### Impactos no contexto

- use_cases.md:
  - UC-005: reescrever o caso de uso, com os fluxos A a G e os critérios CA-005-1 a 14; tirar os "Em aberto".
  - UC-004: revisar o passo 5 e o CA-004-2 (tela provisória) e o "Fora do escopo".
  - UC-003: a observação sobre o corte passa a apontar para o CA-005-1.
- business_rules.md: incluir UC-005 em "Aplica-se a" da RN-003, RN-004 e RN-007; criar a RN-008, se aprovada.
- glossary.md: os termos acima.
- design.md:
  - a seção "Tela: debriefing" e o "Gráfico de linha temporal" são substituídos pelo protótipo D;
  - o painel escuro precisa de exceção ao "Tema claro";
  - a fonte precisa ser a local;
  - o contraste do "—" no painel escuro precisa ser conferido;
  - o foco ao abrir o voo apontava para o aviso, que deixa de existir.
- backlog.md: itens novos conforme P2, P3 e P13.

### Perguntas para decisão humana (recomendação do analista entre parênteses)

1. Escopo do loop: (a) o recorte proposto abaixo; (b) sem o mapa; (c) o protótipo inteiro. (a)
2. Faixas de cor de velocidade e RPM: (a) sem faixas até o item 9 gravar a aeronave, com escalas largas (IAS 0–200 kt, RPM 0–3.500); (b) faixas genéricas; (c) faixas do C172 com aviso. (a)
3. Marcadores de decolagem e pouso: (a) fora do loop, com um item novo no backlog para gravar "no solo" como leitura; (b) só início e fim; (c) inferir por heurística; (d) gravar "no solo" agora. (a). Pelo mesmo motivo sai a pista do mapa.
4. Indicador de flapes: (a) desenho esquemático proporcional ao %, sem graus; (b) barra de 0 a 100 %. (a)
5. Valor no instante: (a) a última leitura até o instante, sem interpolar; (b) interpolação linear. (a)
6. Perda de dados: (a) sem leitura nos 2 s anteriores vira "—", como o "Sem sinal" do painel; (b) qualquer falta maior que 1 s; (c) manter o último valor. (a)
7. Voo sem os 6 parâmetros novos: (a) detectar pela falta de leituras e usar um texto genérico que cita a v0.3.0 só como exemplo; (b) afirmar que o voo foi gravado antes da v0.3.0. (a)
8. Voo sem nenhuma leitura: (a) só o cabeçalho, com "Nenhuma leitura gravada neste voo."; (b) a tela completa com "—". (a)
9. Carregamento e erro: (a) "Carregando dados do voo..." e "Não foi possível carregar os dados do voo. Volte à lista e abra o voo de novo."; (b) o padrão da lista. (a), se reabrir de fato tentar de novo.
10. Orientação da aeronave no mapa: (a) pelo rumo magnético, como limitação conhecida; (b) pela direção entre posições; (c) gravar o rumo verdadeiro (futuro). (a)
11. Redução de pontos: (a) só no desenho do mapa e do perfil, preservando máximos e mínimos; (b) não reduzir. (a)
12. Painel escuro: (a) exceção ao tema claro, com contraste conferido; (b) tema claro. (a)
13. A seção antiga de design.md: (a) o protótipo D substitui; maximização fora, no backlog; (b) maximização agora. (a)
14. Abertura e teclado: (a) abre pausado em 0:00:00; Tab pelos controles, setas de 1 s, Esc volta; sem atalhos novos; (b) atalhos (espaço para Reproduzir). (a)
15. Duração por extenso: (a) no cabeçalho e no tempo decorrido do controle (aria-valuetext); (b) só no cabeçalho. (a)
16. Hora local no reprodutor: (a) HH:mm:ss; (b) só o tempo decorrido. (a)

### Escopo proposto

- Entra:
  - cabeçalho com "Voltar à lista" e Esc;
  - carga com corte na hora de fim, mais os estados de carregamento, erro e voo sem leituras;
  - reprodução;
  - mapa sem fundo e sem pista;
  - painel de instrumentos sem faixas de cor;
  - perfil vertical;
  - N/A, "sem dados" e voo sem os parâmetros novos;
  - redução de pontos só no desenho.
- Fica fora:
  - marcadores de evento e pista;
  - faixas por aeronave;
  - ângulo real dos flapes;
  - rumo verdadeiro;
  - mapa de fundo;
  - maximização;
  - gráficos por parâmetro com seletor;
  - comparação entre voos, exportação, filtros e anotações.

### Decisões do humano (2026-11-17)

As 16 recomendações foram aceitas, na opção (a) de cada pergunta, e o escopo proposto vale para este loop.

## 1.2 Refinamento técnico

### Entidades e tipos

- Sessão: só leitura. `iniciadaEm` e `encerradaEm` fazem o corte, com as duas pontas incluídas. `parametrosNaoAplicaveis` define o N/A; nas sessões antigas a lista vem vazia (`[]`).
- LeituraDeParâmetro: é a única fonte de dados, sem interpolar. As leituras de um mesmo ciclo dividem o mesmo `timestamp` (ISO UTC de tamanho fixo).
- Tipos novos em `src/shared/types.ts`:
  - `SerieDeLeituras = { parametroId; instantes: number[] (ms UTC, em ordem crescente); valores: number[] }`;
  - `LeiturasDoVoo = { sessaoId; series: SerieDeLeituras[] }`. Só entram os parâmetros com leitura; `series: []` significa voo sem leituras.

### Tarefas

Banco e main:
1. Índice: o `idx_leituras_sessao_timestamp`, da migração 003, atende. Não precisa de migração nova, e o `ORDER BY` não leva `rowid`.
2. `session-repository.ts`: nova `buscarSessaoPorId(id)`.
3. `reading-repository.ts`: nova `listarLeiturasDoVoo(sessaoId)`.
   - Lança erro se a sessão não existir, estiver ativa ou não tiver hora de fim.
   - Usa `timestamp BETWEEN iniciada_em AND encerrada_em`, com `.all()`.
   - O agrupamento fica na função pura `agruparEmSeries`, que descarta com log os slugs desconhecidos.
4. `ipc-channels.ts`: novo canal invoke `SESSION_GET_READINGS = 'session:get-readings'`.
5. `session-handler.ts`: handler que valida `sessaoId`, loga e relança as falhas. Não guarda cache.
6. `preload.ts`, `electron-api.d.ts`, `session-ipc.ts`: `getLeiturasDoVoo`. Os fakes de `window.electronApi` nos testes mudam na mesma entrega.

Funções puras, em `pages/flight-detail/`:
7. `valor-no-instante.ts`:
   - `valorNoInstante` faz busca binária da última leitura até o instante e devolve `null` se passaram 2000 ms ou mais, reaproveitando `SEM_DADOS_LIMITE_MS`;
   - `estadoDoParametro` segue a precedência: N/A, depois sem dados no voo, depois "—", depois o valor.
8. `reduzir-pontos.ts`:
   - `segmentarPorFalhas` corta a série em intervalos maiores que 2 s;
   - `reduzirSegmento` guarda, por balde, a primeira leitura, o mínimo, o máximo e a última.
   - Vale só para o desenho.
9. `projecao-trajetoria.ts`: projeção equiretangular com cos(latitude média), norte para cima e escala única, num `viewBox` de 1000×700. Ponto único ou eixo constante ficam no centro. `paresDePosicao` junta latitude e longitude pelo instante.
10. `escala-instrumentos.ts`:
    - `anguloNaEscala` prende o ponteiro no limite;
    - escalas: IAS de 0 a 200 kt, RPM de 0 a 3.500, VS de ±2.000 fpm, manete, mistura e flapes de 0 a 100 %;
    - altímetro com dois ponteiros e bússola com a rosa girada;
    - arfagem limitada a ±25° no desenho;
    - sinais de arfagem e rolagem com `PITCH_POSITIVO_NARIZ_PARA_BAIXO` e `BANK_POSITIVO_PARA_ESQUERDA`, sem copiar o sinal do protótipo.
11. `reproducao.ts`: `avancarReproducao` e `alternarReproducao` são puras, sem timer e sem `Date.now()`. A reprodução pausa no fim, e Reproduzir no fim volta ao zero.
12. `format-flight-time.ts`:
    - extrair `formatarSegundosHms` e `formatarSegundosPorExtenso`, o que tira a duplicação;
    - novas `formatarHoraComSegundos` e `textoDoInstante`, para o `aria-valuetext`.

Hooks:
13. `use-dados-do-voo.ts`:
    - pede o catálogo e as leituras juntos;
    - mostra o carregando depois de 500 ms e o erro com log;
    - descarta respostas que chegam depois de desmontar ou de um voo antigo;
    - não guarda cache, então reabrir o voo carrega de novo (P9 confirmada).
14. `use-reproducao.ts`: `setInterval` de 250 ms só enquanto toca, limpo ao pausar e ao desmontar.

Componentes:
15. `flight-detail-page.tsx` reescrita:
    - cabeçalho com h1, início e duração; o h:mm:ss visível leva `aria-hidden` e o texto por extenso fica oculto;
    - "Voltar à lista" e Esc continuam;
    - saem o `dl` e o aviso;
    - estados de carregando, erro, sem leituras e normal;
    - prop `timeZone` só para os testes.
16. `flight-player.tsx`:
    - botão de 44×44 px "Reproduzir o voo" ou "Pausar";
    - velocidades 1×, 4× e 16× com `aria-pressed`;
    - texto "h:mm:ss de h:mm:ss · HH:mm:ss";
    - controle deslizante "Instante do voo" com passo de 1 s e `aria-valuetext`;
    - abre pausado em 0, a 1×.
17. `trajectory-map.tsx`:
    - SVG com `role="img"`, sem fundo e sem pista;
    - caminho tracejado inteiro e trecho azul até o instante;
    - aeronave girada pelo rumo, oculta sem posição;
    - texto com latitude e longitude;
    - mensagem de trajetória indisponível quando falta posição.
18. `instrument-panel.tsx` e os 8 mostradores:
    - painel escuro com os tokens `--color-panel-*`; o "—" em #A8A8A8 sobre #2F3438 dá cerca de 5,3:1;
    - estados N/A, "—" e "Sem dados neste voo", sem ponteiro, e o valor real com o ponteiro preso no limite;
    - cada mostrador é um `role="group"` com `aria-label`, e o SVG leva `aria-hidden`;
    - `useId` nos `clipPath`.
19. `vertical-profile.tsx`:
    - SVG de 1000×200 com a altitude reduzida por segmentos e cursor no instante;
    - textos com altitude, VS, máximo, mínimo e marcas de tempo;
    - "Sem dados neste voo" quando não há altitude.
20. `App.tsx`: `<FlightDetailPage key={sessao.id}>`, para cada voo montar de novo. A volta ao painel com `session:started` continua como está.

Medição:
21. Medir um voo de 3 h (129.600 linhas): o tempo da consulta com `node:sqlite`, sem asserção de tempo, e o primeiro desenho no app.

### Testes por critério

- CA-005-1:
  - SQL real em `listarLeiturasDoVoo`: entram as pontas; ficam de fora as leituras antes do início, as da espera de 15 s e as de outra sessão; erro para sessão inexistente, ativa ou sem fim;
  - `EXPLAIN QUERY PLAN` usa o índice, sem B-tree temporária;
  - `agruparEmSeries` e `buscarSessaoPorId`;
  - a página abre pausada em 0.
- CA-005-2: os 12 valores formatados, com o sinal de arfagem e rolagem corrigido e latitude e longitude na trajetória.
- CA-005-3: o controle deslizante atualiza valores, aeronave e cursor; hora local com `timeZone` fixo.
- CA-005-4: funções puras a 1×, 4× e 16×, pausa no fim e volta ao zero; o hook com fake timers não deixa timer ao pausar.
- CA-005-5: projeção com o norte para cima, escala única e sem `NaN`; caminho azul, tracejado e `rotate`.
- CA-005-6: `reduzirSegmento` preserva os extremos; cursor na posição certa.
- CA-005-7: mistura N/A com o rótulo "não aplicável"; N/A vence; lista `[]` sem N/A.
- CA-005-8: `valorNoInstante` nas fronteiras de 0, 1999 e 2000 ms; `segmentarPorFalhas`; "—" e aeronave oculta.
- CA-005-9: os 6 parâmetros novos em "Sem dados neste voo" e a trajetória indisponível, também com só a latitude.
- CA-005-10: `series: []` mostra só o cabeçalho e a mensagem.
- CA-005-11:
  - hook: carregando aos 500 ms, erros, resposta tardia ignorada;
  - `role="status"` e `role="alert"`;
  - o handler valida e relança;
  - `App.test`: reabrir chama duas vezes.
- CA-005-12: texto oculto por extenso, `aria-valuetext` e formatadores; os testes atuais continuam passando.
- CA-005-13: Esc e Voltar; desmontar tocando não deixa timer; `session:started` leva ao painel.
- CA-005-14: `anguloNaEscala` prende o ponteiro e o número mostra o valor real.
- Sai o teste da tela provisória.
- Fora do Vitest:
  - conferência pelo CDP no macOS (LL-022);
  - roteiro no Windows: voo real, voo da v0.2.0, mistura N/A, voo longo, pausa do simulador, NVDA e janela de 640×480.

### Riscos

- O main fica bloqueado ao carregar voos longos (better-sqlite3 é síncrono), o que pode atrasar a coleta de uma sessão ativa. Medir na tarefa 21; a solução fica para outro loop.
- IPC: o formato em colunas fica em poucos MB.
- Renderer: a redução e a projeção ficam em `useMemo`, e cada passo faz só as buscas binárias.
- Acessibilidade: leitura em dobro (como no painel), rótulos sem `aria-live` e conferência do NVDA com "°" e "−".
- Em 0:00:00 os instrumentos podem mostrar "—", porque a primeira leitura chega até 1 s depois do início.
- Mapa: o antimeridiano e as leituras 0,0 do menu distorcem a escala.
- Flapes continuam limitados a 0..100, como em usability.md.

### Perguntas do HITL-1 (recomendação entre parênteses)

1. Resposta do IPC: (a) colunas com instantes em ms; (b) `Float64Array`; (c) uma linha por leitura. (a)
2. Foco ao abrir o voo: (a) "Voltar à lista", com `aria-describedby` no título e na linha de início e duração; (b) o h1. (a)
3. Local dos componentes: (a) `pages/flight-detail/`; (b) `components/`. (a)
4. Classe "visualmente oculto" em `global.css`: (a) sim; (b) estilo inline. (a)
5. Fronteira dos 2 s: (a) "—" a partir de 2000 ms e linha cortada acima de 2000 ms; (b) outra regra. (a)
6. `aria-valuetext`: (a) "12 minutos e 5 segundos de 1 hora, 2 minutos e 3 segundos, 14:17:05"; (b) sem a hora local. (a)
7. Aeronave sem rumo: (a) marcador circular; (b) esconder. (a)
8. Legendas dos instrumentos: (a) os rótulos dos parâmetros ("Velocidade IAS"…); (b) os nomes dos instrumentos. (a)

### Impactos no contexto de engenharia

- architecture.md:
  - canal `session:get-readings`;
  - estado de exibição da tela do voo;
  - ADR-010: tela do voo e foco;
  - ADR-011 nova, "Carga e exibição do debriefing";
  - "Em aberto" sobre o desempenho.
- domain_model.md: `LeiturasDoVoo` e `SerieDeLeituras`, o índice, o corte implementado e o `timestamp` compartilhado por ciclo.
- code_conventions.md: `pages/flight-detail/`, o padrão de SVG acessível, a classe "visualmente oculto", a prop `timeZone` e a reprodução como função pura com hook.

## 2.1 Implementar

As tarefas 1 a 20 foram implementadas, e a 21 ficou preparada para a medição. Não houve commit.

- Tipos e canal:
  - `SerieDeLeituras` e `LeiturasDoVoo` em `src/shared/types.ts`;
  - canal `session:get-readings`.
- Main:
  - `buscarSessaoPorId`;
  - `listarLeiturasDoVoo`, com `BETWEEN iniciada_em AND encerrada_em` e o agrupamento puro em `agruparEmSeries`;
  - handler que valida e relança, sem cache;
  - ponte no preload, em `electron-api.d.ts` e em `session-ipc.ts`.
- Funções puras em `pages/flight-detail/`: `valor-no-instante`, `reduzir-pontos`, `projecao-trajetoria`, `escala-instrumentos`, `reproducao`, `leitura-do-mostrador`, `catalogo` e `caminho-svg`.
- `format-flight-time.ts`:
  - `formatarSegundosHms` e `formatarSegundosPorExtenso` extraídas, o que tirou a duplicação;
  - `formatarHoraComSegundos` e `textoDoInstante` novas.
- Hooks: `use-dados-do-voo` e `use-reproducao`.
- Componentes:
  - `flight-detail-page` reescrita;
  - `flight-player`, `trajectory-map`, `instrument-panel` e `vertical-profile`;
  - 8 mostradores, mais `round-dial` e `instrument-slot`.
- `global.css`: tokens `--color-panel-*`, `--color-track-*` e `--color-profile-*` e a classe `.visualmente-oculto`.
- `App.tsx`: `<FlightDetailPage key={sessao.id}>`.
- Medição:
  - a consulta de 129.600 linhas (3 h) leva cerca de 58 ms no macOS, usando o índice e sem B-tree temporária;
  - o handler loga a quantidade de leituras e o tempo com `console.info`;
  - o renderer marca `performance.measure('debriefing:primeiro-desenho')`.
- Verificações:
  - lint limpo e `vite build` passando;
  - `tsc` limpo no main e no preload; no renderer há 1 erro, em `App.test.tsx`, porque o fake não tem `getLeiturasDoVoo`;
  - `npm test`: 565 passam e 28 falham, em 3 arquivos (`App.test.tsx`, `flight-detail-page.test.tsx` e `session-handler.test.ts`). Todos são testes antigos que esperam a tela provisória, o fake antigo ou 2 handlers. O developer não edita testes, então a correção fica para a 2.2.
- Desvios do plano:
  - textos escritos pelo developer, que precisam de confirmação: "Trajetória indisponível: este voo não tem latitude e longitude gravadas (por exemplo, voos gravados antes da v0.3.0)." e a legenda do mapa;
  - os instrumentos, o mapa e o perfil usam o segundo inteiro mostrado no tempo;
  - o mapa saiu sem a grade de fundo.
- Débitos:
  - rótulo de parâmetro fora do catálogo;
  - `SEM_DADOS_LIMITE_MS` importado de um hook;
  - h1 oculto do painel ainda com estilo inline;
  - decidir se o `console.info` da medição fica.

## 2.2 Testar

- Resultado: 38 arquivos e 752 testes passando, sem falhas; lint limpo; `tsc --noEmit` limpo no main, no preload e no renderer. Conferido de novo pelo orquestrador.
- Testes antigos adaptados:
  - `session-handler.test.ts`: agora espera 3 handlers e tem o bloco `session:get-readings`;
  - `App.test.tsx`: fake com `getLeiturasDoVoo`, CA-004-2 reescrito para a tela nova, testes de CA-005-1, 11 e 13;
  - `flight-detail-page.test.tsx`: reescrito, com 51 testes; saíram os da tela provisória.
- Testes novos:
  - SQL real de `listarLeiturasDoVoo` e de `buscarSessaoPorId`, com 15 testes e `EXPLAIN QUERY PLAN`;
  - `agruparEmSeries` e os formatadores novos;
  - os hooks `use-dados-do-voo` e `use-reproducao`;
  - as funções puras de `pages/flight-detail/`.
- Cobertura:
  - CA-005-1 a CA-005-14 cobertos;
  - 100 % das linhas em `pages/flight-detail/`, `use-reproducao` e no main/db do loop;
  - `use-dados-do-voo` com 94,9 %.
- Defeitos: nenhum. Pontos para o HITL-2:
  1. Se o main responder com um `sessaoId` diferente do pedido, a tela fica carregando para sempre. O caso é teórico, porque o handler sempre devolve o id pedido.
  2. CA-005-14: flapes ficam presos em 0–100 e a IAS negativa vira 0, pelo formatador. Falta confirmar a exceção da IAS.
  3. As setas do controle deslizante não são testáveis no jsdom; ficam para o CDP ou o roteiro no Windows.

## 3. Revisão

### 3.1 Funcionalidade: aprovado

- Bloqueantes: nenhum. Os critérios CA-005-1 a 14 foram atendidos, com evidência no código e nos testes.
- Não bloqueantes:
  1. Os textos da trajetória indisponível e da legenda do mapa precisam de confirmação humana.
  2. A exceção do CA-005-14 (flapes em 0–100, IAS negativa como 0) precisa entrar no texto do UC-005.
  3. As setas do controle deslizante ficam para o teste manual.
  4. Uma resposta com outro `sessaoId` deixa a tela carregando (débito do HITL-2).
  5. A linha do tempo vai até o segundo inteiro da duração.
  6. Em 0:00:00, os instrumentos podem mostrar "—".

### 3.2 Qualidade: aprovado

- Bloqueantes: nenhum. Lint limpo, 752 testes passando e tsc limpo nas 3 configs; sem `any`; 100 % de cobertura em main/db, main/ipc e `pages/flight-detail/`.
- Não bloqueantes:
  1. Instrumentação de medição no código de produção (`console.info` e `performance.mark`).
  2. Constantes compartilhadas exportadas por hooks, e `use-reproducao` dependendo de `pages/`.
  3. `duracaoEmSegundos` duplicada.
  4. Slugs escritos à mão nos testes: falta decidir se a regra vale para testes.
  5. Tipagem mista de `parametroId` (`ParametroId` e `string`).
  6. Arquivos sem teste próprio, mas cobertos.
  7. Ramos defensivos sem teste.
  8. Reajuste de estado durante a renderização em `useDadosDoVoo`, redundante por causa do `key`.
  9. Débitos antigos que continuam: tsconfig, adaptador `node:sqlite`, h1 inline, Prettier.

### 3.3 Usabilidade: 1 bloqueante

- Bloqueante: o foco fica invisível no botão de velocidade selecionado. O contorno `--color-accent` interno cai sobre o fundo `--color-accent`, e o 1× já abre selecionado (`flight-detail-page.css`).
- Não bloqueantes:
  1. Contraste gráfico abaixo de 3:1: tracejado da trajetória restante (cerca de 1,5:1), alavanca de mistura (cerca de 2,1:1) e borda do grupo de velocidades.
  2. Possível leitura em dobro nos grupos dos instrumentos.
  3. O `aria-valuetext` é anunciado a cada segundo durante a reprodução.
  4. A leitura de "×" pelo NVDA precisa de conferência.
  5. "Nenhuma leitura gravada neste voo." não é anunciado a quem está com o foco no botão.
  6. Alvos abaixo de 44 px: velocidades em 48×36 e o polegar da linha do tempo.
  7. Tokens novos fora de design.md, e `--color-text-secondary` dentro do painel escuro.
  8. Tamanhos de 11 e 13 px fora da escala; textos dos SVG com cerca de 7 a 8,5 px efetivos.
  9. A unidade some em N/A e "—" nos instrumentos e no perfil, mas fica na trajetória e no painel.
  10. A legenda do mapa depende do nome da cor. Texto sugerido: "Linha azul contínua: trecho já voado. Tracejado: restante. Falhas na linha: sem dados. A aeronave aponta para o rumo magnético do instante; sem rumo, aparece como um círculo."
  11. Possível "—" em todos os instrumentos em 0:00:00.
  12. A rolagem é obrigatória, e a reprodução sai da vista.
- Perguntas:
  - o alvo de 44 px vira diretriz?
  - o contraste gráfico de 3:1 vira diretriz?
  - "N/A mantém a unidade" vale no debriefing?

### 3.4 Arquitetura: aprovado

- Bloqueantes: nenhum. ADRs, separação main/renderer, preload sandboxed e IPC tipado conformes.
- Não bloqueantes:
  1. `SEM_DADOS_LIMITE_MS` e `CARREGANDO_LIMITE_MS` importados de hooks; sugestão: um módulo de constantes.
  2. `hooks/use-reproducao` depende de `pages/`: mover o hook ou escrever a regra.
  3. h1 oculto do painel duplicando a classe.
  4. Medir no Windows o desempenho do main, incluindo agrupamento e serialização.
  5. Decidir sobre a instrumentação.
  6. Resposta com outro `sessaoId`.
  7. Filtro `p.ativo` redundante.
  8. `string` em vez de `ParametroId`.
- Impactos: ADR-011 nova, canal na tabela, Diretrizes (estado de exibição da tela do voo), ADR-010 e "Em aberto" (desempenho, corte por texto ISO, instrumentação).

## Rodada curta (HITL-3)

### 2.1 Implementar (rodada)

1. Foco: `.flight-player__speed:focus-visible` ganhou `box-shadow: inset 0 0 0 4px var(--color-surface)` dentro do contorno accent. Dá 5,00:1 nos dois estados. O contorno não foi para fora porque o grupo tem `overflow: hidden`.
2. Legenda do mapa com o texto aprovado.
3. Contraste dos tokens:
   - `--color-track-remaining`: de #C3CAD5 para #7A8290, de 1,54:1 para 3,61:1 sobre #F5F7FA;
   - `--color-panel-mixture`: de #DA1E28 para #FF6F75, de 2,13:1 para 3,94:1 sobre #3A3F44.
4. O `aria-describedby` de "Voltar à lista" inclui `flight-detail-sem-leituras` quando o voo não tem leituras.
5. Novo `components/limites-de-tempo.ts` com `SEM_DADOS_LIMITE_MS` e `CARREGANDO_LIMITE_MS`. Os hooks antigos reexportam as constantes para os testes atuais (débito: tirar quando os testes migrarem).
6. `use-reproducao` (e o teste dele) foi para `pages/flight-detail/`.
- Verificações: lint e tsc limpos. 751 de 752 testes passam; a falha está em `App.test.tsx`, cujo teste de descrição não esperava a mensagem de voo sem leituras (efeito do ajuste 4).

### 2.2 Testar (rodada)

- `App.test.tsx`: o teste de descrição ganhou leituras no fake. Teste novo para o voo sem leituras, com a mensagem na descrição.
- `flight-detail-page.test.tsx`: testes novos para a legenda do mapa, para o `aria-describedby` sem leituras e para o carregando e o erro sem a mensagem.
- Imports das constantes passados para `components/limites-de-tempo` nos testes dos hooks. As reexportações dos hooks ficaram sem uso e foram removidas pelo orquestrador; era um defeito criado pela própria rodada.
- Resultado: 38 arquivos e 756 testes passando; lint e tsc das 3 configs limpos. O foco visível e o contraste não são testáveis no jsdom e ficam para a revisão e o teste manual.

### 3. Revisão curta (rodada)

- Arquitetura: aprovado, sem bloqueantes. Os itens 1 a 3 da 3.4 foram resolvidos (constantes em `components/limites-de-tempo.ts`, nenhum hook importa de `pages/`). Falta escrever em code_conventions.md:
  - hook de uma tela só fica em `pages/<tela>/`;
  - hooks não importam de `pages/`;
  - onde ficam as constantes compartilhadas.
- Usabilidade: o bloqueante do foco foi resolvido, sem bloqueante novo. Não bloqueantes vindos dos próprios ajustes:
  1. O trecho voado e o restante agora têm luminância parecida (cerca de 1,3:1). Só o tracejado e a espessura os separam, e uma falha de dados no trecho restante pode se confundir com o intervalo do tracejado.
  2. A mensagem de voo sem leituras entra no `aria-describedby` depois que o botão já tem o foco (o foco vai na montagem, durante o carregamento). Por isso o NVDA pode não anunciá-la; uma região `role="status"` resolveria.

### Correção dos efeitos dos ajustes (rodada)

- Trajetória:
  - o restante virou pontilhado de 2 px (`2 6`, pontas `round`), com 3,61:1 sobre o fundo;
  - o voado é contínuo, com 4 px e 4,66:1;
  - os dois usam `vector-effect: non-scaling-stroke`, para as medidas valerem em px de tela. Sem isso, o viewBox 1000×700 afinaria o pontilhado para cerca de 1 px. Esse último ajuste foi feito pelo orquestrador.
- O parágrafo "Nenhuma leitura gravada neste voo." ganhou `role="status"`, e o `aria-describedby` foi mantido.
- Verificações: 756 testes passando e lint limpo.
- Testes: 5 novos sobre o `role="status"` do voo sem leituras, com e sem leituras. Resultado: 761 testes passando; lint e tsc limpos. O tester rodou o Prettier sem config por engano e reformatou o arquivo de volta no estilo do projeto (aspas simples, sem ponto e vírgula). Sobraram só diferenças de quebra de linha em `flight-detail-page.test.tsx`.

## 4. Documentação

- 4.1 Produto:
  - use_cases.md: UC-005 reescrito (fluxos A a G, CA-005-1 a 14 com a exceção do HITL-2, os textos aprovados, status "Em andamento"); UC-004 sem a tela provisória; o UC-003 aponta para o CA-005-1;
  - business_rules.md: RN-003, 004 e 007 ganharam o UC-005; RN-007 ganhou a prioridade de N/A e as sessões antigas; RN-008 "Fidelidade aos dados gravados" criada;
  - glossary.md: 8 termos novos e 3 atualizados.
- 4.2 Engenharia:
  - domain_model.md: `SerieDeLeituras` e `LeiturasDoVoo`, o índice, o corte implementado e o `timestamp` por ciclo;
  - architecture.md: canal `session:get-readings`, Diretrizes, revisão da ADR-010, ADR-011 "Carga e exibição do debriefing" e "Em aberto" (desempenho no Windows, `BETWEEN` em texto ISO, instrumentação);
  - code_conventions.md:
    - regras de pastas (`pages/<tela>/`, `hooks/` e constantes em `components/`);
    - padrão de SVG acessível;
    - `.visualmente-oculto`;
    - formatadores, `timeZone` e reprodução;
    - "Em aberto" com os débitos da 3.2 e as exportações de medição de `use-dados-do-voo`.
- 4.3 ADLC:
  - resumo no modelo, no topo deste arquivo;
  - lições LL-024 a LL-028;
  - backlog: item 5 em andamento, débitos nos itens 8, 9 e 10, itens novos 11 (gravar "no solo"), 12 (débito do código do debriefing) e 13 (maximizar seções do debriefing).
- 4.4 UX:
  - design.md: exceção do painel escuro, "Cores do debriefing" com contrastes, "Componentes do debriefing", "Tela: debriefing" unificada, janelas menores e "Em aberto";
  - usability.md: exceções aos princípios, foco ao abrir, teclado, "Leitor de tela no debriefing", tabela de textos do UC-005, conferências com o NVDA e as 3 perguntas de diretriz pendentes.
- Para o HITL-4: a legenda diz "Tracejado: restante", mas o restante virou pontilhado na rodada curta.
