# Casos de uso

> Propósito: Funcionalidades a desenvolver, com os critérios de aceite que guiam os testes e definem quando está pronto.
> Atualizar quando: um caso de uso for criado, mudar ou tiver os critérios de aceite revistos.
> Relacionados: [business_rules.md](business_rules.md), [glossary.md](glossary.md), [../engineering/domain_model.md](../engineering/domain_model.md)
> Última atualização: 2026-11-16

## Índice

| ID | Nome | Status |
|----|------|--------|
| UC-001 | Iniciar sessão de coleta | Em aberto |
| UC-002 | Visualizar parâmetros em tempo real | Em aberto |
| UC-003 | Encerrar sessão de coleta | Em aberto |
| UC-004 | Selecionar voo para debriefing | Em aberto |
| UC-005 | Visualizar dados do debriefing | Em aberto |

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
  3. O sistema cria uma nova sessão e inicia a coleta dos parâmetros do conjunto inicial.
Fluxos alternativos:
  A. Motor já estava ligado ao iniciar o Blackbox Simulator: o sistema cria a sessão e inicia a coleta a partir daquele momento.
Regras aplicadas: RN-001, RN-002, RN-003
Critérios de aceite:
  - Dado que o Blackbox Simulator está em execução, quando o piloto liga o motor no simulador, então o sistema inicia uma nova sessão e começa a registrar os parâmetros.
  - Dado que o motor já está ligado ao iniciar o Blackbox Simulator, quando o sistema é iniciado, então uma sessão é criada e a coleta começa imediatamente.

---

UC-002
Nome: Visualizar parâmetros em tempo real
Ator: Piloto
Objetivo: Acompanhar os parâmetros de voo em uma janela separada enquanto o voo está em andamento.
Pré-condições: Uma sessão de coleta está ativa (UC-001 foi concluído).
Fluxo principal:
  1. O sistema exibe os parâmetros do conjunto inicial em uma janela separada do simulador.
  2. Os valores são atualizados continuamente enquanto a sessão está ativa.
Fluxos alternativos: —
Regras aplicadas: RN-002, RN-006
Critérios de aceite:
  - Dado que uma sessão está ativa, quando o piloto abre o painel do Blackbox Simulator, então os parâmetros do conjunto inicial são exibidos em uma janela separada com valores atualizados.
  - Dado que o painel está aberto, quando um novo valor de parâmetro chega do simulador, então o painel é atualizado sem que o desempenho do simulador seja afetado perceptivelmente.

---

UC-003
Nome: Encerrar sessão de coleta
Ator: Piloto
Objetivo: Encerrar automaticamente a sessão e persistir todos os dados registrados quando o motor é desligado.
Pré-condições: Uma sessão de coleta está ativa.
Fluxo principal:
  1. O piloto desliga o motor da aeronave no simulador.
  2. O sistema detecta o evento de motor desligado.
  3. O sistema encerra a sessão e persiste todos os dados coletados.
Fluxos alternativos: —
Regras aplicadas: RN-004, RN-005
Critérios de aceite:
  - Dado que uma sessão está ativa, quando o piloto desliga o motor no simulador, então o sistema encerra a sessão e todos os parâmetros coletados ficam disponíveis para debriefing.
  - Dado que a sessão foi encerrada, quando o piloto abre a lista de voos, então a sessão recém-encerrada aparece na lista com data, hora e duração.

---

UC-004
Nome: Selecionar voo para debriefing
Ator: Piloto
Objetivo: Escolher um voo registrado para revisar os dados.
Pré-condições: Ao menos uma sessão encerrada existe no sistema.
Fluxo principal:
  1. O piloto acessa a lista de voos registrados.
  2. O sistema exibe as sessões encerradas em ordem cronológica inversa, com data, hora e duração.
  3. O piloto seleciona uma sessão.
  4. O sistema carrega os dados da sessão selecionada e abre a tela de debriefing (UC-005).
Fluxos alternativos:
  A. Nenhuma sessão registrada: o sistema exibe uma mensagem informando que não há voos registrados.
Regras aplicadas: RN-005
Critérios de aceite:
  - Dado que existem sessões registradas, quando o piloto acessa a lista de voos, então todas as sessões são exibidas em ordem cronológica inversa com data, hora e duração.
  - Dado que o piloto seleciona uma sessão, quando a seleção é confirmada, então os dados dessa sessão são carregados e a tela de debriefing é exibida.
  - Dado que não há sessões registradas, quando o piloto acessa a lista de voos, então o sistema exibe uma mensagem informando que não há voos registrados.

---

UC-005
Nome: Visualizar dados do debriefing
Ator: Piloto
Objetivo: Revisar os parâmetros registrados de um voo selecionado para identificar pontos de melhoria.
Pré-condições: O piloto selecionou uma sessão em UC-004.
Fluxo principal:
  1. O sistema exibe os parâmetros do conjunto inicial ao longo do tempo da sessão selecionada.
  2. O piloto navega pelos dados para analisar o comportamento dos parâmetros durante o voo.
Fluxos alternativos: —
Regras aplicadas: RN-002, RN-005
Critérios de aceite:
  - Dado que uma sessão foi selecionada, quando a tela de debriefing é aberta, então todos os parâmetros do conjunto inicial registrados durante aquele voo são exibidos.
  - Dado que os dados estão sendo exibidos, quando o piloto navega pela linha do tempo, então os valores dos parâmetros correspondem ao momento selecionado.

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
