# Backlog

> Propósito: Funcionalidades em ordem de prioridade, uma por loop.
> Atualizar quando: um loop começar ou terminar, ou a prioridade mudar.
> Relacionados: [../product/use_cases.md](../product/use_cases.md)
> Última atualização: 2026-11-17 · loop-004

## Em andamento

| Número | Nome curto | Caso de uso | Resultado visível ao final |
|--------|-----------|-------------|---------------------------|

## Próximos (em ordem)

| Número | Nome curto | Caso de uso | Resultado visível ao final |
|--------|-----------|-------------|---------------------------|
| 4 | Selecionar voo para debriefing | UC-004 | Piloto acessa lista de voos e seleciona um para revisar |
| 5 | Visualizar dados do debriefing | UC-005 | Piloto revisa parâmetros registrados ao longo do tempo |
| 6 | UX do painel: maximizar card e organizar os grupos | a definir | Piloto foca em um parâmetro do painel e volta à grade pelo botão "Reduzir"; os 3 grupos de cards têm título ou separador, inclusive a 2 colunas; a rolagem dos 12 cards abaixo de 900 px é tratada (débitos de UX do loop-003); as notificações dão tempo de leitura ao erro (ou podem ser fechadas), não cobrem o card do canto superior direito e são anunciadas por leitor de tela numa região viva sempre montada (débitos de UX do loop-004) |
| 8 | Débito técnico: banco e build | — (débito técnico) | No máximo uma sessão ativa garantida no banco (ex.: índice único parcial); testes fora do build (tsconfig.main.json); adaptador de SQLite dos testes num único helper |

## Concluídos

| Número | Nome curto | Caso de uso | Resultado visível ao final |
|--------|-----------|-------------|---------------------------|
| 1 | Iniciar sessão de coleta | UC-001 | Sistema detecta motor ligado e inicia registro de parâmetros |
| 2 | Visualizar parâmetros em tempo real | UC-002 | Painel exibe parâmetros atualizados durante o voo |
| 3 | Encerrar sessão de coleta | UC-003 | Motor parado com a aeronave no solo por 15 s encerra a sessão, grava a hora de fim e mostra "Sessão encerrada. Dados salvos." |
| 7 | Coletar posição, motor e flapes | UC-006 | Painel exibe e grava latitude, longitude, manete, mistura, RPM e flapes, com "N/A" para itens que a aeronave não tem |

## Fora do escopo

<!-- a preencher -->

## Modelo de item

<!--
Número:
Nome curto:
Caso de uso: UC-NNN
Resultado visível ao final:
-->
