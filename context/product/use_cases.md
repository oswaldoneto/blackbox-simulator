# Casos de uso

> Propósito: Funcionalidades a desenvolver, com os critérios de aceite que guiam os testes e definem quando está pronto.
> Atualizar quando: um caso de uso for criado, mudar ou tiver os critérios de aceite revistos.
> Relacionados: [business_rules.md](business_rules.md), [glossary.md](glossary.md), [../engineering/domain_model.md](../engineering/domain_model.md)
> Última atualização: 2026-11-17 · loop-007

## Índice

| ID | Nome | Status |
|----|------|--------|
| UC-001 | Iniciar sessão de coleta | Concluído |
| UC-002 | Visualizar parâmetros em tempo real | Concluído |
| UC-003 | Encerrar sessão de coleta | Concluído |
| UC-004 | Selecionar voo para debriefing | Concluído |
| UC-005 | Visualizar dados do debriefing | Concluído |
| UC-006 | Coletar posição, motor e flapes | Concluído |

Status: "Em aberto" (não iniciado), "Em andamento" (loop aberto ou validação manual pendente), "Concluído" (loop encerrado).

## Casos de uso

---

UC-001
Nome: Iniciar sessão de coleta
Ator: Piloto
Objetivo: Registrar automaticamente o início de uma sessão quando o motor da aeronave é ligado no simulador.
Pré-condições: Blackbox Simulator está em execução na mesma máquina que o simulador de voo.
Fluxo principal:
  1. O piloto liga o motor da aeronave no simulador.
  2. O sistema detecta o evento de motor ligado.
  3. O sistema cria uma nova sessão e inicia a coleta dos parâmetros do conjunto de parâmetros.
Fluxos alternativos:
  A. Motor já estava ligado ao iniciar o Blackbox Simulator: o sistema cria a sessão e inicia a coleta a partir daquele momento.
Regras aplicadas: RN-001, RN-002, RN-003
Critérios de aceite:
  - Dado que o Blackbox Simulator está em execução, quando o piloto liga o motor no simulador, então o sistema inicia uma nova sessão e começa a registrar os parâmetros do conjunto de parâmetros.
  - Dado que o motor já está ligado ao iniciar o Blackbox Simulator, quando o sistema é iniciado, então uma sessão é criada e a coleta começa imediatamente.
  - Dado que o simulador não está em execução na mesma máquina, quando o Blackbox Simulator tenta detectar o evento de motor, então o sistema tenta reconectar silenciosamente a cada 5 segundos sem bloquear a aplicação.

---

UC-002
Nome: Visualizar parâmetros em tempo real
Ator: Piloto
Objetivo: Acompanhar os parâmetros de voo no painel de tempo real, na janela do Blackbox Simulator, enquanto o voo está em andamento: o valor atual de cada parâmetro e o gráfico de linha dos últimos 2 minutos.
Pré-condições: O Blackbox Simulator está em execução. O painel de tempo real exige uma sessão de coleta ativa (UC-001 foi concluído).
Fluxo principal:
  1. Quando a sessão fica ativa, o sistema exibe sozinho o painel de tempo real na área principal da própria janela do app, sem ação do piloto e sem segunda janela.
  2. O painel mostra o valor atual de cada um dos 12 parâmetros do conjunto de parâmetros (ver product.md).
  3. Em cada card aplicável, abaixo do valor, o painel mostra o gráfico de linha do painel com as leituras dos últimos 2 minutos: linha com área clara, a leitura mais recente na borda direita e os limites da escala embaixo. A janela é fixa em 2 minutos, sem seletor, e o valor atual continua mais destacado que o gráfico. O painel exibe a legenda "Gráficos: últimos 2 minutos. A ponta direita da linha é o valor atual."
  4. A cada 1 s, mesma cadência da coleta, o painel atualiza os valores e os gráficos com a leitura do simulador, enquanto a sessão está ativa. Nenhum ponto é inventado (RN-008).
Fluxos alternativos:
  A. Sem sessão ativa: no lugar do painel, o sistema exibe a orientação "Inicie o simulador e ligue o motor para começar".
  B. Sessão encerrada: o painel mantém os últimos valores e os gráficos congelados, na cor do grupo, e exibe o aviso "Sessão encerrada". Os gráficos incluem as leituras da espera de 15 s do encerramento (o painel não corta essa espera, ao contrário do debriefing). Ocorre quando a sessão encerra pelo UC-003 (RN-004), inclusive quando a gravação do encerramento falha, e dura até o motor ser religado (nova sessão) ou o app ser fechado; ao reabrir o app, aparece a orientação do fluxo A. Se a sessão encerrar com a conexão caída, os valores congelados ficam como "—", porque não há valor confiável para manter (decisão do HITL-4 do loop-002), e a linha dos gráficos fica cinza. Parâmetros N/A continuam "N/A" (RN-007).
  C. Sem sinal durante a sessão (conexão com o simulador perdida, ou 2 s sem leitura nova com a conexão aberta): os valores viram "—", o painel exibe o aviso "Sem sinal do simulador" e a linha dos gráficos fica cinza e continua andando: a falha cresce à direita e nenhum ponto é inventado (RN-008). Quando as leituras voltam, os valores voltam, o aviso some, a linha volta à cor do grupo e a falha continua visível até sair da janela de 2 minutos. Parâmetros N/A continuam "N/A", porque N/A tem prioridade sobre "—" (RN-007).
  D. Nova sessão e reconexão: uma nova sessão (motor religado, RN-003) zera os gráficos. A reconexão com o simulador na mesma sessão mantém a linha, com a falha do período sem sinal.
  E. Troca de tela: ao abrir a lista de voos ou a tela do voo e voltar ao painel, os gráficos mantêm os últimos 2 minutos, porque as leituras continuam chegando em qualquer tela.
  F. Reabertura do app: os gráficos começam vazios a partir da confirmação da sessão (UC-003, fluxo D); o histórico gravado no banco não é carregado no painel.
Fora do escopo deste caso de uso: seletor de janela dos gráficos e carga do histórico pelo banco (seriam itens novos do backlog); os itens do item 10 do backlog (focar num parâmetro com "Reduzir", títulos dos grupos, rolagem abaixo de 900 px de altura e os débitos das notificações, da lista e da tela do voo).
Regras aplicadas: RN-001, RN-002, RN-003, RN-004, RN-006, RN-007, RN-008
Critérios de aceite (CA-002-1 a CA-002-6 numerados e CA-002-7 a CA-002-19 criados no loop-007; aprovados no HITL-1 do loop-007):
  - CA-002-1: Dado que uma sessão fica ativa, quando o Blackbox Simulator está aberto, então o painel de tempo real aparece sozinho na área principal da janela do app, sem ação do piloto, com os parâmetros do conjunto de parâmetros.
  - CA-002-2: Dado que o painel está exibido, quando uma nova leitura chega do simulador, então o valor e o gráfico são atualizados a cada 1 s, com atraso máximo de 2 s entre o simulador e o painel, sem enviar comandos nem alterar o estado do simulador.
  - CA-002-3: Dado que não há sessão ativa, quando o piloto olha a janela do app, então o sistema exibe a orientação "Inicie o simulador e ligue o motor para começar".
  - CA-002-4: Dado que a sessão foi encerrada, quando o painel deixa de receber leituras, então os últimos valores e os gráficos ficam congelados na cor do grupo, incluindo as leituras da espera de 15 s, e o painel exibe o aviso "Sessão encerrada"; se a sessão encerrou com a conexão caída, os valores ficam "—" e a linha fica cinza.
  - CA-002-5: Dado que uma sessão está ativa, quando a conexão com o simulador cai ou passam 2 s sem leitura nova, então os valores viram "—", o painel exibe o aviso "Sem sinal do simulador", a linha fica cinza e continua andando, com a falha crescendo à direita, e nenhum ponto é inventado; quando as leituras voltam, os valores voltam a ser exibidos e a falha continua visível até sair da janela.
  - CA-002-6: Dado que um parâmetro é N/A na sessão (RN-007), quando o sinal é perdido ou a sessão é encerrada, então o card desse parâmetro continua mostrando "N/A", e não "—".
  - CA-002-7: Dado que o painel está exibido, quando o piloto olha um card aplicável, então ele tem um gráfico de linha com área clara dos últimos 2 minutos, a leitura mais recente na borda direita e os limites da escala embaixo; a janela é fixa e o valor atual continua mais destacado que o gráfico.
  - CA-002-8: Dado que o painel está exibido, quando os gráficos são desenhados, então as escalas são: fixa no rumo (0 a 360°) e em manete, mistura e flapes (0 a 100 %); zero no centro na VS, na arfagem e na rolagem; automática, com folga de 15 % e amplitude mínima, na altitude (200 ft), IAS (20 kt), latitude e longitude (0,01°) e RPM (500); a VS, a arfagem e a rolagem têm amplitude mínima de ±300 fpm, ±5° e ±15°; a escala de IAS e RPM nunca desce abaixo de 0.
  - CA-002-9: Dado que um parâmetro com escala automática fica com valor constante, quando o gráfico é desenhado, então a linha fica reta no meio da escala, que nunca tem amplitude zero. Na escala de zero no centro e na fixa, a linha não vai para o meio: o meio é o zero ou a faixa configurada. IAS e RPM constantes em 0 ficam no fundo da escala, porque a escala não desce abaixo de 0.
  - CA-002-10: Dado que um valor sai da escala fixa (por exemplo, a manete com reverso), quando o gráfico é desenhado, então a linha para no limite da escala e o número mostra o valor real.
  - CA-002-11: Dado que o rumo passa de 359° para 000° (ou o contrário), quando o gráfico é desenhado, então a linha é interrompida na passagem; os limites da escala aparecem como "000" e "360".
  - CA-002-12: Dado que passam 2 s ou mais entre duas leituras, quando o gráfico é desenhado, então a linha é interrompida nesse trecho.
  - CA-002-13: Dado que o painel está exibido, quando o piloto olha os gráficos, então há uma cor por grupo (azul para voo, laranja para atitude e posição, verde para motor e configuração), e o rótulo continua identificando o parâmetro.
  - CA-002-14: Dado que a sessão tem menos de 2 minutos de leituras, quando o gráfico é desenhado, então o eixo continua com 2 minutos, a linha fica à direita e uma única leitura aparece como ponto.
  - CA-002-15: Dado que o painel tem gráficos, quando uma nova sessão começa, então os gráficos são zerados; quando a conexão volta na mesma sessão, então a linha é mantida, com a falha.
  - CA-002-16: Dado que uma sessão está ativa, quando o piloto troca de tela e volta ao painel, então os gráficos mantêm os últimos 2 minutos.
  - CA-002-17: Dado que o app foi fechado com uma sessão ativa, quando o app é reaberto e a sessão é confirmada, então os gráficos começam vazios a partir da confirmação.
  - CA-002-18: Dado que um parâmetro é N/A na sessão, quando o card é exibido, então mostra "N/A" com a unidade, sem gráfico, com o texto "A aeronave não possui este item" e o rótulo acessível "<rótulo>: não aplicável".
  - CA-002-19: Dado que o piloto usa leitor de tela, quando chega a um card aplicável, então o desenho do gráfico fica oculto e o grupo é lido como "<rótulo>: <valor> <unidade>; últimos 2 minutos: de <mín> a <máx> <unidade>", com o mínimo e o máximo das leituras da janela; não há anúncio automático (`aria-live`). Com a janela vazia, a parte dos 2 minutos é omitida; no sem sinal com leituras na janela, o grupo lê "sem sinal; últimos 2 minutos: …"; com o rumo passando pelo norte, a faixa é o menor arco (ex.: "de 350 a 010") (HITL-1 do loop-007, T6 e T7).
(Critérios revistos no loop-007: os 6 critérios existentes foram numerados; CA-002-2, CA-002-4 e CA-002-5 passaram a incluir os gráficos.)

---

UC-003
Nome: Encerrar sessão de coleta
Ator: Piloto
Objetivo: Encerrar automaticamente a sessão quando a aeronave está no solo com o motor parado, gravando a hora de fim, para que o voo fique registrado com início, fim e duração.
Pré-condições: Uma sessão de coleta está ativa (UC-001).
Fluxo principal:
  1. Com a aeronave no solo, o piloto desliga o motor no simulador (ou pousa com o motor já parado).
  2. O sistema verifica que as duas condições valem ao mesmo tempo: aeronave no solo e motor parado.
  3. Depois de 15 s seguidos com as duas condições, o sistema encerra a sessão (RN-004).
  4. O sistema grava a hora de fim e o status encerrada. A hora de fim é o início dos 15 s, ou seja, o mais tarde entre o instante em que o motor parou e o instante em que a aeronave tocou o solo. As leituras já foram gravadas a cada 1 s durante a sessão e são preservadas.
  5. Só depois de confirmada a gravação, o sistema exibe a notificação "Sessão encerrada. Dados salvos." e o painel de tempo real mostra os últimos valores congelados com o aviso "Sessão encerrada" (UC-002, fluxo B), até o motor ser religado ou o app ser fechado.
Fluxos alternativos:
  A. Pane em voo: motor parado com a aeronave fora do solo não encerra a sessão. Se a aeronave pousar e ficar 15 s no solo com o motor parado, a sessão encerra com a hora do toque.
  B. Motor volta antes dos 15 s (corte e religamento, motor que tosse): a contagem zera e a sessão continua a mesma. A contagem também zera se a aeronave sair do solo. Se o sistema não souber se a aeronave está no solo, a sessão não encerra.
  C. Queda de conexão com o simulador (simulador fechado ou caído) com sessão ativa: a sessão não encerra; o painel mostra "Sem sinal do simulador" (UC-002, fluxo C). Se a queda acontecer durante a contagem dos 15 s e, ao reconectar, o motor continuar parado e a aeronave no solo, vale o instante original em que as duas condições começaram; se qualquer condição deixou de valer, a contagem zera.
  D. App fechado com sessão ativa: fechar o app não encerra a sessão. Ao abrir o app, a sessão ativa gravada fica em verificação por até 15 s: se o motor estiver ligado nesse prazo, a sessão continua e o sistema exibe "Coleta iniciada"; se o motor estiver parado ou não chegar dado do motor em 15 s, a sessão é encerrada com a hora da última leitura (sem leitura, a hora de início), sem notificação. Durante a verificação, nenhuma leitura é gravada.
  E. Sessões antigas sem encerramento (gravadas pelas versões v0.1.0 a v0.3.0, ou deixadas ativas por falha de gravação): a cada abertura do app, toda sessão ativa exceto a mais recente é encerrada com a hora da última leitura; sem leitura, com a hora de início (duração 0). A mais recente segue o fluxo D.
  F. Religamento após o encerramento: o motor religado abre sempre uma nova sessão (RN-003); a sessão encerrada nunca é reaberta.
  G. Sessão curta (ex.: poucos segundos): fica gravada como qualquer outra (RN-005) e aparece na lista de voos (UC-004). Decidido no loop-005: a lista não oculta nenhum voo, nem os curtos.
  H. Falha ao gravar o encerramento: o sistema registra a falha em log e exibe a notificação de erro "Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura."; o painel mostra a sessão como encerrada; a sessão deixa de ser a sessão em curso (um religamento abre nova sessão) e no banco continua ativa até a próxima abertura do app, que a encerra (fluxos D e E). Falha ao gravar um encerramento feito na abertura do app gera só log, sem aviso na tela; a abertura seguinte tenta de novo.
Observações:
  - Duração do voo = hora de fim − hora de início, incluindo táxi e períodos sem sinal. Exibida em h:mm:ss, horas sem limite (UC-004).
  - As leituras gravadas durante os 15 s de espera ficam no banco, depois da hora de fim; o debriefing corta a exibição na hora de fim (CA-005-1).
Limitações conhecidas (aceitas no HITL-1 e no HITL-3 do loop-004):
  - Sair ao menu do simulador e iniciar outro voo sem cortar o motor: os dois voos ficam na mesma sessão.
  - Fechar o simulador com o motor ligado e carregar outro voo já com o motor ligado: os dois voos ficam na mesma sessão.
Regras aplicadas: RN-003, RN-004, RN-005, RN-006, RN-007
Critérios de aceite:
  - CA-003-1: Dado que uma sessão está ativa, quando a aeronave fica no solo com o motor parado por 15 s seguidos, então a sessão fica com status encerrada e hora de fim gravada, as leituras coletadas continuam gravadas, e só depois da gravação o sistema exibe "Sessão encerrada. Dados salvos." e o painel mostra os últimos valores congelados com o aviso "Sessão encerrada".
  - CA-003-2: Dado que a sessão encerrou, quando a hora de fim é gravada, então ela é o mais tarde entre o instante em que o motor parou e o instante em que a aeronave tocou o solo, e a duração (hora de fim − hora de início) inclui táxi e períodos sem sinal.
  - CA-003-3: Dado que uma sessão está ativa, quando o motor para com a aeronave fora do solo, então a sessão não encerra enquanto a aeronave não estiver no solo com o motor parado por 15 s seguidos.
  - CA-003-4: Dado que o motor parou com a aeronave no solo, quando o motor volta (ou a aeronave sai do solo) antes de 15 s, então a sessão continua a mesma e a contagem recomeça do zero.
  - CA-003-5: Dado que uma sessão está ativa, quando a conexão com o simulador cai, então a sessão não encerra; se a queda ocorre durante a contagem e, ao reconectar, o motor continua parado e a aeronave no solo, a contagem segue a partir do instante original; se alguma condição deixou de valer, a contagem zera.
  - CA-003-6: Dado que uma sessão foi encerrada, quando o piloto religa o motor, então o sistema abre uma nova sessão e a sessão encerrada não é reaberta.
  - CA-003-7: Dado que o app foi fechado com uma sessão ativa, quando o app é aberto e o motor está ligado em até 15 s, então a mesma sessão continua e o sistema exibe "Coleta iniciada"; quando o motor está parado ou não chega dado do motor em 15 s, então a sessão é encerrada com a hora da última leitura (sem leitura, a hora de início), sem notificação.
  - CA-003-8: Dado que existem sessões ativas antigas, quando o app é aberto, então todas, exceto a mais recente, são encerradas com a hora da última leitura (sem leitura, a hora de início, duração 0), e a mais recente segue o CA-003-7.
  - CA-003-9: Dado que uma sessão durou poucos segundos, quando ela encerra, então fica gravada como qualquer outra sessão.
  - CA-003-10: Dado que a gravação do encerramento falha, quando a sessão encerraria, então o sistema registra a falha em log, exibe a notificação de erro "Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura.", as leituras continuam gravadas e a próxima abertura do app conclui o encerramento.
(O antigo critério "a sessão recém-encerrada aparece na lista de voos com data, hora e duração" saiu do UC-003 no loop-004: este caso de uso grava a hora de fim e o status; a exibição na lista é do UC-004, que já tem esse critério.)

---

UC-004
Nome: Selecionar voo para debriefing
Ator: Piloto
Objetivo: Escolher um voo registrado para revisar os dados.
Pré-condições: O Blackbox Simulator está em execução. Não é preciso existir sessão encerrada: sem voos, vale o fluxo A.
Fluxo principal:
  1. O piloto clica em "Voos" na barra superior. Os botões "Painel" e "Voos" ficam sempre visíveis, inclusive durante uma sessão ativa, e a barra de estado continua visível em todas as telas. Com a lista aberta, a coleta continua normalmente (RN-006).
  2. O sistema exibe a lista de voos (título "Voos"): todas as sessões encerradas (RN-004), inclusive curtas, de duração 0 e antigas; a sessão ativa nunca aparece e nenhum voo é ocultado. A ordem é pela hora de início, da mais recente para a mais antiga; empate na hora de início segue a ordem de gravação. Rolagem simples, sem paginação.
  3. Cada voo aparece como um card com a data (dd/mm/aaaa) e a hora de início (HH:mm, 24 h), no fuso local da máquina, e a duração (h:mm:ss, horas sem limite; duração 0 aparece "0:00:00"). A hora de fim e a aeronave não aparecem.
  4. O piloto clica num voo (ou chega a ele com Tab e tecla Enter).
  5. O sistema abre a tela do voo, com o título "Voo de dd/mm/aaaa", a hora de início, a duração e o botão "Voltar à lista" (Esc também volta à lista). O conteúdo do debriefing (carga das leituras, reprodução, trajetória, instrumentos e perfil) é do UC-005.
  6. Para voltar ao painel de tempo real, o piloto clica em "Painel" na barra superior. Com a sessão ativa, o painel mostra os valores ao vivo e os gráficos com os últimos 2 minutos (UC-002, fluxo E).
Fluxos alternativos:
  A. Nenhum voo: a lista exibe "Nenhum voo registrado. Inicie o simulador e ligue o motor para começar." Vale também quando só existe a sessão ativa.
  B. Sessão começa (RN-003) com a lista ou a tela do voo aberta: o sistema mostra o painel de tempo real sozinho, com "Coleta iniciada" (UC-002 inalterado).
  C. Sessão encerra com a lista aberta: a lista atualiza sozinha e o voo novo aparece no topo. O encerramento não troca de tela.
  D. Lista demora mais de 500 ms para carregar: o sistema exibe "Carregando voos...".
  E. Erro ao carregar a lista na primeira carga: o sistema exibe "Não foi possível carregar a lista de voos. Feche e abra o aplicativo para tentar de novo.", sem nova tentativa automática. Se depois uma sessão encerrar e a nova busca der certo, a lista substitui a mensagem (HITL-2 do loop-005).
  F. Falha numa nova busca com a lista já exibida: a lista anterior continua na tela; a falha só vai para o log.
  G. Sessão encerrada em silêncio na abertura do app (UC-003, fluxos D e E): não atualiza a lista já aberta; o voo aparece ao abrir a lista de novo. A sessão de falha de gravação do encerramento (UC-003, fluxo H), ativa no banco até a próxima abertura, só aparece depois de encerrada.
Fora do escopo deste caso de uso: filtro e busca na lista; paginação; aeronave e aeródromos no card (o campo não é gravado hoje; gravá-los em voos futuros virou item do backlog no HITL-1 do loop-005); o conteúdo da tela do voo, inclusive o tratamento das sessões antigas sem os 6 parâmetros novos (UC-005).
Regras aplicadas: RN-003, RN-004, RN-005, RN-006
Critérios de aceite:
  - CA-004-1: Dado que existem sessões encerradas, quando o piloto clica em "Voos", então a lista exibe todas as sessões encerradas (inclusive curtas, de duração 0 e antigas), sem a sessão ativa, ordenadas pela hora de início da mais recente para a mais antiga, cada uma com data dd/mm/aaaa, hora de início HH:mm (24 h) no fuso local da máquina e duração h:mm:ss (ex.: "0:00:00", "25:03:10").
  - CA-004-2: Dado que a lista de voos está exibida, quando o piloto clica num voo (ou o foca com Tab e tecla Enter), então o sistema abre a tela do voo com o título "Voo de dd/mm/aaaa", a hora de início, a duração e o botão "Voltar à lista", com o debriefing do UC-005; clicar em "Voltar à lista" ou teclar Esc volta à lista.
  - CA-004-3: Dado que não existe sessão encerrada (inclusive quando só existe a sessão ativa), quando o piloto clica em "Voos", então o sistema exibe "Nenhum voo registrado. Inicie o simulador e ligue o motor para começar."
  - CA-004-4: Dado que uma sessão está ativa, quando o piloto abre a lista de voos e volta pelo botão "Painel", então a barra superior e a barra de estado ficaram visíveis o tempo todo, a sessão ativa não apareceu na lista, a coleta continuou e o painel mostra os valores ao vivo e os gráficos com os últimos 2 minutos (CA-002-16).
  - CA-004-5: Dado que a lista de voos ou a tela do voo está aberta, quando uma sessão começa, então o sistema mostra o painel de tempo real sozinho, com "Coleta iniciada".
  - CA-004-6: Dado que a lista de voos está aberta, quando uma sessão encerra, então a lista atualiza sozinha com o voo novo no topo, sem trocar de tela.
  - CA-004-7: Dado que o piloto abre a lista de voos, quando a primeira carga falha, então o sistema exibe "Não foi possível carregar a lista de voos. Feche e abra o aplicativo para tentar de novo." sem nova tentativa automática; quando uma nova busca falha com a lista já exibida, então a lista anterior continua na tela.
  - CA-004-8: Dado que o piloto abre a lista de voos, quando a carga demora mais de 500 ms, então o sistema exibe "Carregando voos..." até a lista (ou o erro) aparecer.
(Critérios revistos no loop-005: o antigo "todas as sessões" virou só as encerradas; a seleção abre a tela provisória do voo, sem carregar dados, até o UC-005; o estado vazio ganhou texto oficial. Revisto no loop-006: a tela do voo deixou de ser provisória e o aviso "Debriefing disponível em breve" saiu. Revisto no loop-007: o CA-004-4 passou a incluir os gráficos dos últimos 2 minutos.)

---

UC-005
Nome: Visualizar dados do debriefing
Ator: Piloto
Objetivo: Revisar, na tela do voo, os 12 parâmetros gravados de um voo encerrado, instante a instante, com reprodução, trajetória, painel de instrumentos e perfil vertical, para identificar pontos de melhoria.
Pré-condições: O piloto selecionou um voo na lista de voos (UC-004), o que abre a tela do voo.
Fluxo principal:
  1. O sistema carrega as leituras do voo, só as que ficam entre a hora de início e a hora de fim, inclusive (RN-004). As leituras gravadas na espera de 15 s do encerramento (UC-003) não aparecem.
  2. O sistema exibe o cabeçalho do voo: título "Voo de dd/mm/aaaa", hora de início (HH:mm) e duração (h:mm:ss), com o botão "Voltar à lista".
  3. O sistema exibe a reprodução, pausada em 0:00:00 e na velocidade 1×, com a linha do tempo, o tempo decorrido "h:mm:ss de h:mm:ss" e a hora local do instante (HH:mm:ss).
  4. O sistema exibe a trajetória, o painel de instrumentos e o perfil vertical no instante selecionado. Cada parâmetro mostra a última leitura gravada até o instante, sem interpolar (RN-008).
  5. O piloto move a linha do tempo (mouse ou setas, de 1 s em 1 s) ou usa Reproduzir e Pausar a 1×, 4× ou 16×. Instrumentos, aeronave no mapa e cursor do perfil seguem o instante.
  6. Para sair, o piloto clica em "Voltar à lista" ou tecla Esc; a reprodução para e a lista de voos volta.
Fluxos alternativos:
  A. Parâmetro N/A na sessão (RN-007): aparece "N/A" o voo todo, sem ponteiro, com rótulo acessível "<rótulo>: não aplicável". N/A vence "sem dados". Nas sessões antigas, gravadas sem a lista de parâmetros N/A, nenhum parâmetro aparece como N/A.
  B. Sem dados no instante: se passaram 2 s ou mais desde a última leitura do parâmetro, o valor aparece "—", sem ponteiro, com rótulo acessível "<rótulo>: sem dados". O mapa e o perfil mostram a linha interrompida no trecho sem leituras, e a aeronave some do mapa sem posição no instante (RN-008).
  C. Voo sem os parâmetros novos: parâmetro aplicável sem nenhuma leitura no voo aparece "Sem dados neste voo". Sem latitude e longitude gravadas, o mapa dá lugar ao texto "Trajetória indisponível: este voo não tem latitude e longitude gravadas (por exemplo, voos gravados antes da v0.3.0)." O caso é detectado pela falta de leituras, sem afirmar a versão que gravou o voo.
  D. Voo sem leituras: a tela mostra só o cabeçalho e a mensagem "Nenhuma leitura gravada neste voo.", sem reprodução, instrumentos, mapa nem perfil. A mensagem é anunciada pelo leitor de tela.
  E. Carregamento demorado: se a carga passa de 500 ms, o sistema exibe "Carregando dados do voo..." até os dados (ou o erro) aparecerem.
  F. Erro ao carregar: o sistema exibe "Não foi possível carregar os dados do voo. Volte à lista e abra o voo de novo." Reabrir o voo carrega os dados de novo.
  G. Sessão começa (RN-003) com a tela do voo aberta: a reprodução para e o sistema mostra o painel de tempo real com "Coleta iniciada" (CA-004-5).
Observações:
  - A aeronave no mapa é orientada pelo rumo magnético gravado, não pelo rumo verdadeiro (limitação conhecida aceita no HITL-1 do loop-006). Sem rumo no instante, ela aparece como um círculo.
  - Em 0:00:00 os instrumentos podem mostrar "—", porque a primeira leitura chega até 1 s depois da hora de início.
  - Os instrumentos não têm faixas de cor; as escalas são largas (IAS de 0 a 200 kt, RPM de 0 a 3.500), até a aeronave ser gravada (item 9 do backlog).
  - O indicador de flapes é um desenho proporcional ao %, sem graus, porque só o % é gravado.
Fora do escopo deste caso de uso: marcadores de evento (decolagem e pouso) e pista no mapa; faixas de cor por aeronave; ângulo real dos flapes; rumo verdadeiro; mapa de fundo; maximização de painéis; gráficos por parâmetro com seletor; comparação entre voos, exportação, filtros e anotações; atalhos de teclado novos (como espaço para Reproduzir).
Regras aplicadas: RN-002, RN-003, RN-004, RN-005, RN-007, RN-008
Critérios de aceite (aprovados no HITL-1 do loop-006):
  - CA-005-1 (abertura): Dado que o piloto selecionou um voo na lista, quando a tela do voo abre, então mostra o título "Voo de dd/mm/aaaa", a hora de início HH:mm e a duração h:mm:ss; só as leituras entre a hora de início e a hora de fim, inclusive, são carregadas, sem as da espera de 15 s do UC-003; e a reprodução abre pausada em 0:00:00.
  - CA-005-2 (os 12 parâmetros): Dado que o voo está aberto, quando o piloto olha um instante, então os 12 parâmetros têm valor numérico visível nos formatos de usability.md: velocímetro com a IAS; horizonte artificial com arfagem e rolagem; altímetro com a altitude; tacômetro com o RPM; bússola com o rumo; variômetro com a VS; alavancas de manete e mistura; indicador de flapes; latitude e longitude no texto da trajetória.
  - CA-005-3 (linha do tempo): Dado que o voo está aberto, quando o piloto move o controle deslizante da linha do tempo (mouse ou setas), então instrumentos, aeronave no mapa e cursor do perfil seguem o instante, e o reprodutor mostra o tempo decorrido "h:mm:ss de h:mm:ss" e a hora local HH:mm:ss.
  - CA-005-4 (reprodução): Dado que o voo está aberto, quando o piloto usa Reproduzir e Pausar a 1×, 4× ou 16×, então o instante avança na velocidade escolhida; a reprodução pausa no fim, e Reproduzir no fim recomeça do zero.
  - CA-005-5 (trajetória): Dado que o voo tem latitude e longitude, quando a tela abre, então o mapa mostra a trajetória inteira, sem mapa de fundo e com o norte para cima; o trecho até o instante fica em linha azul contínua e o restante em tracejado; a aeronave é orientada pelo rumo magnético; e a legenda diz "Linha azul contínua: trecho já voado. Tracejado: restante. Falhas na linha: sem dados. A aeronave aponta para o rumo magnético do instante; sem rumo, aparece como um círculo."
  - CA-005-6 (perfil vertical): Dado que o voo tem altitude, quando a tela abre, então o perfil mostra a altitude ao longo da duração inteira, com cursor no instante, e a redução de pontos do desenho preserva os mínimos e os máximos.
  - CA-005-7 (N/A): Dado que um parâmetro está na lista de N/A da sessão, quando o voo é exibido, então ele aparece "N/A" o voo todo, sem ponteiro, com rótulo acessível "<rótulo>: não aplicável", e N/A vence "sem dados".
  - CA-005-8 (sem dados no instante): Dado que passaram 2 s ou mais desde a última leitura de um parâmetro, quando esse instante é exibido, então o valor aparece "—", com rótulo acessível "<rótulo>: sem dados", e o mapa e o perfil mostram o trecho interrompido.
  - CA-005-9 (voo sem os parâmetros novos): Dado que um parâmetro aplicável não tem nenhuma leitura no voo, quando o voo é exibido, então ele aparece "Sem dados neste voo"; sem latitude e longitude, o mapa vira o texto "Trajetória indisponível: este voo não tem latitude e longitude gravadas (por exemplo, voos gravados antes da v0.3.0)."
  - CA-005-10 (voo sem leituras): Dado que o voo não tem nenhuma leitura, quando a tela abre, então mostra o cabeçalho e a mensagem "Nenhuma leitura gravada neste voo.", sem reprodução, instrumentos, mapa nem perfil.
  - CA-005-11 (carregamento e erro): Dado que o piloto abriu um voo, quando a carga passa de 500 ms, então o sistema exibe "Carregando dados do voo..."; quando a carga falha, então exibe "Não foi possível carregar os dados do voo. Volte à lista e abra o voo de novo.", e reabrir o voo carrega de novo.
  - CA-005-12 (duração por extenso): Dado que o piloto usa leitor de tela, quando ouve a duração no cabeçalho e o tempo decorrido na linha do tempo, então ambos são lidos por extenso (ex.: "12 minutos e 5 segundos de 1 hora, 2 minutos e 3 segundos, 14:17:05"), e o texto visível continua em h:mm:ss.
  - CA-005-13 (navegação): Dado que a tela do voo está aberta, quando o piloto clica em "Voltar à lista" ou tecla Esc, então volta à lista e a reprodução para; quando uma sessão começa, então a reprodução para e o painel de tempo real abre com "Coleta iniciada" (CA-004-5).
  - CA-005-14 (fora da escala): Dado que um valor gravado passa do limite da escala do instrumento, quando o instante é exibido, então o ponteiro para no limite e o número mostra o valor real. Exceção aceita no HITL-2 do loop-006: flapes ficam presos em 0–100 e a IAS negativa aparece como 0, pelos formatos de exibição.

---

UC-006
Nome: Coletar posição, motor e flapes
Ator: Piloto
Objetivo: Ampliar o conjunto de parâmetros com a posição da aeronave, os controles do motor e os flapes, para que sejam registrados e acompanhados durante o voo.
Pré-condições: Uma sessão de coleta está ativa (UC-001). A aeronave é de um motor (multimotor está fora do escopo; ver product.md).
Fluxo principal:
  1. Ao ligar o motor, junto com o início da sessão, o sistema decide pelos dados da aeronave quais parâmetros são N/A (RN-007). A decisão vale a sessão toda.
  2. Durante a sessão ativa, o sistema coleta latitude, longitude, manete, mistura, RPM e flapes junto com os parâmetros já existentes, na mesma cadência de 1 s. Manete, mistura e RPM são os do motor da aeronave (o sistema lê o motor 1 do simulador).
  3. O sistema grava as leituras de cada parâmetro aplicável na sessão.
  4. O painel de tempo real exibe os 12 parâmetros do conjunto, nos formatos definidos em product.md.
Fluxos alternativos:
  A. Aeronave sem um dos itens: o parâmetro aparece como "N/A" e nenhuma leitura dele é gravada (RN-007). Mistura é N/A se o motor não é a pistão; flapes são N/A se a aeronave não tem flapes. Manete, RPM, latitude e longitude nunca são N/A. Um 0 válido (flapes recolhidos, RPM com motor parado) continua 0.
  B. Sinal perdido ou sessão encerrada: os parâmetros N/A continuam "N/A"; os demais seguem o UC-002 ("—" ou valores congelados). O card N/A não tem gráfico de linha: mostra "N/A" com a unidade e o texto "A aeronave não possui este item" (CA-002-18).
Regras aplicadas: RN-001, RN-002, RN-005, RN-006, RN-007
Critérios de aceite:
  - CA-006-1: Dado que uma sessão está ativa, quando o simulador envia as leituras, então latitude, longitude, manete, mistura, RPM e flapes são gravados a cada 1 s junto com os parâmetros já existentes.
  - CA-006-2: Dado que uma sessão está ativa, quando o painel de tempo real é exibido, então os 12 parâmetros do conjunto aparecem, cada um com o seu valor atual.
  - CA-006-4: Dado que a aeronave não possui um dos itens (motor que não é a pistão, para a mistura; aeronave sem flapes, para os flapes), quando a sessão inicia, então o card desse parâmetro mostra "N/A" a sessão toda, inclusive com sinal perdido ou sessão encerrada, sem gráfico de linha e com o texto "A aeronave não possui este item", e nenhuma leitura dele é gravada.
  - CA-006-5: Dado que os flapes estão em qualquer posição, quando o valor é exibido, então ele aparece em % de extensão física, inteiro, de 0 a 100; flapes recolhidos aparecem como 0, não como "N/A".
  - CA-006-6: Dado que uma sessão está ativa, quando latitude e longitude são exibidas, então aparecem em graus decimais com 5 casas e hemisfério em letra (ex.: "23,55052 S", "46,63331 O"), e o banco guarda o valor com precisão total.
  - CA-006-7: Dado que uma sessão está ativa, quando manete, mistura e RPM são exibidos, então aparecem como inteiros (manete e mistura em %, manete com reverso em % negativo; RPM com separador de milhar).
(CA-006-3, de aeronave multimotor, deixou de ser critério no HITL-3 do loop-003: multimotor está fora do escopo.)

---

## Modelo de caso de uso

<!--
UC-001
Ator:
Objetivo:
Pré-condições:
Fluxo principal:
Fluxos alternativos:
Regras aplicadas: RN-NNN
Critérios de aceite:
  - Dado ... Quando ... Então ...
-->
