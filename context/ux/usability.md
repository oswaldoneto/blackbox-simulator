# Usabilidade

> Propósito: Diretrizes de usabilidade e acessibilidade.
> Atualizar quando: uma diretriz mudar ou um teste com usuários trouxer um aprendizado.
> Relacionados: [../product/product.md](../product/product.md)
> Última atualização: 2026-11-17 · loop-007

## Princípios

- **Leitura rápida primeiro.** O piloto está com atenção dividida entre o simulador e o painel. Toda informação relevante é visível sem rolagem e sem abrir submenus. (Exceção aceita no loop-003: com 12 cards no painel de tempo real, larguras de 900px ou menos podem exigir rolagem; ver [design.md](design.md).)
  - Exceção ampliada no loop-007 (decisão 16 da 1.1): com os gráficos de linha, os cards ficam com cerca de 181px, e alturas de conteúdo menores que cerca de 700px exigem rolagem mesmo a 4 colunas (ex.: telas de 720 a 768px de altura). Débito no item 10 do backlog (ver [design.md](design.md), "Em aberto").
  - Exceção do debriefing (loop-006, UC-005): o princípio vale para o voo ao vivo. No debriefing o piloto não está voando, e a tela do voo (reprodutor, trajetória, painel de instrumentos e perfil vertical) exige rolagem vertical. Débito: ao rolar até o perfil, os controles de reprodução saem da vista (ver [design.md](design.md), "Em aberto").
- **Interações breves.** Qualquer ação no painel de tempo real é concluída em no máximo um clique ou tecla. Fluxos que exigem mais de uma etapa pertencem ao debriefing, não ao painel de voo.
- **Foco por demanda.** O piloto pode maximizar qualquer seção ou gráfico individualmente para ter foco maior naquele dado. A maximização não altera os dados exibidos, apenas a área de visualização. (No painel de tempo real, a maximização ficou fora do loop-002 e é item do backlog; no debriefing, ficou fora do loop-006, também no backlog.)
- **Estado sempre visível.** A interface sempre mostra se a sessão está ativa, encerrada ou se não há conexão com o simulador. Nunca deixa o piloto adivinhar o estado do sistema.
- **Sem surpresas.** Nenhuma ação destrutiva (ex.: encerramento de sessão) é executada sem que o sistema confirme visualmente o que aconteceu.

## Acessibilidade

- Contraste mínimo de 4,5:1 entre texto e fundo (WCAG AA) em todos os elementos de texto.
- Todos os elementos interativos são acessíveis por teclado (Tab, Enter, Esc).
- Gráficos e indicadores numéricos têm texto alternativo ou rótulo visível com o valor atual, para que a informação não dependa só de cor.
- Cores não são o único meio de distinguir estados (ex.: sessão ativa vs. encerrada usa cor + rótulo de texto).
- O "—" de sem sinal e o "N/A" de não aplicável usam `color-text-secondary` (não `color-text-disabled`, que fica abaixo de 4,5:1). No painel de instrumentos escuro do debriefing, usam `color-panel-muted` (#A8A8A8), com cerca de 5,3:1 sobre `color-panel-bg` (loop-006; ver [design.md](design.md)).

### Leitor de tela no painel de tempo real (UC-002)

- Cada indicador de parâmetro é um grupo (`role="group"`) com `aria-label` em texto, no formato "<rótulo>: <valor> <unidade>", "<rótulo>: sem sinal" ou, para parâmetro que a aeronave não possui, "<rótulo>: não aplicável" (loop-003). A precedência é a mesma do card: não aplicável, depois sem sinal, depois valor.
- Faixa dos gráficos (loop-007, CA-002-19, decisão 10 da 1.1): quando a janela tem leituras, o `aria-label` ganha a faixa dos últimos 2 minutos:
  - com valor: "<rótulo>: <valor> <unidade>; últimos 2 minutos: de <mín> a <máx> <unidade>" (ex.: "Altitude MSL: 4.500 ft; últimos 2 minutos: de 4.320 a 4.510 ft");
  - sem sinal com leituras na janela: "<rótulo>: sem sinal; últimos 2 minutos: de <mín> a <máx> <unidade>" (decisão T7);
  - com a janela vazia, a faixa é omitida e o texto volta aos formatos acima;
  - não aplicável: só "<rótulo>: não aplicável" (o card N/A não tem gráfico);
  - o mínimo e o máximo são as leituras da janela (não os limites da escala), na formatação do valor do parâmetro;
  - no rumo, a faixa é o menor arco que cobre as leituras, inclusive passando pelo norte (ex.: "de 350 a 010"; decisão T6, opção b).
- O desenho do gráfico e os limites da escala levam `aria-hidden`; a informação do gráfico chega ao leitor de tela só pela faixa do `aria-label`.
- Os indicadores não têm `aria-live`: a atualização a cada segundo (inclusive da faixa) não é anunciada, para não sobrecarregar o leitor de tela.
- O encerramento da sessão é anunciado uma única vez, pela notificação "Sessão encerrada. Dados salvos."; o aviso "Sessão encerrada" do painel não tem `role="status"`. Na falha ao gravar o encerramento (loop-004), quem anuncia é a notificação de erro.
- A notificação de sistema, inclusive a de erro, usa `role="status"` e `aria-live="polite"`.
- O aviso "Sem sinal do simulador" tem `role="status"`, para ser anunciado.

Débitos de acessibilidade (revisão do loop-002, sem decisão):
- Avisos com `role="status"` montados já com o texto podem não ser anunciados por alguns leitores de tela; uma região viva sempre montada seria mais segura. Não decidido.
- O indicador de estado da barra usa `aria-label` em `<div>` sem role e sem região viva; a perda de conexão não é anunciada.
- Os cards podem ser lidos em dobro (`aria-label` do grupo e texto interno).

Débitos de acessibilidade (revisão do loop-004; decisão do HITL-3: débito para um loop de UX do painel):
- A notificação de erro usa `role="status"`/`aria-live="polite"`; o usual para erro seria `role="alert"`.
- Cada notificação nova é remontada (para reiniciar os 4 s) já com o texto; isso estende o risco de não anúncio, descrito acima, à notificação que substitui outra.

Débitos de acessibilidade (revisão do loop-007; decisão do HITL-3: débito):
- Leitura em dobro no card N/A: o `aria-label` diz "<rótulo>: não aplicável", e o texto visível "A aeronave não possui este item" pode ser lido também (agrava o débito dos cards lidos em dobro).
- O `aria-label` ficou mais longo com a faixa e muda a cada segundo.

Conferências manuais com NVDA a fazer (teste no Windows do loop-007):
- a leitura em dobro no card N/A;
- o `aria-label` mais longo, com a faixa: se é lido inteiro e de forma compreensível ao navegar pelos cards, e se a mudança a cada segundo gera anúncios sem `aria-live`.

### Navegação, lista de voos e tela do voo (UC-004)

Foco ao trocar de tela (decisão do HITL-3 do loop-005):
- Ao trocar de tela, o foco vai para o título da tela nova (h1 com `tabIndex={-1}`).
- O painel não tem título visível; tem um h1 visualmente oculto "Painel de tempo real", que recebe o foco ao ir ao painel pela barra e na volta automática vinda de outra tela. A carga inicial do app não move o foco.
- Ir para "Voos" pela barra: foco no título "Voos".
- Abrir um voo: foco no botão "Voltar à lista" (exceção decidida no loop-005 e mantida no HITL-1 do loop-006), que tem `aria-describedby` apontando para o título "Voo de dd/mm/aaaa" e para a linha "Início HH:mm · Duração ...", com a duração por extenso. No voo sem leituras, o `aria-describedby` inclui também a mensagem "Nenhuma leitura gravada neste voo.". Como o foco vai ao botão na montagem, durante o carregamento, a mensagem entra na descrição depois; por isso ela também tem `role="status"` (rodada curta do loop-006). O aviso "Debriefing disponível em breve" deixou de existir.
- Voltar do voo à lista: foco no card de origem quando a lista carrega; se o card não estiver mais na lista, foco no título "Voos".

Teclado:
- Tab percorre os botões da barra ("Painel", "Voos") e os cards da lista; Enter abre o voo; Esc na tela do voo volta à lista.
- Na tela do voo (loop-006), Tab percorre "Voltar à lista", Reproduzir/Pausar, as velocidades 1×, 4× e 16× e a linha do tempo. As setas movem a linha do tempo em passos de 1 s. Esc volta à lista e para a reprodução. Sem atalhos novos (decisão do HITL-1 do loop-006; espaço para Reproduzir ficou de fora).

Leitor de tela:
- A navegação é um `<nav aria-label="Navegação principal">`; o botão da seção atual tem `aria-current="page"`.
- Cada card de sessão tem `aria-label` "Voo de dd/mm/aaaa às HH:mm, duração <duração por extenso>". A duração por extenso evita que "1:12:05" seja lido como hora do dia: "1 hora, 12 minutos e 5 segundos" (singular e plural; partes zero omitidas), "0 segundos" para duração zero. Valor ausente ou inválido vira "Voo de dd/mm/aaaa às HH:mm, duração indisponível". O texto visível continua em h:mm:ss.
- A mensagem de carregando da lista usa `role="status"`; a de erro usa `role="alert"`.

Débitos de acessibilidade (revisão do loop-005; decisão do HITL-3: débito):
- O estado vazio da lista não é anunciado; o carregando com `role="status"` é montado já com o texto (mesmo risco de não anúncio descrito acima).
- Ao voltar do voo, o foco fica no `body` enquanto a lista é buscada de novo, e permanece lá se a busca falhar (o erro é anunciado por `role="alert"`).

### Leitor de tela no debriefing (UC-005, loop-006)

- Duração por extenso: na linha do cabeçalho, o h:mm:ss visível leva `aria-hidden` e um texto visualmente oculto (classe `.visualmente-oculto`) traz a duração por extenso, no formato do card de sessão ("1 hora, 12 minutos e 5 segundos"); duração inválida vira "indisponível".
- Reprodutor:
  - a seção tem rótulo "Reprodução do voo";
  - o botão alterna o nome acessível entre "Reproduzir o voo" e "Pausar";
  - as velocidades ficam num grupo "Velocidade de reprodução", com `aria-pressed` na selecionada;
  - o texto visível "h:mm:ss de h:mm:ss · HH:mm:ss" leva `aria-hidden`;
  - a linha do tempo tem o rótulo oculto "Instante do voo" e `aria-valuetext` por extenso: "<decorrido por extenso> de <duração por extenso>, HH:mm:ss" (ex.: "12 minutos e 5 segundos de 1 hora, 2 minutos e 3 segundos, 14:17:05").
- Painel de instrumentos: cada instrumento é um grupo (`role="group"`) com `aria-label` no formato do painel de tempo real, com os parâmetros separados por vírgula: "<rótulo>: <valor> <unidade>", "<rótulo>: não aplicável", "<rótulo>: sem dados" ou "<rótulo>: sem dados neste voo". O desenho do instrumento leva `aria-hidden`. Sem `aria-live`.
- Trajetória e perfil vertical: o SVG tem `role="img"` e `aria-label` com o valor do instante:
  - trajetória: "Trajetória do voo, com o norte para cima. Posição no instante: <Latitude> <valor>, <Longitude> <valor>" ou "... Posição no instante: sem dados";
  - perfil: "Perfil vertical do voo: <rótulo> de <mínimo> a <máximo> <unidade>; no instante, <valor com unidade, ou "—">".
  - Os eixos do perfil levam `aria-hidden`.
- Estados: o carregando usa `role="status"`; o erro, `role="alert"`; a mensagem de voo sem leituras, `role="status"` (além de entrar no `aria-describedby` de "Voltar à lista").

Conferências manuais com NVDA a fazer (teste no Windows do loop-006):
- leitura em dobro nos grupos dos instrumentos (`aria-label` do grupo e texto interno visível), como já registrado para os cards do painel;
- leitura de "×" nas velocidades, de "°" e de "−" (sinal de menos tipográfico) nos valores;
- o `aria-valuetext` da linha do tempo durante a reprodução, que muda a cada segundo e pode ser anunciado a cada segundo.

Perguntas de diretriz pendentes (revisão de usabilidade do loop-006, sem decisão humana):
- O alvo mínimo de 44×44px vira diretriz? Hoje os botões de velocidade têm 48×36px e o polegar da linha do tempo é menor.
- O contraste gráfico mínimo de 3:1 (contornos de componentes, traços e partes de gráficos que carregam informação) vira diretriz? Continua sem decisão, mas foi aplicado na prática: no loop-006, ao tracejado da trajetória e à alavanca de mistura; no loop-007, às linhas dos gráficos do painel, contra o branco e contra a área (decisão 15 da 1.1, que escureceu o laranja e criou o cinza; ver [design.md](design.md), "Cores do gráfico de linha do painel").
- "N/A mantém a unidade" (decisão do HITL-1 do loop-003 para o painel de tempo real) vale também no debriefing? Hoje a unidade some nos instrumentos e no perfil vertical.

## Feedback e mensagens de erro

- Toda operação que leva mais de 500 ms mostra um indicador de carregamento.
- Quando a sessão inicia automaticamente, o sistema exibe uma notificação discreta confirmando o início da coleta.
- Quando a sessão encerra automaticamente, o sistema exibe uma notificação de sucesso confirmando o encerramento: "Sessão encerrada. Dados salvos." A notificação usa o tipo `success`, só aparece depois de o encerramento ser gravado e desaparece em 4 segundos.
- Mensagens de erro descrevem o que aconteceu e o que o piloto pode fazer. Exemplo: "Não foi possível conectar ao simulador. Verifique se o Microsoft Flight Simulator 2024 está em execução."

### Encerramento da sessão (UC-003)

| Situação | Notificação | Tipo |
|---|---|---|
| Encerramento gravado | "Sessão encerrada. Dados salvos." | `success` |
| Falha ao gravar o encerramento | "Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura." | `error` |
| Sessão restaurada confirmada na abertura (motor ligado) | "Coleta iniciada" | `success` |
| Sessão encerrada na abertura do app | sem notificação (silencioso) | — |
| Falha ao gravar o encerramento feito na abertura | sem notificação; só log (a próxima abertura tenta de novo) | — |

- Exceção decidida à diretriz de mensagens de erro (HITL-3 do loop-004): o texto de erro do encerramento não pede ação ao piloto; em vez disso, diz que os dados do voo foram mantidos e que o encerramento será concluído na próxima abertura.
- Toda notificação nova fica 4 s completos na tela, mesmo que substitua outra ou repita o texto.
- Débito (HITL-3 do loop-004): "próxima abertura" pode não deixar claro que é a abertura do app. Os demais débitos de leitura da notificação de erro estão em [design.md](design.md), "Em aberto e débitos de UX".
- Estados vazios explicam o motivo e orientam o próximo passo (texto oficial da lista de voos abaixo).

### Lista de voos e tela do voo (UC-004)

| Situação | Texto |
|---|---|
| Título da lista | "Voos" |
| Lista carregando (só após 500 ms) | "Carregando voos..." |
| Nenhuma sessão encerrada (vale também quando só existe a sessão ativa) | "Nenhum voo registrado. Inicie o simulador e ligue o motor para começar." |
| Falha na primeira carga da lista | "Não foi possível carregar a lista de voos. Feche e abra o aplicativo para tentar de novo." |
| Rótulo da duração no card | "Duração" |
| Itens da navegação | "Painel", "Voos" |

Os textos da tela do voo estão em "Debriefing (UC-005)", abaixo. Os da tela provisória ("Data", "Hora de início", "Duração" e "Debriefing disponível em breve") saíram no loop-006.

- O erro não tem nova tentativa automática nem botão; a mensagem orienta a reabrir o app (HITL-1 do loop-005).
- Falha numa nova busca com a lista já carregada (ex.: após uma sessão encerrar): a lista anterior é mantida e a falha só vai para o log. Após um erro na primeira carga, um encerramento de sessão posterior busca de novo e, se der certo, a lista substitui o erro.
- Uma sessão encerrada em silêncio na abertura do app só aparece ao reabrir a lista.

### Debriefing (UC-005)

Textos aprovados no loop-006 (HITL-1 e HITL-3):

| Situação | Texto |
|---|---|
| Título da tela do voo | "Voo de dd/mm/aaaa" |
| Linha abaixo do título | "Início HH:mm · Duração h:mm:ss" (leitor de tela: duração por extenso) |
| Botão do cabeçalho | "Voltar à lista" |
| Carregando (só após 500 ms) | "Carregando dados do voo..." |
| Falha ao carregar | "Não foi possível carregar os dados do voo. Volte à lista e abra o voo de novo." |
| Voo sem nenhuma leitura | "Nenhuma leitura gravada neste voo." |
| Rótulo da seção de reprodução (leitor de tela) | "Reprodução do voo" |
| Botão de reprodução (leitor de tela) | "Reproduzir o voo" / "Pausar" |
| Grupo de velocidades (leitor de tela) | "Velocidade de reprodução" |
| Velocidades | "1×", "4×", "16×" |
| Tempo do reprodutor | "h:mm:ss de h:mm:ss · HH:mm:ss" (decorrido, duração e hora local do instante) |
| Linha do tempo (leitor de tela) | rótulo "Instante do voo"; valor "<decorrido por extenso> de <duração por extenso>, HH:mm:ss" |
| Títulos das seções | "Trajetória", "Painel de instrumentos", "Perfil vertical" |
| Trajetória indisponível (voo sem latitude e longitude) | "Trajetória indisponível: este voo não tem latitude e longitude gravadas (por exemplo, voos gravados antes da v0.3.0)." |
| Legenda do mapa | "Linha azul contínua: trecho já voado. Tracejado: restante. Falhas na linha: sem dados. A aeronave aponta para o rumo magnético do instante; sem rumo, aparece como um círculo." |
| Parâmetro aplicável sem nenhuma leitura no voo (instrumentos) | "Sem dados neste voo" |
| Perfil sem altitude no voo | "<rótulo>: Sem dados neste voo" (ex.: "Altitude MSL: Sem dados neste voo") |
| Parâmetro sem leitura nos 2 s até o instante | "—" |
| Parâmetro que a aeronave não possui | "N/A" |
| Legendas dentro dos mostradores (desenho, oculto do leitor de tela) | "KT", "ALT ×100 FT", "RPM ×100", "FPM ×100", "▲ SOBE  ▼ DESCE" |

- Os rótulos dos instrumentos são os rótulos dos parâmetros ("Velocidade IAS", "Altitude MSL"...), não os nomes dos instrumentos (decisão do HITL-1 do loop-006).
- A legenda do mapa não depende só do nome da cor: diz também "contínua" e "tracejado". O texto foi aprovado no HITL-3, antes de a correção da rodada curta trocar o tracejado do trecho restante por um pontilhado (ver [design.md](design.md)); no HITL-4 do loop-006 ficou decidido manter "Tracejado".
- "Trajetória indisponível" cita a v0.3.0 só como exemplo, porque o voo é detectado pela falta de leituras, não pela versão (decisão do HITL-1 do loop-006). O texto foi aprovado como está no HITL-3.
- O erro não tem nova tentativa automática; reabrir o voo carrega os dados de novo.
- Precedência dos estados de um parâmetro: N/A, depois "Sem dados neste voo", depois "—", depois o valor.
- Fora da escala do mostrador, o ponteiro para no limite e o número mostra o valor real (com as regras de formatação abaixo: flapes ficam em 0..100 e IAS negativa vira 0).
- A reprodução abre pausada em 0:00:00, a 1×; pausa sozinha no fim; Reproduzir no fim recomeça do zero.

### Painel de tempo real (UC-002)

- Cadência: os valores são atualizados a cada 1 s, com o valor lido do simulador. Atraso máximo aceitável entre o simulador e o painel: 2 s (conferido nos testes manuais no Windows com o MSFS 2024 dos loops 002 e 003).
- Gráficos (loop-007): o gráfico de cada card se atualiza junto com o valor, com o mesmo atraso máximo de 2 s (CA-002-2). A janela é fixa em 2 minutos, sem seletor. A conferir no teste manual no Windows do loop-007.
- Limite de sem sinal: se a conexão com o simulador cair durante a sessão ou se passarem 2 s sem dados novos, os valores viram "—", as linhas dos gráficos ficam cinza e o painel mostra o aviso. Os valores voltam sozinhos quando os dados retornam. Cards N/A continuam "N/A".
- Não aplicável (UC-006, RN-007): o parâmetro que a aeronave não possui mostra "N/A" a sessão toda, com a unidade mantida. Flapes são N/A em aeronave sem flapes; Mistura é N/A em motor que não é a pistão. Um 0 válido (flapes recolhidos, RPM 0) aparece como 0, não como N/A.
- Textos do painel:

| Situação | Texto |
|---|---|
| Sem sessão (área principal) | "Inicie o simulador e ligue o motor para começar" |
| Carregando o estado inicial | "Aguardando..." |
| Sessão encerrada (aviso, valores congelados) | "Sessão encerrada" |
| Sem sinal (aviso, valores "—") | "Sem sinal do simulador" |
| Parâmetro que a aeronave não possui (no lugar do valor) | "N/A" |
| Parâmetro que a aeronave não possui (no lugar do gráfico; loop-007) | "A aeronave não possui este item" |
| Legenda dos gráficos (acima da grade, à direita; loop-007) | "Gráficos: últimos 2 minutos. A ponta direita da linha é o valor atual." |
| Falha ao carregar os parâmetros (aviso no lugar da grade) | "Não foi possível carregar os parâmetros." |
| Barra superior, conectado sem sessão | "Aguardando motor" |
| Barra superior, simulador inacessível | "Sem conexão" |

Débitos (revisão do loop-002, sem decisão):
- "Sem sinal do simulador" e "Não foi possível carregar os parâmetros." não dizem o que o piloto pode fazer, contrariando a diretriz de mensagens de erro acima. O texto "Sem sinal do simulador" foi decidido no HITL-3.
- A falha ao carregar os parâmetros não tem nova tentativa automática.
- O estado sem sessão não explica o motivo, só orienta o próximo passo.
- Se a consulta inicial da sessão ou da conexão falhar, a tela pode mostrar "sem sessão" ou "Sem conexão" até o próximo evento, mesmo com a coleta em andamento.

## Linguagem

- Idioma: português do Brasil.
- Tom: direto e técnico, sem jargão de marketing. O usuário é um piloto familiarizado com termos de aviação.
- Os termos da interface seguem o glossário de produto: **sessão**, **parâmetro de voo**, **debriefing**, **piloto**, **voo**.
- Rótulos de parâmetros usam a nomenclatura aeronáutica padrão, com os nomes de [domain_model.md](../engineering/domain_model.md). Rótulos do conjunto de 12 parâmetros, na ordem do painel:
  - Conjunto inicial (loop-002): **Altitude MSL** (ft), **Velocidade IAS** (kt), **Velocidade vertical** (fpm), **Rumo magnético** (°), **Arfagem** (°), **Rolagem** (°). Usa-se "Rumo magnético", não "proa".
  - Ampliação (loop-003, UC-006): **Latitude** (°), **Longitude** (°), **Manete** (%), **Mistura** (%), **RPM** (rpm), **Flapes** (%).
- O produto suporta, por enquanto, só aeronaves de um motor (decisão do HITL-3 do loop-003). Por isso "Manete", "Mistura" e "RPM" não indicam o motor no rótulo.
- A unidade é exibida como rótulo à parte, nunca dentro do valor.
- Botões e ações usam verbos no infinitivo: "Iniciar", "Encerrar", "Selecionar", "Maximizar".
- Exceção: itens de navegação usam o substantivo da seção, não um verbo ("Painel", "Voos"; loop-005). "Voltar à lista" segue a regra do verbo.

## Formatação de valores numéricos

Regras do painel de tempo real (UC-002; 6 parâmetros novos no UC-006):

| Parâmetro | Casas | Regra | Exemplo |
|---|---|---|---|
| Altitude MSL (ft) | 0 | inteiro; só o sinal de menos aparece | `4.500` |
| Velocidade IAS (kt) | 0 | inteiro; negativo vira 0 | `112` |
| Velocidade vertical (fpm) | 0 | múltiplo de 10; "+" ou "−" explícito | `+650` |
| Rumo magnético (°) | 0 | 3 dígitos, de 000 a 359; 360 vira 000 | `005` |
| Arfagem (°) | 1 | "+" com o nariz para cima, "−" para baixo | `+5,2` |
| Rolagem (°) | 1 | valor absoluto + "E" (esquerda) ou "D" (direita); zero sem letra | `12,3 D` |
| Latitude (°) | 5 | graus decimais em valor absoluto + "N" ou "S"; zero aparece "0,00000" sem letra | `23,55052 S` |
| Longitude (°) | 5 | graus decimais em valor absoluto + "L" ou "O"; zero aparece "0,00000" sem letra | `46,63331 O` |
| Manete (%) | 0 | inteiro; reverso com "−" | `85`, `−20` |
| Mistura (%) | 0 | inteiro | `100` |
| RPM (rpm) | 0 | inteiro, com ponto de milhar | `2.450` |
| Flapes (%) | 0 | inteiro, limitado a 0..100 (extensão física da superfície, não o detente) | `30` |

Regras gerais:
- Latitude e longitude: o "°" fica no rótulo da unidade, não no valor (decisão do HITL-1 do loop-003).
- O banco grava os valores com precisão total; o arredondamento é só na exibição.
- Locale `pt-BR`: vírgula decimal e ponto de milhar.
- Negativos usam o sinal de menos tipográfico (U+2212, "−"), não o hífen.
- "−0" é exibido como "0".
- Valor ausente ou inválido (`null`, `NaN`, `Infinity`) é exibido como "—".
- Os sinais de arfagem e rolagem são corrigidos só na exibição; o sentido foi confirmado no teste manual no Windows com o MSFS 2024 (loop-002).
- Débito: o arredondamento da velocidade vertical é assimétrico perto de zero (+5 fpm vira "+10", −5 fpm vira "0").

## Formatação de data, hora e duração do voo

Regras da lista de voos e da tela do voo (UC-004):

| Valor | Formato | Exemplo |
|---|---|---|
| Data de início | dd/mm/aaaa, no fuso local da máquina | `17/11/2026` |
| Hora de início | HH:mm, 24 h, sem segundos, no fuso local | `09:05`, `00:30` |
| Duração | h:mm:ss, horas sem limite (sem zero à esquerda nas horas) | `1:12:05`, `26:00:00`, `0:00:00` |

- A duração é a diferença entre o fim e o início da sessão; duração zero aparece "0:00:00".
- A hora de fim não aparece na lista nem na tela do voo.
- Valor inválido, hora de fim ausente ou duração negativa aparecem como "—".
- A duração por extenso do rótulo acessível está em "Navegação, lista de voos e tela do voo", na seção de acessibilidade.

Regras do reprodutor do debriefing (UC-005, loop-006):

| Valor | Formato | Exemplo |
|---|---|---|
| Tempo decorrido e duração | h:mm:ss, como a duração acima, em segundos inteiros | `0:12:05 de 1:02:03` |
| Hora local do instante | HH:mm:ss, 24 h, no fuso local | `14:17:05` |
| Marcas de tempo do perfil vertical | h:mm:ss, a 0, 25, 50, 75 e 100 % da duração | `0:15:30` |

- Para o leitor de tela, o tempo decorrido e a duração vão por extenso, no mesmo formato da duração do card (ver "Leitor de tela no debriefing").
