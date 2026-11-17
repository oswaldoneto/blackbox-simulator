# Backlog

> Propósito: Funcionalidades em ordem de prioridade, uma por loop.
> Atualizar quando: um loop começar ou terminar, ou a prioridade mudar.
> Relacionados: [../product/use_cases.md](../product/use_cases.md)
> Última atualização: 2026-11-17 · loop-006 encerrado

## Em andamento

| Número | Nome curto | Caso de uso | Resultado visível ao final |
|--------|-----------|-------------|---------------------------|

## Próximos (em ordem)

| Número | Nome curto | Caso de uso | Resultado visível ao final |
|--------|-----------|-------------|---------------------------|
| 6 | Gráficos de linha no painel | UC-002 | Cada card do painel mostra o valor atual e um gráfico de linha dos últimos 2 minutos (janela fixa, sem seletor), atualizado a cada leitura, com escala fixa para rumo (0–360°) e para manete, mistura e flapes (0–100 %), zero no centro para velocidade vertical, arfagem e rolagem, e uma cor por grupo (voo, atitude e posição, motor e comandos), como no protótipo aprovado; o renderer guarda em memória as leituras dos últimos 2 minutos para desenhar as linhas |
| 10 | UX do painel e da lista de voos | UC-002, UC-004 | Piloto foca em um parâmetro do painel e volta à grade pelo botão "Reduzir"; os 3 grupos de cards têm título ou separador, inclusive a 2 colunas; a rolagem dos 12 cards abaixo de 900 px é tratada (débitos de UX do loop-003); as notificações dão tempo de leitura ao erro (ou podem ser fechadas), não cobrem o card do canto superior direito e são anunciadas por leitor de tela numa região viva sempre montada (débitos de UX do loop-004); na lista de voos, o estado vazio é anunciado por leitor de tela, o foco não cai no `body` ao voltar do voo enquanto a lista recarrega, e a borda do card do voo tem contraste suficiente (débitos de UX do loop-005); na lista de voos: retorno visual ao clicar na seção atual, "—" em color-text-secondary e alinhamento único dos estados (débitos de UX do loop-005); na tela do voo (debriefing): sem leitura em dobro nos grupos dos instrumentos, alvos de 44 px nos botões de velocidade e no polegar da linha do tempo, tamanhos de fonte dentro da escala nos SVG (hoje 11 e 13 px, e cerca de 7 a 8,5 px efetivos), unidade consistente em N/A e "—" (some nos instrumentos e no perfil, fica na trajetória e no painel), reprodução que não sai da vista com a rolagem, instrumentos sem "—" em 0:00:00 (a primeira leitura chega até 1 s depois do início) e tokens novos (`--color-panel-*`, `--color-track-*`, `--color-profile-*`) registrados em design.md (débitos de UX do loop-006) |
| 8 | Débito técnico: banco e build | — (débito técnico) | No máximo uma sessão ativa garantida no banco (ex.: índice único parcial); testes fora do build (tsconfig.main.json); adaptador de SQLite dos testes num único helper; consulta da lista de voos com índice e, se o volume pedir, paginação (débito do loop-005); carga do debriefing sem bloquear o main em voos longos, se a medição no Windows apontar atraso (better-sqlite3 síncrono, incluindo agrupamento e serialização), e retirada da instrumentação de medição (`console.info` no handler e `performance.measure('debriefing:primeiro-desenho')`) depois do teste no Windows (débitos do loop-006) |
| 9 | Gravar aeronave e aeródromos | a definir | O voo passa a registrar a aeronave (e, se possível, aeródromos de origem e destino), exibidos na lista de voos. As faixas de cor de velocidade e RPM por aeronave no debriefing dependem deste item (ficaram fora do loop-006, decisão P2) |
| 11 | Gravar "no solo" como leitura | a definir (UC-006 ou caso de uso novo) | O voo passa a gravar se a aeronave está no solo, e o debriefing mostra marcadores de decolagem e pouso na linha do tempo (e, se fizer sentido, a pista no mapa); ficou fora do loop-006, decisão P3 |
| 12 | Débito técnico: código do debriefing | — (débito técnico) | h1 oculto do painel com a classe `.visualmente-oculto` em vez de estilo inline; `duracaoEmSegundos` sem duplicação; `parametroId` tipado como `ParametroId` em vez de `string`; sem o reajuste de estado redundante em `useDadosDoVoo` (o `key` já remonta a tela); resposta com outro `sessaoId` tratada sem deixar a tela carregando para sempre (débitos do loop-006) |
| 13 | Maximizar seções do debriefing | UC-005 | Piloto maximiza uma seção da tela do voo (mapa, instrumentos ou perfil) e volta ao layout normal; ficou fora do loop-006, decisão P13 |

## Concluídos

| Número | Nome curto | Caso de uso | Resultado visível ao final |
|--------|-----------|-------------|---------------------------|
| 1 | Iniciar sessão de coleta | UC-001 | Sistema detecta motor ligado e inicia registro de parâmetros |
| 2 | Visualizar parâmetros em tempo real | UC-002 | Painel exibe parâmetros atualizados durante o voo |
| 3 | Encerrar sessão de coleta | UC-003 | Motor parado com a aeronave no solo por 15 s encerra a sessão, grava a hora de fim e mostra "Sessão encerrada. Dados salvos." |
| 4 | Selecionar voo para debriefing | UC-004 | Botões "Painel" e "Voos" na barra superior; a lista mostra os voos encerrados (data, hora de início e duração, do mais recente ao mais antigo) e um clique abre a tela provisória do voo com "Debriefing disponível em breve" |
| 7 | Coletar posição, motor e flapes | UC-006 | Painel exibe e grava latitude, longitude, manete, mistura, RPM e flapes, com "N/A" para itens que a aeronave não tem |
| 5 | Visualizar dados do debriefing | UC-005 | Tela do voo com reprodução (1×/4×/16× e linha do tempo), trajetória no mapa, painel de instrumentos e perfil vertical, só com valores gravados ("—", "N/A" e "Sem dados neste voo") |

## Fora do escopo

<!-- a preencher -->

## Modelo de item

<!--
Número:
Nome curto:
Caso de uso: UC-NNN
Resultado visível ao final:
-->
