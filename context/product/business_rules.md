# Regras de negócio

> Propósito: Regras de negócio reutilizáveis entre casos de uso, cada uma com um identificador RN-NNN.
> Atualizar quando: uma regra for criada, alterada ou deixar de valer.
> Relacionados: [glossary.md](glossary.md)
> Última atualização: 2026-11-17 · loop-004

## Regras

---

RN-001
Nome: Coleta local
Descrição: A coleta de parâmetros exige que o simulador de voo esteja rodando na mesma máquina que o Blackbox Simulator. Conexão remota não é suportada.
Aplica-se a: UC-001, UC-002, UC-006

---

RN-002
Nome: Conjunto de parâmetros
Descrição: Apenas os parâmetros do conjunto configurado são coletados, registrados e exibidos. Parâmetros fora desse conjunto são ignorados. (Alterada em 2026-11-17: antes "Conjunto inicial de parâmetros"; ampliada pelo UC-006.)
Aplica-se a: UC-001, UC-002, UC-005, UC-006

---

RN-003
Nome: Início automático da sessão
Descrição: A sessão inicia automaticamente quando o motor da aeronave é ligado no simulador. Se o Blackbox Simulator for iniciado com o motor já em funcionamento, a sessão começa a partir daquele momento.
Aplica-se a: UC-001, UC-002, UC-003

---

RN-004
Nome: Encerramento automático da sessão
Descrição: A sessão encerra automaticamente quando a aeronave está no solo e o motor fica parado por 15 s seguidos no simulador.
- Critério: as duas condições (aeronave no solo e motor parado) precisam valer ao mesmo tempo por 15 s seguidos. Motor parado fora do solo (pane em voo) não encerra. Se o motor volta ou a aeronave sai do solo antes dos 15 s, a contagem zera e a sessão continua a mesma. Sem saber se a aeronave está no solo, a sessão não encerra.
- Hora de fim: o início dos 15 s, ou seja, o mais tarde entre o instante em que o motor parou e o instante em que a aeronave tocou o solo. Duração = hora de fim − hora de início, incluindo táxi e períodos sem sinal.
- Queda de conexão: não encerra a sessão. Se a queda ocorre durante a contagem e, ao reconectar, as duas condições continuam valendo, vale o instante original; se alguma deixou de valer, a contagem zera.
- Fechamento e abertura do app: fechar o app não encerra a sessão. Ao abrir, a sessão ativa gravada continua se o motor estiver ligado em até 15 s; se não, é encerrada com a hora da última leitura (sem leitura, a hora de início).
- Sessões antigas: a cada abertura do app, toda sessão ativa exceto a mais recente é encerrada com a hora da última leitura (sem leitura, a hora de início).
- Gravação: a notificação de sucesso só aparece depois de gravado o encerramento. Se a gravação falha, as leituras são mantidas e a próxima abertura do app conclui o encerramento.
(Alterada em 2026-11-17, loop-004: antes "quando o motor da aeronave é desligado"; critério, hora de fim, queda de conexão, abertura do app e sessões antigas explicitados.)
Aplica-se a: UC-002, UC-003

---

RN-005
Nome: Retenção indefinida de registros
Descrição: Os dados de todas as sessões são armazenados indefinidamente. Não há exclusão automática de registros.
Aplica-se a: UC-003, UC-004, UC-005, UC-006

---

RN-006
Nome: Não interferência no simulador
Descrição: O Blackbox Simulator opera em modo passivo: coleta e exibe dados, mas não envia comandos nem altera o estado do simulador.
Aplica-se a: UC-002, UC-003, UC-006

---

RN-007
Nome: Parâmetro não aplicável
Descrição: Se a aeronave em uso não possui o item de um parâmetro do conjunto, o painel exibe "N/A" para esse parâmetro e nenhuma leitura dele é gravada.
- Critério de "não possui": mistura é N/A se o motor não é a pistão; flapes são N/A se a aeronave não tem flapes. Manete, RPM, latitude e longitude nunca são N/A. Um valor 0 válido (flapes recolhidos, RPM com motor parado) continua sendo 0, não N/A.
- Momento: a decisão é tomada pelos dados da aeronave no início da sessão (ao ligar o motor) e vale a sessão toda, mesmo que a aeronave mude durante o voo.
- Prioridade: N/A vence "Sem sinal" ("—"). Com o sinal perdido ou com a sessão encerrada, o parâmetro N/A continua "N/A".
(Alterada em 2026-11-17, loop-003: critério, momento e prioridade explicitados.)
Aplica-se a: UC-002, UC-003, UC-006

---

## Modelo de regra

<!--
RN-001
Nome:
Descrição:
Aplica-se a:
-->
