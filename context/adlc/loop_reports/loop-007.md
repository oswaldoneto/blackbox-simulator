# Loop 007

Loop: 007
Data de início: 2026-11-17
Item do backlog: 6 — Gráficos de linha no painel
Caso de uso: UC-002
Fase atual: concluído

## Resumo (modelo de loop_report.md)

Loop: 007
Data: 2026-11-17
Item do backlog: 6 — Gráficos de linha no painel (UC-002)

Plano:
- 1.1: critérios CA-002-1 a 19 (6 revistos ou mantidos e 13 novos) e 16 perguntas. As 16 recomendações foram aceitas: 14 na opção (a) e a 12 (legenda) e a 15 (escurecer laranja e cinza até 3:1) na (b), como recomendado. Ficaram fora (item 10 ou itens novos): foco num parâmetro com "Reduzir", títulos dos grupos, rolagem abaixo de 900 px, seletor de janela e carga do histórico pelo banco.
- 1.2: sem mudança no main, no IPC, no preload ou no banco. A janela de 2 minutos fica no `useLiveReadings`, no topo do `App`; o "agora" é o último pacote, com relógio só no sem sinal; funções puras em `components/` (janela, configuração, escala, desenho, textos acessíveis); `caminho-svg`, `segmentarPorFalhas` e os sinais de arfagem e rolagem sobem do debriefing para `components/`; tokens de cor das linhas e das áreas com o contraste medido. HITL-1 aprovou T1 a T11 na opção (a), exceto T6 (b): o texto do rumo pelo norte usa o menor arco.

O que foi feito:
- As 14 tarefas, conforme o protótipo "Painel de tempo real (gráficos de linha, 2 min)": gráfico de linha com área em cada card, limites da escala embaixo, uma cor por grupo, linha cinza no sem sinal, caixa tracejada no card N/A e legenda "Gráficos: últimos 2 minutos. A ponta direita da linha é o valor atual.".
- Rodada curta do HITL-3: ponto isolado e ponta da linha inteiros na borda direita (`overflow: visible` com `clip-path: inset(-3px -3px -3px 0)`); áreas do laranja e do cinza mais claras (3,09 e 3,07:1 contra a área); teste próprio de `sinal-de-exibicao` e sem o `describe` repetido; altura de 84 px na variável `--altura-grafico-painel`.

Testes:
- 46 arquivos e 917 testes passando ao fim da rodada curta; lint e tsc das 3 configs limpos. CA-002-1 a 19 cobertos; 99,91 % das linhas nos arquivos do loop.
- Ficam para o teste manual no Windows: atraso real do valor e do gráfico, aparência e cor efetiva, contraste medido, `clip-path` no Electron, NVDA e 10 minutos de desempenho.

Revisão e decisões:
- 3.1, 3.2, 3.3 e 3.4 aprovadas, sem bloqueantes.
- HITL-2: o "agora" congelado perdido na troca de tela e o ponto antigo de uma série que some viram débito do item 12; os limites da escala de zero no centro ficam visíveis antes da 1ª leitura.
- HITL-3: rodada curta única com os ajustes listados acima; `use-agora-do-painel.ts` fica em `components/`, com a regra registrada; os pacotes fora de ordem vão para o débito do item 12; os demais não bloqueantes viraram débito (itens 10 e 12). A revisão curta (usabilidade e qualidade) aprovou sem bloqueantes; o ponto cortado à esquerda em x=0 e a margem curta de contraste foram para débito.

Contexto atualizado (fase Documentar, a conferir no HITL-4):
- Produto (4.1): UC-002 reescrito (fluxos B a F, CA-002-1 a 19); UC-004 e UC-006 ajustados; RN-008 "Fidelidade aos dados", estendida ao painel; RN-007; glossário com "Gráfico de linha do painel".
- Engenharia (4.2): ADR-012 nova, revisão da ADR-007, nota na ADR-010, Diretrizes e "Em aberto"; estado de exibição no domain_model; convenções de pastas, do "agora" e do gráfico SVG.
- UX (4.4): design.md (tokens e contrastes, componente do gráfico, indicador, legenda, "Hierarquia clara", "Em aberto"); usability.md (leitor de tela, textos, exceção de altura, NVDA).
- ADLC (4.3): este resumo, LL-029 a LL-031, LL-024 com a aplicação no loop-007 e backlog (item 6 em andamento, débitos nos itens 10 e 12, nome do 3º grupo corrigido para "motor e configuração").

Lições: LL-029 a LL-031 em lessons_learned.md; reforço da LL-024.

---

Registro detalhado

Referência de interface: o protótipo "Painel de tempo real (gráficos de linha, 2 min)", aprovado antes do loop (https://claude.ai/artifact/J3ykDbrQjy6Gc32oHSudjk). A cópia local da sessão está em /private/tmp/claude-501/-Users-oswaldo-Projects-dio-blackbox-simulator/d138fc2c-c1eb-4747-ae00-ff6a6c5d1de1/scratchpad/proto/project/Painel-graficos.dc.html.

O protótipo traz:
- a mesma grade de 12 cards de hoje, com rótulo e valor atual;
- em cada card, um gráfico de linha com área clara dos últimos 2 minutos e os valores mínimo e máximo da escala embaixo;
- escala fixa para o rumo (0–360°) e para manete, mistura e flapes (0–100 %);
- zero no centro para a velocidade vertical, a arfagem e a rolagem;
- escala automática com folga mínima nos demais;
- uma cor por grupo: azul para voo, laranja para atitude e posição, verde para motor e comandos;
- o card N/A sem gráfico ("A aeronave não possui este item");
- sem sinal: a linha fica cinza e o valor vira "—".

Decisões tomadas antes do loop: a janela é fixa em 2 minutos, sem seletor. O renderer guarda em memória as leituras recentes para desenhar as linhas.

---
HITL-1 aprovado em 2026-11-17: as decisões T1 a T11 na opção recomendada (a), exceto T6 (b); sem riscos novos.
HITL-2 aprovado em 2026-11-17: os 2 débitos (o "agora" congelado se perde na troca de tela; o ponto antigo de uma série que some) vão para o item 12. Os limites da escala de zero no centro ficam visíveis antes da 1ª leitura.
HITL-3 retorno, em rodada curta única (2026-11-17):
- correções: o ponto isolado inteiro na borda direita; margem de contraste nas áreas do laranja e do cinza; teste de `sinal-de-exibicao` ao lado do arquivo e sem o `describe` repetido; altura de 84 px numa variável CSS;
- `use-agora-do-painel.ts` fica em `components/`, com a regra registrada;
- os pacotes fora de ordem vão para o débito do item 12;
- o resto vira débito.
HITL-2 (rodada curta) aprovado em 2026-11-17.
HITL-3 aprovado em 2026-11-17; os demais não bloqueantes viram débito.
HITL-4 aprovado em 2026-11-17.
Loop encerrado em 2026-11-17, por decisão do humano, antes do teste manual no Windows. O roteiro (atraso do valor e do gráfico, aparência dos 12 gráficos e do ponto isolado, contraste medido, NVDA, 10 min de desempenho, rolagem a 4 colunas e a 640×480) fica pendente.

## 1.1 Especificação de negócio

### Critérios de aceite propostos ([Pn] = depende da pergunta n)

Os critérios atuais do UC-002 passam a ser numerados como CA-002-1 a 6.

- CA-002-1: o painel aparece sozinho quando a sessão fica ativa. Sem mudança.
- CA-002-2: o valor e o gráfico se atualizam a cada leitura (1 s), com atraso de no máximo 2 s. Revisto.
- CA-002-3: sem sessão, aparece a orientação. Sem mudança.
- CA-002-4: na sessão encerrada, os valores e os gráficos ficam congelados [P3]. Com a conexão caída, os valores ficam "—" e a linha fica cinza. Revisto.
- CA-002-5: sem sinal, os valores viram "—", a linha fica cinza e nenhum ponto é inventado [P1]. Quando o sinal volta, a falha continua visível até sair da janela. Revisto.
- CA-002-6: N/A continua "N/A". Sem mudança.

Critérios novos:
- CA-002-7: cada card aplicável tem um gráfico de linha com área clara dos últimos 2 minutos, a leitura mais recente na borda direita e os limites da escala embaixo [P11]. A janela é fixa, e o valor atual continua mais destacado que o gráfico.
- CA-002-8: escalas.
  - fixa: rumo de 0 a 360°; manete, mistura e flapes de 0 a 100 %;
  - zero no centro: VS, arfagem e rolagem;
  - automática, com folga e amplitude mínima: altitude, IAS, latitude, longitude e RPM [P5].
- CA-002-9: com valor constante, a linha fica reta no meio da escala, que nunca tem amplitude zero.
- CA-002-10: fora da escala fixa, a linha para no limite e o número mostra o valor real [P6].
- CA-002-11: na passagem do rumo de 359° para 000°, a linha é interrompida [P7].
- CA-002-12: 2 s ou mais entre duas leituras interrompem a linha [P2].
- CA-002-13: uma cor por grupo (azul, laranja e verde); o rótulo continua identificando o parâmetro.
- CA-002-14: com menos de 2 minutos, o eixo continua com 2 minutos, a linha fica à direita e uma única leitura aparece como ponto [P4].
- CA-002-15: uma nova sessão zera os gráficos; a reconexão na mesma sessão mantém a linha, com a falha.
- CA-002-16: ao trocar de tela e voltar, os gráficos mantêm os últimos 2 minutos [P8].
- CA-002-17: ao reabrir o app, os gráficos começam vazios a partir da confirmação da sessão [P9].
- CA-002-18: o card N/A mostra "N/A" com a unidade, sem gráfico, com "A aeronave não possui este item" e o rótulo acessível "<rótulo>: não aplicável".
- CA-002-19: no leitor de tela, o desenho fica oculto e o grupo lê "<rótulo>: <valor> <unidade>; últimos 2 minutos: de <mín> a <máx> <unidade>" [P10]. Não há `aria-live`.

### Regras

- RN-001, 002, 003 (a nova sessão zera os gráficos), 004 (congelamento; o painel não corta a espera de 15 s [P3]), 006 e 007 (o card N/A não tem gráfico).
- RN-008: estender ao UC-002 ou criar a RN-009 [P13].

### Glossário

- Termo novo: "Gráfico de linha do painel".
- Termos a revisar: Painel de tempo real, Sem sinal, Sessão encerrada e N/A.
- O 3º grupo tem dois nomes: "motor e configuração" em design.md e "motor e comandos" no backlog [P14].

### Impactos

- UC-002: passo novo; fluxos B e C revistos; fluxos novos D (sessão e reconexão), E (troca de tela) e F (reabertura); CA-002-1 a 19; "Fora do escopo" com o seletor, a carga pelo banco e o item 10.
- UC-006 e o CA-006-4: o card N/A não tem gráfico.
- UC-004 e o CA-004-4: os gráficos são mantidos.
- business_rules.md: RN-007 e RN-008 ou RN-009.
- glossary.md: os termos acima.
- design.md e usability.md: o componente do gráfico, os textos e os rótulos.
- Divergências do protótipo que não mudam o contexto:
  - "Sem conexão" nos 2 s sem leitura;
  - `role="status"` em "Sessão encerrada";
  - fonte do Google Fonts;
  - "000" como limite superior do rumo;
  - "0" na IAS com escala negativa.

### Perguntas (recomendação entre parênteses)

1. Linha no Sem sinal: (a) continua andando, cinza, e a falha cresce à direita; (b) fica parada, como no protótipo. (a)
2. Limite para interromper a linha: (a) 2 s ou mais; (b) ligar sempre; (c) outro. (a)
3. Sessão encerrada: (a) linha congelada na cor do grupo; (b) congelada em cinza. Inclui as leituras da espera de 15 s? (a), incluindo a espera; com a conexão caída, cinza.
4. Início com menos de 2 minutos: (a) eixo fixo, linha à direita e um ponto na primeira leitura; (b) esticar. (a)
5. Amplitudes mínimas: altitude 200 ft, IAS 20 kt, VS ±300 fpm, arfagem ±5°, rolagem ±15°, latitude e longitude 0,01°, RPM 500, com folga de 15 %. (a) aprovar; (b) ajustar. (a), com IAS e RPM nunca abaixo de 0.
6. Reverso da manete: (a) a linha para no 0 e o número mostra o valor real; (b) a escala desce. (a)
7. Rumo: (a) interromper na passagem, com rótulos "000" e "360"; (b) traço vertical; (c) escala contínua. (a)
8. Troca de tela: (a) os gráficos mantêm os 2 minutos; (b) recomeçam. (a)
9. Reabertura: (a) gráficos vazios; (b) carregar do banco. (a)
10. Leitor de tela: (a) "gráfico dos últimos 2 minutos"; (b) mínimo e máximo da janela; (c) nada. (b)
11. Rótulos visíveis: (a) limites da escala; (b) mínimo e máximo das leituras. (a)
12. Legenda: (a) como está; (b) "Gráficos: últimos 2 minutos. A ponta direita da linha é o valor atual."; (c) remover. (b)
13. Regra: (a) estender a RN-008, que passa a se chamar "Fidelidade aos dados"; (b) criar a RN-009. (a)
14. Nome do 3º grupo: (a) "motor e configuração"; (b) "motor e comandos". (a)
15. Contraste das linhas: laranja cerca de 2,5:1, cinza cerca de 2,4:1, verde 3,3:1, azul 4,9:1. (a) aceitar; (b) escurecer o laranja e o cinza até 3:1. (b)
16. Altura dos cards (cerca de 80 px a mais): (a) aceitar, com débito no item 10; (b) reduzir agora. (a)

### Fora deste loop (item 10)

- Focar num parâmetro com "Reduzir".
- Títulos dos grupos.
- Rolagem abaixo de 900 px.
- Débitos das notificações, da lista e da tela do voo.
- Seletor de janela e carga do histórico pelo banco (seriam itens novos).

### Decisões do humano (2026-11-17)

As 16 recomendações foram aceitas, na opção (a) de cada pergunta, exceto na 12 e na 15, que ficaram na (b), como recomendado.

## 1.2 Refinamento técnico

### O que o código atual já garante

- O `useLiveReadings` fica no topo do `App` e o main manda `parameter:readings` em qualquer tela. Por isso a janela sobrevive à troca de tela (P8).
- As leituras da espera de 15 s chegam antes de `session:ended` (P3).
- A sessão em verificação não gera pacote, então os gráficos começam vazios ao reabrir o app (P9).
- O `timestamp` do main e o `Date.now()` do renderer usam o mesmo relógio.
- Não há mudança no IPC, no preload, no main nem no banco.

### Tarefas

1. `limites-de-tempo.ts`: `JANELA_GRAFICO_MS = 120000`, `RELOGIO_SEM_SINAL_MS = 1000` e `MAX_PONTOS_JANELA = 150`.
2. Subir para `components/` o que vem do debriefing:
   - `caminho-svg.ts`;
   - `segmentarPorFalhas` com `PontoNoTempo`, em `segmentar-serie.ts`, com quebra opcional e o padrão inalterado (> 2000 ms);
   - as funções de sinal de arfagem e rolagem.
3. `janela-de-leituras.ts`, pura:
   - `acrescentarPacote` corta pela janela, guardando um ponto anterior, e limita a quantidade;
   - descarta timestamp inválido e pacote fora de ordem;
   - só cria objetos novos nas séries que mudaram.
4. `use-live-readings.ts`, estendido; devolve `{ valores, semDados, janela, valoresDescartados }`.
   - sessão nova zera tudo;
   - desconexão zera os valores e mantém a janela;
   - a reconexão continua a mesma janela, com a falha;
   - a sessão encerrada congela.
5. `use-agora-do-painel.ts`:
   - a função pura `agoraDoPainel` dá o último pacote na sessão ativa, `max(relógio, último)` no sem sinal e o valor congelado na encerrada;
   - o `setInterval` de 1 s roda só no sem sinal.
6. `config-grafico-painel.ts`: grupo e escala por parâmetro, com `PARAMETER_IDS`:
   - rumo fixo 0–360, circular;
   - manete, mistura e flapes fixos 0–100;
   - zero no centro: VS ±300, arfagem ±5, rolagem ±15;
   - automática: altitude 200, IAS 20 (piso 0), latitude e longitude 0,01, RPM 500 (piso 0).
7. `escala-do-grafico.ts`: folga de 15 %, amplitude mínima, piso 0 e `valorNoGrafico`, com o sinal de exibição e o rumo em módulo 360.
8. `desenho-do-grafico.ts`:
   - eixo de 2 min a partir do "agora", no viewBox 1000×100;
   - a linha para no limite da escala;
   - segmentos quebram a partir de 2000 ms ou em variação do rumo acima de 180°;
   - áreas, pontos isolados e limites formatados (o rumo usa "360");
   - mínimo e máximo da janela.
9. `texto-do-indicador.ts`: os textos acessíveis do CA-002-18 e do CA-002-19.
10. `grafico-do-painel.tsx`:
    - SVG com `aria-hidden`, 64 px de altura e `non-scaling-stroke`;
    - classes por grupo e `--sem-sinal`, em CSS de arquivo;
    - limites em HTML abaixo, com `aria-hidden`;
    - `useMemo`.
11. `parameter-indicator.tsx`: props `pontos`, `agora` e `linhaCinza`; gráfico abaixo do valor; o N/A ganha uma caixa tracejada com "A aeronave não possui este item" e a mesma altura; `aria-label` da tarefa 9.
12. `realtime-panel.tsx` e `.css`:
    - `janela`, `valoresDescartados` e `agora`;
    - `linhaCinza` no sem sinal, ou na encerrada com os valores descartados;
    - legenda "Gráficos: últimos 2 minutos. A ponta direita da linha é o valor atual.";
    - padding de 16 px, como em design.md.
13. `App.tsx`: repassa `janela` e `valoresDescartados`.
14. Tokens:
    - `color-chart-1/2/3`, com o `color-chart-2` trocado para #EB6200 (cerca de 3,3:1);
    - `color-chart-no-signal` #8D8D8D (cerca de 3,3:1);
    - 4 tokens de área;
    - medir o contraste contra o branco e contra a área.

### Testes

- `janela-de-leituras`, `use-live-readings` (sessão, desconexão, reconexão, encerrada, reabertura), `escala-do-grafico`, `desenho-do-grafico` (eixo, ponto isolado, limite, rumo, 1999/2000 ms, sem sinal, rótulos), `segmentar-serie` (com a regressão do debriefing), `texto-do-indicador`, `use-agora-do-painel` com fake timers, `parameter-indicator`, `realtime-panel` e `App` (troca de tela e sessão nova).
- Manual no Windows:
  - atraso do valor e do gráfico;
  - aparência;
  - contraste medido;
  - NVDA;
  - 10 min de desempenho.

### Riscos

- Desempenho: baixo, cerca de 1.500 pontos/s.
- O ponto isolado fica quase invisível com 1,75 px.
- Um ajuste do relógio do sistema faz a linha saltar.
- O `aria-label` muda a cada segundo.
- Laranja e verde ficam no limite contra a área.
- O antimeridiano estica a escala.
- Mexer em arquivos do debriefing pode causar regressão.
- IAS ou RPM constantes em 0 não ficam no meio da escala.

### Perguntas técnicas do HITL-1 (recomendação entre parênteses)

- T1. "Agora": (a) o último pacote, com relógio só no sem sinal; (b) relógio sempre ligado. (a)
- T2. Janela: (a) estender `useLiveReadings`; (b) hook novo. (a)
- T3. Reaproveitar o debriefing: (a) subir para `components/`; (b) duplicar. (a)
- T4. Rolagem: (a) direita para cima, "15,0 E" embaixo e "15,0 D" em cima; (b) o contrário. (a)
- T5. Piso 0: (a) subir a faixa mantendo a amplitude; IAS em 0 fica no fundo; (b) cortar. (a)
- T6. Texto do rumo passando pelo norte: (a) mínimo e máximo numéricos; (b) o menor arco ("de 350 a 010"). (b)
- T7. Texto: (a) janela vazia omite os 2 minutos; sem sinal com leituras lê "sem sinal; últimos 2 minutos: …"; (b) só "sem sinal". (a)
- T8. Limites da escala automática antes da 1ª leitura: (a) escondidos; (b) "—". (a)
- T9. Registro: (a) ADR-012 nova, com revisão na ADR-007 e nota na ADR-010; (b) só revisar a ADR-007. (a)
- T10. Ponto isolado: (a) traço de 4 px com ponta redonda; (b) 1,75 px. (a)
- T11. Cores: (a) reaproveitar `color-chart`, trocar o 2 para #EB6200, criar o no-signal e as áreas, com medição; (b) tokens só do painel. (a)

### Impactos no contexto de engenharia

- architecture.md: Diretrizes (janela e "agora"), ADR-012, nota na ADR-010 e "Em aberto" (relógio e antimeridiano).
- domain_model.md: o pacote também alimenta a janela; o estado de exibição.
- code_conventions.md: arquivos que subiram para `components/`, o padrão do "agora", o padrão de gráfico SVG e o lugar do hook usado por um componente.

## 2.1 Implementar

As 14 tarefas foram feitas, sem mexer no main, no IPC ou no banco, e sem commit.

- `limites-de-tempo.ts`: constantes da janela, do relógio e do máximo de pontos.
- Subiram do debriefing para `components/`:
  - `caminho-svg.ts`, com `git mv`;
  - `segmentar-serie.ts`, com quebra opcional e o padrão inalterado;
  - `sinal-de-exibicao.ts`.
  - O debriefing só teve os imports trocados, e os testes dele passam.
- Arquivos novos em `components/`:
  - `janela-de-leituras.ts`;
  - `use-agora-do-painel.ts`: o hook ficou em `components/`, ao lado do único componente que o usa;
  - `config-grafico-painel.ts`, `escala-do-grafico.ts`, `desenho-do-grafico.ts` (com `menorArcoDoRumo`) e `texto-do-indicador.ts`;
  - `grafico-do-painel.tsx` e `.css`.
- `use-live-readings.ts`: devolve `janela` e `valoresDescartados`.
- `parameter-indicator.tsx`: gráfico, caixa N/A de 84 px e `aria-label` novo.
- `realtime-panel.tsx` e `.css`: legenda, `linhaCinza` e card com padding de 16 px.
- `App.tsx`: repassa a janela.
- Tokens:
  - `--color-chart-2` passou para #EB6200;
  - novos `--color-chart-no-signal` #8D8D8D, `-1-fill` #E5EDFF, `-2-fill` #FFF0E5, `-3-fill` #ECF8EF (clareado) e `-no-signal-fill` #F2F4F7.
- Contrastes contra o branco e contra a área:
  - azul 5,00 e 4,26;
  - laranja 3,34 e 3,00;
  - verde 3,35 e 3,07;
  - cinza 3,32 e 3,01.
- Verificações: lint e tsc limpos. 758 de 761 testes passam; as 3 falhas são testes antigos que esperam o `aria-label` sem a faixa, um único "100" no card da mistura e o retorno antigo do hook.
- Desvios:
  - o `useMemo` do desenho ficou no `ParameterIndicator`;
  - `use-agora-do-painel` ficou em `components/`;
  - o relógio do sem sinal começa com um `setTimeout(0)`;
  - a escala de zero no centro mostra os limites mínimos antes da 1ª leitura; só a automática os esconde.
- Débitos:
  - o "agora" congelado se perde ao trocar de tela, se a sessão encerrou durante o sem sinal;
  - laranja e cinza ficam em 3,0:1 contra a área;
  - uma série que some do pacote guarda um ponto antigo;
  - pacotes fora de ordem ainda trocam os valores.

## 2.2 Testar

- Resultado: 45 arquivos e 915 testes passando (154 novos); lint e tsc das 3 configs limpos. Conferido de novo pelo orquestrador.
- Os 3 testes antigos foram adaptados: o `aria-label` com a faixa, o helper `valorDe` no card da mistura e o retorno novo do hook.
- Testes novos:
  - `janela-de-leituras` e `segmentar-serie`, com a regressão do debriefing;
  - `config-grafico-painel`, `escala-do-grafico`, `desenho-do-grafico` e `texto-do-indicador`;
  - `use-agora-do-painel` com fake timers;
  - adições em `use-live-readings`, `parameter-indicator`, `realtime-panel` e `App`: troca de tela, sessão nova, reconexão, encerrada e reabertura.
- Cobertura: os CA-002-1 a 19 estão cobertos; 99,91 % das linhas nos arquivos do loop. Ficam para o teste manual o atraso real, a cor efetiva, o contraste, o NVDA e o desempenho.
- Defeitos: nenhum. Os testes confirmaram os 2 débitos da 2.1: o "agora" congelado se perde ao trocar de tela se a sessão encerrou no sem sinal; uma série que some guarda um ponto antigo.

## 3. Revisão

### 3.1 Funcionalidade: aprovado

- Bloqueantes: nenhum. Os critérios CA-002-1 a 19 estão atendidos, com evidência, e o debriefing não mudou de comportamento.
- Não bloqueantes:
  1. O "agora" congelado se perde na troca de tela (item 12).
  2. Uma série que some guarda um ponto antigo (item 12).
  3. Pacotes fora de ordem ainda trocam os valores; falta decidir o destino.
  4. O primeiro ponto fica em x=1000 e pode aparecer cortado.
  5. O CA-002-9 só vale ao pé da letra na escala automática: explicitar no UC.
  6. A escala de zero no centro mostra os limites antes da 1ª leitura (HITL-2).
  7. Pendências do teste manual.
  8. O UC-002, o UC-006 e o UC-004 ainda estão na versão antiga (fica para a 4.1).

### 3.2 Qualidade: aprovado

- Bloqueantes: nenhum. Lint limpo, 915 testes passando e tsc das 3 configs limpo; sem `any`; 100 % das linhas nos arquivos novos.
- Não bloqueantes:
  1. `use-agora-do-painel.ts` em `components/` não está previsto na convenção.
  2. `sinal-de-exibicao.ts` sem teste ao lado; os testes ficaram em `escala-instrumentos.test.ts`.
  3. `describe('segmentarPorFalhas')` repetido em `reduzir-pontos.test.ts`.
  4. `caminho-svg.ts` sem teste próprio.
  5. A altura de 84 px está repetida em dois CSS.
  6. Slugs à mão nos testes.
  7. O `tsconfig.json` da raiz não passa no tsc (antigo).
  8. Débitos da 2.1.
  9. Atualizações de design.md e code_conventions.md (fase 4).

### 3.3 Usabilidade: aprovado

- Bloqueantes: nenhum. Linhas com 3:1 ou mais contra o branco; texto com 4,5:1 ou mais; cor não é o único meio; `aria-label` com a faixa; `aria-hidden`; sem `aria-live`; legenda e caixa N/A conformes.
- Não bloqueantes:
  1. Laranja e cinza com 3,00 e 3,01:1 contra a área, sem margem.
  2. A altura dos cards (cerca de 181 px) obriga a rolar a 4 colunas em telas de 720 a 768 px de altura, e quase triplica a rolagem a 640×480.
  3. Os limites da escala Y, em linha embaixo do gráfico, podem ser lidos como eixo de tempo.
  4. A primeira leitura (ponto isolado) aparece cortada ao meio.
  5. Leitura em dobro no card N/A.
  6. Limites em 11 px, fora da escala tipográfica.
  7. `--color-profile-grid` reaproveitado.
  - Para a 4.4: o princípio "Hierarquia clara" (o valor "maior") não descreve mais o componente.

### 3.4 Arquitetura: aprovado

- Bloqueantes: nenhum. Sem mudança no main, no IPC ou no banco; ADRs respeitadas; o sentido das dependências está certo.
- Não bloqueantes:
  1. Falta a regra para o hook de um componente que não é página.
  2. O "agora" congelado no `RealtimePanel` foge do padrão da ADR-010.
  3. O ponto antigo e os valores com pacote fora de ordem.
  4. Tipagem mista de `parametroId`.
  5. Riscos: relógio do sistema, antimeridiano e `aria-label` que muda a cada segundo.
- Impactos:
  - ADR-012 "Gráficos de linha no painel de tempo real";
  - revisão da ADR-007;
  - nota na ADR-010;
  - Diretrizes;
  - "Em aberto".

## Rodada curta (HITL-3)

### 2.1 Implementar (rodada)

1. O desenho do gráfico passou de `overflow: hidden` para `overflow: visible`, com `clip-path: inset(-3px -3px -3px 0)`. O ponto e a ponta da linha ficam inteiros à direita, e o corte continua rente à esquerda. O TS não mudou: a leitura segue em x=1000.
2. As áreas ficaram mais claras:
   - `--color-chart-2-fill` passou de #FFF0E5 para #FFF4ED, e o laranja de 3,00 para 3,09:1;
   - `--color-chart-no-signal-fill` passou de #F2F4F7 para #F5F6F8, e o cinza de 3,01 para 3,07:1.
3. `--altura-grafico-painel: 84px` em global.css, usada nos dois CSS.
- Verificações: lint e tsc limpos; 915 testes passando. O `clip-path` não é testável no jsdom.

### 2.2 Testar (rodada)

- `components/sinal-de-exibicao.test.ts` novo, com 4 testes; os casos de sinal saíram de `escala-instrumentos.test.ts`.
- O `describe('segmentarPorFalhas')` repetido saiu de `reduzir-pontos.test.ts`. Os casos que faltavam (lista vazia, vários trechos, outro limite) foram para `segmentar-serie.test.ts`.
- Resultado: 46 arquivos e 917 testes passando; lint e tsc limpos. O CSS da rodada fica para a conferência manual.

### 3. Revisão curta (rodada)

- Usabilidade: aprovado, sem bloqueantes.
  - O ponto e a ponta da linha aparecem inteiros sem invadir valor, limites ou borda, e os cards seguem alinhados.
  - Contraste de 3,09 e 3,07:1, com margem curta.
  - Débito: o ponto isolado em x=0 (saindo da janela) continua cortado à esquerda.
  - Falta conferir no Electron.
- Qualidade: aprovado, sem bloqueantes. Os itens 2, 3 e 5 da 3.2 foram resolvidos, sem perda de cobertura de `segmentarPorFalhas`; lint, 917 testes e tsc limpos. A troca do verde (`--color-chart-3-fill` para #ECF8EF) é da 2.1 e já estava registrada.

## 4. Documentação

- 4.3 ADLC:
  - resumo no modelo, no topo deste arquivo;
  - lições LL-029 a LL-031, e a LL-024 com a aplicação no loop-007;
  - backlog: item 6 em andamento; débitos de código no item 12 e de UX no item 10; o 3º grupo passa a se chamar "motor e configuração" no item 6;
  - a linha do loop-007 em loop_report.md entra no encerramento.

- 4.1 Produto: use_cases.md (UC-002, UC-004, UC-006), business_rules.md (RN-007, RN-008) e glossary.md.
- 4.2 Engenharia: architecture.md (ADR-012, ADR-007, ADR-010, Diretrizes, "Em aberto"), domain_model.md e code_conventions.md.
- 4.4 UX: design.md e usability.md.
