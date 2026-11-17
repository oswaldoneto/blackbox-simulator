# Modelo de domínio

> Propósito: Entidades e dados que o produto trata, e como se relacionam.
> Atualizar quando: uma entidade, atributo ou relacionamento mudar.
> Relacionados: [../product/glossary.md](../product/glossary.md), [../product/business_rules.md](../product/business_rules.md)
> Última atualização: 2026-11-17 · loop-003

## Entidades

### Sessão
Representa um voo completo, do momento em que o motor é ligado até ser desligado.

| Atributo | Tipo | Descrição |
|----------|------|-----------|
| id | UUID | Identificador único gerado automaticamente |
| iniciadaEm | datetime (UTC) | Momento em que a coleta começou |
| encerradaEm | datetime (UTC) \| null | Momento em que a coleta encerrou; null se a sessão ainda está ativa |
| duracao | duration (s) | Calculado: encerradaEm − iniciadaEm; null enquanto ativa |
| aeronave | string | Nome da aeronave fornecido pelo simulador (ex.: "Cessna 172 Skyhawk") |
| aerodromoOrigem | string \| null | Código ICAO ou nome do aeródromo de saída, se disponível no simulador |
| aerodromoDestino | string \| null | Código ICAO ou nome do aeródromo de chegada, se disponível no simulador |
| status | enum: ativa \| encerrada | Estado atual da sessão |
| parametrosNaoAplicaveis | ParametroId[] | Parâmetros que a aeronave da sessão não possui (RN-007), exibidos como "N/A". Decidido uma vez, ao ligar o motor, pelo perfil da aeronave, e válido a sessão toda (ver ADR-008 em [architecture.md](architecture.md)). Persistido na coluna `parametros_nao_aplicaveis` (TEXT com lista JSON, padrão `'[]'`). Sessões criadas antes da migration 002 ficam com `[]`. JSON inválido ou slug desconhecido lido do banco é descartado, com log |

Regra de N/A (loop-003): `mixture_1` é N/A se o motor não é a pistão; `flaps` é N/A se a aeronave não tem flapes. Manete, RPM, latitude, longitude e os 6 parâmetros do conjunto inicial nunca são N/A. Um 0 válido (flapes recolhidos, RPM 0) continua 0.

---

### ParâmetroDeVoo
Descreve um tipo de grandeza que pode ser coletada do simulador.

| Atributo | Tipo | Descrição |
|----------|------|-----------|
| id | string (slug) | Identificador técnico do parâmetro (ex.: `altitude_msl`, `airspeed_ias`). Os slugs conhecidos estão em `PARAMETER_IDS` (`src/shared/parameter-ids.ts`), com o tipo `ParametroId`; o atributo ainda é tipado como `string` (ver "Em aberto" em [architecture.md](architecture.md)) |
| nome | string | Nome legível para exibição (ex.: "Altitude MSL", "Velocidade IAS") |
| unidade | string | Unidade de medida (ex.: "ft", "kt", "°", "fpm") |
| ativo | boolean | Indica se faz parte do conjunto inicial de parâmetros coletados |

Conjunto de parâmetros (12, todos com `ativo = true`):

| Slug | Nome | Unidade | Desde |
|------|------|---------|-------|
| `altitude_msl` | Altitude MSL | ft | loop-001 (migration 001) |
| `airspeed_ias` | Velocidade IAS | kt | loop-001 (migration 001) |
| `vertical_speed` | Velocidade vertical | fpm | loop-001 (migration 001) |
| `heading_magnetic` | Rumo magnético | ° | loop-001 (migration 001) |
| `pitch` | Arfagem | ° | loop-001 (migration 001) |
| `bank` | Rolagem | ° | loop-001 (migration 001) |
| `latitude` | Latitude | ° | loop-003 (migration 002) |
| `longitude` | Longitude | ° | loop-003 (migration 002) |
| `throttle_1` | Manete | % | loop-003 (migration 002) |
| `mixture_1` | Mistura | % | loop-003 (migration 002) |
| `rpm_1` | RPM | rpm | loop-003 (migration 002) |
| `flaps` | Flapes | % | loop-003 (migration 002) |

Os slugs com sufixo `_1` leem o motor 1 do simulador. O produto suporta, por enquanto, só aeronaves de um motor (decisão do HITL-3 do loop-003); o sufixo fica no slug e o rótulo não indica o motor.

O catálogo é semeado por migrations SQL (`INSERT OR IGNORE` em `parametros_de_voo`): a 001 traz os 6 primeiros, a 002 os 6 novos.

---

### LeituraDeParâmetro
Valor de um parâmetro em um instante específico de uma sessão.

| Atributo | Tipo | Descrição |
|----------|------|-----------|
| sessaoId | UUID | Referência à Sessão à qual esta leitura pertence |
| parametroId | string (slug) | Referência ao ParâmetroDeVoo |
| timestamp | datetime (UTC) | Momento exato da leitura |
| valor | float | Valor numérico medido naquele instante |

Frequência de coleta: 1 leitura por segundo por parâmetro ativo (revisável nos ciclos de desenvolvimento).

O `valor` é gravado bruto, como vem do SimConnect. Correções de sinal e arredondamentos para exibição (arfagem positiva com o nariz para cima; rolagem em valor absoluto com E/D; latitude e longitude com 5 casas e hemisfério em letra) são feitos só no renderer (decisões do HITL-1 do loop-002 e do loop-003). Latitude e longitude são gravadas com precisão total.

Parâmetro N/A na sessão (`Sessao.parametrosNaoAplicaveis`) não gera LeituraDeParâmetro nem entra no PacoteDeLeituras. Um 0 válido é gravado normalmente.

## Tipos de transporte

Não são entidades do domínio nem são persistidos. Existem só para levar dados do main ao renderer pelo IPC (ver ADR-007 em [architecture.md](architecture.md)) e vivem em `src/shared/types.ts`.

| Tipo | Forma | Uso |
|------|-------|-----|
| EstadoConexao | `'conectado' \| 'desconectado'` | Estado da conexão do main com o SimConnect; base do estado "sem sinal" do painel |
| PacoteDeLeituras | `{ sessaoId, timestamp, leituras: { parametroId, valor }[] }` | Leituras de um ciclo de coleta (1 s), enviadas ao renderer só com sessão ativa, num caminho separado da gravação das LeituraDeParâmetro no banco. Até 12 leituras; os parâmetros N/A da sessão ficam de fora |
| ParametroId | união dos slugs de `PARAMETER_IDS` | Identificador de parâmetro conhecido, em `src/shared/parameter-ids.ts`. Usado em `Sessao.parametrosNaoAplicaveis` |

Tipo interno do main (não vai ao renderer): `PerfilDaAeronave = { motorAPistao, temFlapes }`, lido do simulador ao ligar o motor e usado só para derivar `parametrosNaoAplicaveis` (`src/main/simconnect/parametros-nao-aplicaveis.ts`).

## Relacionamentos

- Uma **Sessão** possui zero ou mais **LeituraDeParâmetro** (0..*).
- Cada **LeituraDeParâmetro** pertence a exatamente uma **Sessão** e a exatamente um **ParâmetroDeVoo**.
- **ParâmetroDeVoo** existe independentemente de sessões; é um catálogo fixo, semeado pelas migrations SQL, com os slugs espelhados em `PARAMETER_IDS`.
- Uma **Sessão** referencia zero ou mais **ParâmetroDeVoo** como não aplicáveis (`parametrosNaoAplicaveis`, lista de slugs guardada na própria sessão, sem tabela de ligação).

## Diagrama

```mermaid
classDiagram
  class Sessao {
    +UUID id
    +datetime iniciadaEm
    +datetime|null encerradaEm
    +duration|null duracao
    +string aeronave
    +string|null aerodromoOrigem
    +string|null aerodromoDestino
    +enum status
    +ParametroId[] parametrosNaoAplicaveis
  }

  class ParametroDeVoo {
    +string id
    +string nome
    +string unidade
    +boolean ativo
  }

  class LeituraDeParametro {
    +UUID sessaoId
    +string parametroId
    +datetime timestamp
    +float valor
  }

  Sessao "1" --> "0..*" LeituraDeParametro : possui
  ParametroDeVoo "1" --> "0..*" LeituraDeParametro : descreve
  Sessao "0..*" ..> "0..*" ParametroDeVoo : não aplicáveis
```
