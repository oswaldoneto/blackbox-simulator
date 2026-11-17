# Casos de uso

> Propósito: Funcionalidades a desenvolver, com os critérios de aceite que guiam os testes e definem quando está pronto.
> Atualizar quando: um caso de uso for criado, mudar ou tiver os critérios de aceite revistos.
> Relacionados: [business_rules.md](business_rules.md), [glossary.md](glossary.md), [../engineering/domain_model.md](../engineering/domain_model.md)
> Última atualização: 2026-11-17 · loop-005

## Índice

| ID | Nome | Status |
|----|------|--------|
| UC-001 | Iniciar sessão de coleta | Concluído |
| UC-002 | Visualizar parâmetros em tempo real | Concluído |
| UC-003 | Encerrar sessão de coleta | Concluído |
| UC-004 | Selecionar voo para debriefing | Em andamento |
| UC-005 | Visualizar dados do debriefing | Em aberto |
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
Objetivo: Acompanhar os parâmetros de voo no painel de tempo real, na janela do Blackbox Simulator, enquanto o voo está em andamento.
Pré-condições: O Blackbox Simulator está em execução. O painel de tempo real exige uma sessão de coleta ativa (UC-001 foi concluído).
Fluxo principal:
  1. Quando a sessão fica ativa, o sistema exibe sozinho o painel de tempo real na área principal da própria janela do app, sem ação do piloto e sem segunda janela.
  2. O painel mostra o valor atual de cada um dos 12 parâmetros do conjunto de parâmetros (ver product.md).
  3. A cada 1 s, mesma cadência da coleta, o painel atualiza os valores com a leitura do simulador, enquanto a sessão está ativa.
Fluxos alternativos:
  A. Sem sessão ativa: no lugar do painel, o sistema exibe a orientação "Inicie o simulador e ligue o motor para começar".
  B. Sessão encerrada: o painel mantém os últimos valores congelados e exibe o aviso "Sessão encerrada". Ocorre quando a sessão encerra pelo UC-003 (RN-004), inclusive quando a gravação do encerramento falha, e dura até o motor ser religado (nova sessão) ou o app ser fechado; ao reabrir o app, aparece a orientação do fluxo A. Se a sessão encerrar com a conexão caída, os valores congelados ficam como "—", porque não há valor confiável para manter (decisão do HITL-4 do loop-002). Parâmetros N/A continuam "N/A" (RN-007).
  C. Sem sinal durante a sessão (conexão com o simulador perdida, ou 2 s sem leitura nova com a conexão aberta): os valores viram "—" e o painel exibe o aviso "Sem sinal do simulador". Quando as leituras voltam, os valores voltam e o aviso some. Parâmetros N/A continuam "N/A", porque N/A tem prioridade sobre "—" (RN-007).
Fora do escopo deste caso de uso: maximizar e reduzir cards do painel (vira item do backlog).
Regras aplicadas: RN-001, RN-002, RN-003, RN-004, RN-006, RN-007
Critérios de aceite:
  - Dado que uma sessão fica ativa, quando o Blackbox Simulator está aberto, então o painel de tempo real aparece sozinho na área principal da janela do app, sem ação do piloto, com os parâmetros do conjunto de parâmetros.
  - Dado que o painel está exibido, quando uma nova leitura chega do simulador, então o painel é atualizado a cada 1 s, com atraso máximo de 2 s entre o simulador e o painel, sem enviar comandos nem alterar o estado do simulador.
  - Dado que não há sessão ativa, quando o piloto olha a janela do app, então o sistema exibe a orientação "Inicie o simulador e ligue o motor para começar".
  - Dado que a sessão foi encerrada, quando o painel deixa de receber leituras, então os últimos valores ficam congelados e o painel exibe o aviso "Sessão encerrada".
  - Dado que uma sessão está ativa, quando a conexão com o simulador cai ou passam 2 s sem leitura nova, então os valores viram "—" e o painel exibe o aviso "Sem sinal do simulador"; quando as leituras voltam, os valores voltam a ser exibidos.
  - Dado que um parâmetro é N/A na sessão (RN-007), quando o sinal é perdido ou a sessão é encerrada, então o card desse parâmetro continua mostrando "N/A", e não "—".

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
  - As leituras gravadas durante os 15 s de espera ficam no banco, depois da hora de fim; o debriefing (UC-005) corta a exibição na hora de fim.
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
  5. O sistema abre a tela do voo, provisória até o UC-005: título "Voo de dd/mm/aaaa", data, hora de início e duração, o aviso "Debriefing disponível em breve" e o botão "Voltar à lista" (Esc também volta à lista). As leituras do voo não são carregadas neste caso de uso; isso é do UC-005.
  6. Para voltar ao painel de tempo real, o piloto clica em "Painel" na barra superior.
Fluxos alternativos:
  A. Nenhum voo: a lista exibe "Nenhum voo registrado. Inicie o simulador e ligue o motor para começar." Vale também quando só existe a sessão ativa.
  B. Sessão começa (RN-003) com a lista ou a tela do voo aberta: o sistema mostra o painel de tempo real sozinho, com "Coleta iniciada" (UC-002 inalterado).
  C. Sessão encerra com a lista aberta: a lista atualiza sozinha e o voo novo aparece no topo. O encerramento não troca de tela.
  D. Lista demora mais de 500 ms para carregar: o sistema exibe "Carregando voos...".
  E. Erro ao carregar a lista na primeira carga: o sistema exibe "Não foi possível carregar a lista de voos. Feche e abra o aplicativo para tentar de novo.", sem nova tentativa automática. Se depois uma sessão encerrar e a nova busca der certo, a lista substitui a mensagem (HITL-2 do loop-005).
  F. Falha numa nova busca com a lista já exibida: a lista anterior continua na tela; a falha só vai para o log.
  G. Sessão encerrada em silêncio na abertura do app (UC-003, fluxos D e E): não atualiza a lista já aberta; o voo aparece ao abrir a lista de novo. A sessão de falha de gravação do encerramento (UC-003, fluxo H), ativa no banco até a próxima abertura, só aparece depois de encerrada.
Fora do escopo deste caso de uso: filtro e busca na lista; paginação; aeronave e aeródromos no card (o campo não é gravado hoje; gravá-los em voos futuros virou item do backlog no HITL-1 do loop-005); aviso para sessões antigas sem os 6 parâmetros novos (UC-005).
Regras aplicadas: RN-003, RN-004, RN-005, RN-006
Critérios de aceite:
  - CA-004-1: Dado que existem sessões encerradas, quando o piloto clica em "Voos", então a lista exibe todas as sessões encerradas (inclusive curtas, de duração 0 e antigas), sem a sessão ativa, ordenadas pela hora de início da mais recente para a mais antiga, cada uma com data dd/mm/aaaa, hora de início HH:mm (24 h) no fuso local da máquina e duração h:mm:ss (ex.: "0:00:00", "25:03:10").
  - CA-004-2: Dado que a lista de voos está exibida, quando o piloto clica num voo (ou o foca com Tab e tecla Enter), então o sistema abre a tela do voo com data, hora de início, duração, o aviso "Debriefing disponível em breve" e o botão "Voltar à lista"; clicar em "Voltar à lista" ou teclar Esc volta à lista.
  - CA-004-3: Dado que não existe sessão encerrada (inclusive quando só existe a sessão ativa), quando o piloto clica em "Voos", então o sistema exibe "Nenhum voo registrado. Inicie o simulador e ligue o motor para começar."
  - CA-004-4: Dado que uma sessão está ativa, quando o piloto abre a lista de voos e volta pelo botão "Painel", então a barra superior e a barra de estado ficaram visíveis o tempo todo, a sessão ativa não apareceu na lista, a coleta continuou e o painel mostra os valores ao vivo.
  - CA-004-5: Dado que a lista de voos ou a tela do voo está aberta, quando uma sessão começa, então o sistema mostra o painel de tempo real sozinho, com "Coleta iniciada".
  - CA-004-6: Dado que a lista de voos está aberta, quando uma sessão encerra, então a lista atualiza sozinha com o voo novo no topo, sem trocar de tela.
  - CA-004-7: Dado que o piloto abre a lista de voos, quando a primeira carga falha, então o sistema exibe "Não foi possível carregar a lista de voos. Feche e abra o aplicativo para tentar de novo." sem nova tentativa automática; quando uma nova busca falha com a lista já exibida, então a lista anterior continua na tela.
  - CA-004-8: Dado que o piloto abre a lista de voos, quando a carga demora mais de 500 ms, então o sistema exibe "Carregando voos..." até a lista (ou o erro) aparecer.
(Critérios revistos no loop-005: o antigo "todas as sessões" virou só as encerradas; a seleção abre a tela provisória do voo, sem carregar dados, até o UC-005; o estado vazio ganhou texto oficial.)

---

UC-005
Nome: Visualizar dados do debriefing
Ator: Piloto
Objetivo: Revisar os parâmetros registrados de um voo selecionado para identificar pontos de melhoria.
Pré-condições: O piloto selecionou um voo em UC-004. Isso abre a tela do voo, hoje provisória (data, hora de início, duração, aviso "Debriefing disponível em breve" e "Voltar à lista"); o UC-005 preenche essa tela com o debriefing.
Fluxo principal:
  1. O sistema exibe os parâmetros do conjunto de parâmetros ao longo do tempo da sessão selecionada.
  2. O piloto navega pelos dados para analisar o comportamento dos parâmetros durante o voo.
Fluxos alternativos: —
Regras aplicadas: RN-002, RN-005
Critérios de aceite:
  - Dado que uma sessão foi selecionada, quando a tela de debriefing é aberta, então todos os parâmetros do conjunto de parâmetros registrados durante aquele voo são exibidos.
  - Dado que os dados estão sendo exibidos, quando o piloto navega pela linha do tempo, então os valores dos parâmetros correspondem ao momento selecionado.
Em aberto (vindo do loop-003, UC-006): como o debriefing mostra um parâmetro que foi N/A na sessão (RN-007), diferenciando-o de perda de dados; como aparecem as sessões antigas (loops 001 e 002), gravadas sem os 6 parâmetros novos.
Em aberto (vindo do loop-005, UC-004): carregar as leituras do voo selecionado e cortá-las na hora de fim (UC-003, observações); mostrar a duração por extenso na tela do voo para leitor de tela (hoje só h:mm:ss). O tratamento de N/A e das sessões antigas segue em aberto, como acima.

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
  B. Sinal perdido ou sessão encerrada: os parâmetros N/A continuam "N/A"; os demais seguem o UC-002 ("—" ou valores congelados).
Regras aplicadas: RN-001, RN-002, RN-005, RN-006, RN-007
Critérios de aceite:
  - CA-006-1: Dado que uma sessão está ativa, quando o simulador envia as leituras, então latitude, longitude, manete, mistura, RPM e flapes são gravados a cada 1 s junto com os parâmetros já existentes.
  - CA-006-2: Dado que uma sessão está ativa, quando o painel de tempo real é exibido, então os 12 parâmetros do conjunto aparecem, cada um com o seu valor atual.
  - CA-006-4: Dado que a aeronave não possui um dos itens (motor que não é a pistão, para a mistura; aeronave sem flapes, para os flapes), quando a sessão inicia, então o card desse parâmetro mostra "N/A" a sessão toda, inclusive com sinal perdido ou sessão encerrada, e nenhuma leitura dele é gravada.
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
