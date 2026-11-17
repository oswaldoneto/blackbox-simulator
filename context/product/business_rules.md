# Regras de negócio

> Propósito: Regras de negócio reutilizáveis entre casos de uso, cada uma com um identificador RN-NNN.
> Atualizar quando: uma regra for criada, alterada ou deixar de valer.
> Relacionados: [glossary.md](glossary.md)
> Última atualização: 2026-11-17

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
Aplica-se a: UC-001, UC-002

---

RN-004
Nome: Encerramento automático da sessão
Descrição: A sessão encerra automaticamente quando o motor da aeronave é desligado no simulador.
Aplica-se a: UC-002, UC-003

---

RN-005
Nome: Retenção indefinida de registros
Descrição: Os dados de todas as sessões são armazenados indefinidamente. Não há exclusão automática de registros.
Aplica-se a: UC-003, UC-004, UC-005

---

RN-006
Nome: Não interferência no simulador
Descrição: O Blackbox Simulator opera em modo passivo: coleta e exibe dados, mas não envia comandos nem altera o estado do simulador.
Aplica-se a: UC-002, UC-006

---

RN-007
Nome: Parâmetro não aplicável
Descrição: Se a aeronave em uso não possui o item de um parâmetro do conjunto (por exemplo, mistura em motor a turbina ou flapes), o painel exibe "N/A" para esse parâmetro e nenhuma leitura dele é gravada.
Aplica-se a: UC-002, UC-006

---

## Modelo de regra

<!--
RN-001
Nome:
Descrição:
Aplica-se a:
-->
