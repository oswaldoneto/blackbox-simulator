# Loop 003

Loop: 003
Data de início: 2026-11-17
Item do backlog: 7 — Coletar posição, motor e flapes
Caso de uso: UC-006
Fase atual: concluído

---
HITL-1 aprovado em 2026-11-17
HITL-2 aprovado em 2026-11-17
HITL-3 aprovado em 2026-11-17
HITL-4 aprovado em 2026-11-17 (encerramento condicionado ao teste manual no Windows)
Teste manual no Windows com MSFS 2024 aprovado em 2026-11-17 (v0.3.0): início automático da sessão, 12 cards, coordenadas, controles, flapes, N/A, grade e migração sobre a v0.2.0
Loop encerrado em 2026-11-17

## 1.1 Especificação de negócio

### Critérios de aceite confirmados

CA-006-1 a CA-006-5 do use_cases.md estão em Dado/Quando/Então e coerentes com product.md e RN-007 (gravação a cada 1 s; 12 parâmetros no painel; motor 1 em multimotor; "N/A" sem gravação; flapes em % de 0 a 100).

### Ambiguidades e critérios faltantes (decisão humana)

1. Critério de "não possui o item" (N/A versus zero): flapes recolhidos (0%) versus aeronave sem flapes; mistura em turbina ou com mistura automática; manete e RPM podem ser N/A?; latitude e longitude nunca são N/A; 0 válido nunca vira N/A.
2. Momento da decisão de N/A: uma vez por sessão ou durante o voo (inclui troca de aeronave sem desligar o motor).
3. Prioridade entre N/A e "—" (sem sinal) e entre N/A e sessão encerrada com conexão caída.
4. Formato de latitude e longitude: graus decimais ou graus e minutos; hemisfério em letra ou sinal; casas decimais; gravar com precisão total e arredondar só na exibição.
5. Formato dos demais: RPM inteiro ou decimal; manete, mistura e flapes em % inteiro ou decimal; manete com reverso (negativo)?; flapes pela extensão física ou pelo detente.
6. "Motor 1": numeração do simulador; motor 1 desligado com outro ligado dá RPM 0 real. Fora do escopo: qual motor RN-003 e RN-004 observam em multimotor.
7. Debriefing (UC-005): como mostrar parâmetro N/A e se a sessão guarda que ele foi N/A (diferenciar de perda de dados).
8. Sessões antigas (loops 001 e 002) sem os 6 parâmetros novos no debriefing.
9. Painel com 12 cards: ordem, agrupamento, grade e visual do card N/A (diferente do "—").

### Decisões do humano (2026-11-17)

1. Critério de N/A: decidido pelos dados da aeronave no início da sessão e válido a sessão toda. Flapes são N/A se a aeronave não tem flapes; mistura é N/A se o motor não é a pistão. Manete, RPM, latitude e longitude nunca são N/A. Um 0 válido (flapes recolhidos, RPM 0) continua 0.
2. Prioridade: N/A vence "—". Com sinal perdido ou sessão encerrada, o card N/A continua "N/A".
3. Latitude e longitude: graus decimais com hemisfério em letra (N/S, L/O) e 5 casas decimais (ex.: 23,55052° S). O banco grava com precisão total; o arredondamento é só na exibição.
4. Painel: grade de 4 colunas e 3 linhas por grupo. Linha 1 (voo): Altitude MSL, Velocidade IAS, Velocidade vertical, Rumo magnético. Linha 2 (atitude e posição): Arfagem, Rolagem, Latitude, Longitude. Linha 3 (motor e configuração): Manete, Mistura, RPM, Flapes. Abaixo de 600 px, uma coluna.

Padrões assumidos até o HITL-1, que pode mudá-los:
- RPM em inteiro; manete, mistura e flapes em % inteiro.
- Manete com reverso aparece como % negativo (ex.: "−20").
- Flapes pela extensão física da superfície, não pelo detente.
- "Motor 1" é a numeração do simulador; com o motor 1 desligado, RPM 0 é valor real.
- Card N/A mostra o texto "N/A" no lugar do valor, no mesmo estilo do "—".
- Debriefing de parâmetros N/A e de sessões antigas sem os novos parâmetros fica para o UC-005.
- RN-005 entra em "Regras aplicadas" do UC-006; o motor observado por RN-003 e RN-004 em multimotor fica fora do escopo.

### Regras de negócio aplicáveis

- RN-001, RN-002 (conjunto de 6 para 12), RN-006 e RN-007: já listam o UC-006.
- RN-007 ainda não lista o UC-005, apesar do efeito no debriefing.
- Relacionadas fora de "Regras aplicadas": RN-003 e RN-004 (sessão, motor em multimotor) e RN-005 (retenção das leituras novas).

### Termos relevantes do glossário

Conjunto de parâmetros, Conjunto inicial, Manete, Mistura, Flapes, N/A, Sem sinal, Painel de tempo real, Sessão, Debriefing. Faltam: Latitude, Longitude, RPM e Motor 1.

### Impactos propostos no contexto de produto

- UC-006: critério de "possui o item", momento do N/A, prioridade N/A e "—", formatos, latitude e longitude nunca N/A, 0 válido não é N/A, regras aplicadas, "Em aberto" atualizado.
- UC-002: estados sem sinal e encerrada passam a citar N/A; o painel passa a ter 12 parâmetros.
- UC-005: como N/A e sessões antigas aparecem no debriefing.
- RN-007: critério, momento e prioridade; avaliar UC-005 em "Aplica-se a". Possível regra nova de motor de referência.
- glossary.md: Latitude, Longitude, RPM, Motor 1; ajustes em Manete (reverso) e Flapes (detente).
- product.md: formato de latitude e longitude.
- Fora de product/: design.md (grade de 12 cards, estado N/A) e domain_model.md (identificadores dos 6 parâmetros novos).

## 1.2 Refinamento técnico

### Entidades envolvidas

- ParâmetroDeVoo: catálogo de 6 para 12 (migration 002). Slugs propostos: `latitude`, `longitude`, `throttle_1`, `mixture_1`, `rpm_1`, `flaps`.
- LeituraDeParâmetro: grava os 6 novos com valor bruto; parâmetro N/A não gera leitura.
- Sessão: novo atributo `parametrosNaoAplicaveis: string[]`, decidido na criação e persistido (coluna JSON `parametros_nao_aplicaveis`, padrão `'[]'`).
- Tipo interno do main: `PerfilDaAeronave = { motorAPistao, temFlapes }`.

### SimVars (MSFS 2024)

| Uso | SimVar | Unidade | Confiança |
|---|---|---|---|
| Latitude / Longitude | `PLANE LATITUDE` / `PLANE LONGITUDE` | degrees | seguro |
| Manete motor 1 | `GENERAL ENG THROTTLE LEVER POSITION:1` | percent | nome seguro; faixa do reverso a confirmar |
| Mistura motor 1 | `GENERAL ENG MIXTURE LEVER POSITION:1` | percent | seguro |
| RPM motor 1 | `GENERAL ENG RPM:1` | rpm | nome seguro; valor em turbina a confirmar |
| Flapes (extensão física) | `TRAILING EDGE FLAPS LEFT PERCENT` | percent | confirmar unidade no SDK 2024 |
| Tem flapes? | `FLAPS AVAILABLE` | bool | confirmar 0 em aeronave sem flapes |
| Motor a pistão? | `ENGINE TYPE` | enum (0 = pistão) | confirmar valores novos no 2024 |

### Tarefas de implementação

Banco
1. `migrator.ts`: controle de versão com `schema_migrations`, aplicando em ordem só as migrations não registradas, uma transação por migration; bancos antigos rodam a 001 (idempotente) sem efeito.
2. `migrations/002-ampliar-parametros.sql`: 6 parâmetros novos e `ALTER TABLE sessoes ADD COLUMN parametros_nao_aplicaveis TEXT NOT NULL DEFAULT '[]'`.
3. `session-repository.ts`: grava e lê a lista em JSON (inválido vira `[]` com log).

Tipos e IPC
4. `shared/types.ts`: `Sessao.parametrosNaoAplicaveis`. Nenhum canal novo.

SimConnect
5. `simconnect-client.ts`: 6 entradas no `SIMVAR_MAP`; `ENGINE TYPE` e `FLAPS AVAILABLE` na definição do motor; `onEngineStarted` entrega o perfil; listener de `exception`; continua só lendo (RN-006).
6. `parametros-nao-aplicaveis.ts` (novo): `mixture_1` se não é pistão; `flaps` se não tem flapes; demais nunca.
7. `collection-service.ts`: grava a lista na criação da sessão; não grava leitura nem envia no pacote os parâmetros N/A; sessão restaurada usa a lista persistida; troca de aeronave não muda a lista.

Renderer
8. `PARAMETER_DISPLAY_ORDER` com os 12 slugs na ordem da grade 4x3.
9. `format-parameter-value.ts`: `NAO_APLICAVEL = 'N/A'` e formatadores novos.

| Parâmetro | Casas | Regra | Exemplo |
|---|---|---|---|
| Latitude (°) | 5 | valor absoluto + N/S | `23,55052 S` |
| Longitude (°) | 5 | valor absoluto + L/O | `46,63331 O` |
| Manete (%) | 0 | inteiro; reverso com "−" | `85`, `−20` |
| Mistura (%) | 0 | inteiro | `100` |
| RPM (rpm) | 0 | inteiro, milhar | `2.450` |
| Flapes (%) | 0 | inteiro, limitado a 0..100 | `30` |

10. `parameter-indicator.tsx`: prop `naoAplicavel`, valor "N/A", `aria-label` "<rótulo>: não aplicável".
11. `realtime-panel.tsx`: recebe a lista; precedência N/A, depois "—", depois valor.
12. `realtime-panel.css`: 4 colunas; 1 coluna abaixo de 600 px.
13. `App.tsx`: passa a lista da sessão ao painel.

### Testes necessários

Por critério (CA-006-1 a 5), derivação do N/A (4 perfis), N/A sem gravação e com prioridade sobre "—", formatação, repositório (JSON), migrator com mocks (banco novo, banco do loop-002, falha sem registro) e proposta de teste real de SQL com `node:sqlite`. RN-006 continua garantido.

Roteiro manual no Windows (10 passos): migração sobre a v0.2.0; Cessna 172 (12 cards, coordenadas, controles, flapes físicos); bimotor (só motor 1; RPM 0 real); turboélice ou jato (mistura N/A, manete e RPM observados); aeronave sem flapes; N/A com sinal perdido; banco sem leituras de N/A; troca de aeronave; larguras de janela; início de sessão intacto.

### Riscos e dependências

1. Onde mora o N/A: na Sessão persistida (recomendado: sobrevive ao reinício, sem canal novo, prepara o UC-005) ou no pacote de leituras.
2. SimVar inválida pode parar a definição inteira (início de sessão ou os 12 cards); mitigado com listener de `exception` e roteiro manual.
3. `ENGINE TYPE` com valores novos no 2024: qualquer valor diferente de pistão deixa a mistura em N/A.
4. RPM em turbina pode vir 0 ou sem sentido operacional.
5. Faixa do reverso da manete varia por aeronave.
6. Layout: com 4 colunas perto de 600 px, "123,45678 O" em mono 24 px estoura o card.
7. Slugs escritos à mão passam de 3 para 5 lugares.
8. Teste real de SQL depende de aval (`node:sqlite`).
9. Debriefing de N/A e de sessões antigas fica para o UC-005.

### Impactos propostos no contexto

- domain_model.md: atributo novo da Sessão; 12 slugs; catálogo semeado por migrations; N/A sem leitura.
- architecture.md: ADR-008 (N/A pelo perfil da aeronave no início da sessão, persistido, filtrado, prioridade sobre "—"); ajustes em ADR-004, ADR-007 e Canais IPC; slugs em 5 lugares.
- code_conventions.md: Migrator implementado; teste de SQL com `node:sqlite`, se aprovado.
- design.md: grade 4x3 por grupos; estado N/A do indicador.
- usability.md: formatação, rótulos, `aria-label` e texto "N/A".

### Decisões do HITL-1 (2026-11-17)

1. A lista de parâmetros N/A fica na Sessão, decidida ao ligar o motor e gravada no banco (coluna `parametros_nao_aplicaveis`).
2. Grade: 4 colunas acima de 900 px, 2 colunas entre 600 e 900 px, 1 coluna abaixo de 600 px, sempre na ordem dos grupos.
3. IDs dos parâmetros centralizados agora numa constante única em `src/shared/`, usada pelo main e pelo renderer.
4. Padrões aprovados com o plano: rótulo do card "Manete"; latitude e longitude exibidas como "23,55052 S", com "°" no rótulo da unidade; unidade mantida no card N/A; teste real das migrations com o SQLite nativo do Node (`node:sqlite`); demais padrões da seção 1.1 confirmados.

## O que foi feito

### 2.1 Implementar (UC-006)

Tarefas 1 a 13 implementadas com os ajustes do HITL-1. Código de produção compila sem erros (`tsc` do main e do renderer); lint limpo; `dist/main/main/db/migrations` com 001 e 002. Sem commit; nada em context/ alterado pelo developer.

Arquivos novos: `src/shared/parameter-ids.ts` (`PARAMETER_IDS`, `ParametroId`, `TODOS_PARAMETER_IDS`, `isParametroId`), `src/main/db/migrations/002-ampliar-parametros.sql` (coluna `parametros_nao_aplicaveis` e 6 parâmetros: Latitude, Longitude, Manete, Mistura, RPM, Flapes), `src/main/simconnect/parametros-nao-aplicaveis.ts` (`PerfilDaAeronave`, `derivarParametrosNaoAplicaveis`).

Arquivos alterados: `migrator.ts` (`schema_migrations`, ordem por nome, transação por migration, para na falha), `session-repository.ts` (lista em JSON, inválido descartado com log), `shared/types.ts` (`Sessao.parametrosNaoAplicaveis: ParametroId[]`), `simconnect-client.ts` (12 SimVars; `ENGINE TYPE` e `FLAPS AVAILABLE` na definição do motor; perfil no aviso de motor ligado; listener de exceção), `collection-service.ts` (lista gravada na criação; N/A fora do banco e do pacote; sessão restaurada usa a lista), `use-active-parameters.ts` (12 IDs na ordem dos grupos), `format-parameter-value.ts` (`NAO_APLICAVEL` e formatadores novos), `parameter-indicator.tsx` (prop `naoAplicavel`), `realtime-panel.tsx` (precedência N/A, "—", valor), `realtime-panel.css` (4/2/1 colunas), `App.tsx`.

Desvios:
- Lista tipada como `ParametroId[]`; slugs desconhecidos do banco descartados com log.
- Latitude ou longitude exatamente 0 aparece "0,00000" sem letra (a confirmar).
- `flex-wrap: wrap` na linha de valor do card: a unidade desce de linha quando o valor é longo.
- Unidades `'Enum'` e `'Bool'` nas SimVars do perfil.
- Falha numa migration interrompe a inicialização.

Débito:
- `tsconfig.main.json` compila os testes junto: mudança de tipo quebra o `npm run build` até os testes serem atualizados, e os testes vão para `dist/main`.
- SimVar do perfil inválida no MSFS 2024 pode impedir a detecção de motor ligado (só aparece no log).
- `ParametroDeVoo.id` continua `string`; painel e coleta comparam com `string`.
- A confirmar no Windows: faixa do reverso, RPM em turbina, `FLAPS AVAILABLE` em aeronave sem flapes.

Testes quebrados pelas novas interfaces: 10 falhas (`migrator.test.ts` 1, `collection-service.test.ts` 7, `use-active-parameters.test.ts` 2) e erros de tipo em testes que montam sessões sem o campo novo.

## Testes

### 2.2 Testar (UC-006)

Resultado: 23 arquivos e 296 testes passando; `npm run build` (que compila os testes do main), `tsc` do renderer e lint sem erros. Só arquivos de teste editados.

Testes antigos ajustados às novas interfaces: `collection-service.test.ts` (perfil da aeronave ao ligar o motor), `migrator.test.ts` (controle por `schema_migrations`), `use-active-parameters.test.ts` (12 parâmetros) e o campo `parametrosNaoAplicaveis` nas sessões de 7 arquivos de teste.

Testes novos: `parametros-nao-aplicaveis.test.ts` (4 perfis), `simconnect-client.test.ts` (12 SimVars, sufixo `:1`, definição do motor com o perfil, listener de exception, RN-006), `collection-service.test.ts` (lista gravada, N/A fora do banco e do pacote, 0 válido gravado, sessão restaurada, troca de aeronave), `session-repository.test.ts` (JSON e inválido), `migrator.test.ts` (mocks), `migrator-sqlite.test.ts` (SQL real com `node:sqlite`: banco novo, banco do loop-002 com dados, reexecução, falha desfeita), `format-parameter-value.test.ts`, `parameter-indicator.test.tsx`, `realtime-panel.test.tsx`, `App.test.tsx`.

Cobertura: 100% em `main/db`; `main/simconnect` com 100% de linhas e 98,66% de ramos (ramo defensivo inalcançável); total 90,87% de linhas.

Conferência no app (macOS, banco real do loop-002): a migração registrou 001 e 002 em `schema_migrations`, o catálogo ficou com 12 parâmetros ativos e o console não teve erros.

Observações: ramo `?? []` em `App.tsx` inalcançável; `migrator-sqlite.test.ts` também vai para `dist/main` (débito do `tsconfig.main.json`).

### Decisões do HITL-2 (2026-11-17)

- Confirmados: latitude ou longitude exatamente 0 aparece "0,00000" sem letra; a unidade desce de linha quando o valor é longo.
- Falha numa migration impede o app de iniciar (só log): fica como está neste loop e vira débito técnico (mostrar mensagem ao piloto).

## Revisão e decisões

### 3. Revisão (2026-11-17)

Os 4 revisores aprovaram sem bloqueantes. Pendência para antes do encerramento: roteiro manual no Windows com MSFS 2024, com atenção ao passo 10 (o início automático da sessão continua funcionando com `ENGINE TYPE` e `FLAPS AVAILABLE` na definição do motor).

#### 3.1 Funcionalidade
CA-006-1 a CA-006-5 e RN-006 atendidos; UC-002 sem regressão.
Não bloqueantes:
1. Início automático da sessão (UC-001) depende de o MSFS 2024 aceitar as SimVars do perfil na definição do motor; só o Windows confirma.
2. A confirmar no Windows: faixa do reverso, RPM em turbina, `FLAPS AVAILABLE` = 0 sem flapes, valores de `ENGINE TYPE` no 2024, unidade de `TRAILING EDGE FLAPS LEFT PERCENT`.
3. Falha de migration impede o app de iniciar (débito do HITL-2).
4. Para Documentar: "Em aberto" do UC-006 já decidido; UC-002 sem menção a N/A e aos 12 parâmetros.

#### 3.2 Qualidade
Lint, testes (296), cobertura, build, `tsc` do renderer e do preload sem erros; nenhum `any`.
Não bloqueantes:
1. `migrator-sqlite.test.ts` usa `require('fs')` e `require('path')` com `eslint-disable`; um `import` estático dispensaria os dois.
2. `readonly string[]` no painel e na coleta (consequência do débito de `ParametroDeVoo.id` como `string`).
3. Seção "Migrator" de code_conventions.md desatualizada (prevista para a 4.2).
Débitos confirmados: `tsconfig.main.json` compila testes; falha de migration impede a inicialização; SimVar de perfil inválida pode bloquear o início da sessão; validações pendentes no Windows.

#### 3.3 Usabilidade
Grade, N/A, contraste, leitor de tela e formatação conformes.
Não bloqueantes:
1. Abaixo de 900 px os 12 cards podem exigir rolagem (consequência aceita da grade 4/2/1).
2. Grupos sem título ou separador; a 2 colunas a divisão se perde.
3. Manete, Mistura e RPM não indicam que a leitura é do motor 1 (pode confundir em bimotor).

#### 3.4 Arquitetura
Separação main/renderer, N/A decidido só no main, RN-006, IPC sem canal novo, IDs centralizados, migração segura para bancos existentes e ordem de inicialização conformes.
Não bloqueantes:
1. A definição do motor junta a detecção de motor ligado com o perfil da aeronave (registrar na ADR e no roteiro).
2. `shared/parameter-ids.ts` exporta uma função pura (`isParametroId`); a convenção de `shared/` fala só em tipos e constantes.
3. IDs ainda tipados como `string` em `ParametroDeVoo`, `LeituraDeParametro`, `LeituraDoPacote` e no painel.
4. Ordem das migrations depende do prefixo de 3 dígitos (`.sort()` lexicográfico).
5. Débitos já aceitos: falha de migration impede a inicialização; testes em `dist/main`.

### Decisões do HITL-3 (2026-11-17)

- O produto suporta, por enquanto, só aeronaves de um motor. Os rótulos ficam "Manete", "Mistura" e "RPM", sem indicar o motor. Para a fase Documentar: registrar multimotor como fora do escopo no product.md e ajustar o UC-006 (o CA-006-3 deixa de ser critério; o código continua lendo o motor 1).
- Grupos de cards sem título ou separador: débito de UX, para um loop de UX do painel junto com a maximização (item 6).
- Revisão aprovada; os demais itens menores viram débito técnico. Encerramento condicionado ao teste manual no Windows.

### 4. Documentação (2026-11-17)

- 4.1 Produto: multimotor fora do escopo em product.md; formatos de exibição e critério de N/A; RN-007 com critério, momento e prioridade; RN-005 vale para o UC-006; UC-006 reescrito (sem o caso multimotor; N/A detalhado; status "Em andamento"); UC-002 com 12 parâmetros e N/A; UC-005 com "Em aberto" sobre N/A e sessões antigas; glossário com Latitude, Longitude e RPM. Perguntas: numerar os dois critérios novos de formato; exemplo de latitude no formato do HITL-1.
- 4.2 Engenharia: domain_model.md com `parametrosNaoAplicaveis`, 12 slugs, catálogo semeado por migrations e tipos de transporte; architecture.md com ADR-008, ADR-004 e ADR-007 revistas, canais e slugs resolvidos; code_conventions.md com migrator implementado, `parameter-ids.ts`, teste com `node:sqlite`. Em aberto: funções puras em `shared/`, tipagem dos IDs, `require` no teste.
- 4.3 ADLC: débito técnico (10 itens), roteiro do Windows (10 passos, o primeiro é o início automático da sessão), lições LL-012 a LL-015, backlog (item 7 concluído; débitos de UX do painel juntados ao item 6). Respostas do orquestrador: o passo do bimotor sai do roteiro (escopo de um motor) e o termo "Motor 1" não entra no glossário.
- 4.4 UX: design.md com grade 4x3 por grupos, regra de 4/2/1 colunas, estado N/A e débitos de UX; usability.md com 12 rótulos, formatação dos 6 novos, texto "N/A" e leitor de tela. Pergunta: regra para mistura negativa.

### Decisões do HITL-4 (2026-11-17)

- Critérios de formato do UC-006 numerados como CA-006-6 e CA-006-7; CA-006-3 marcado como retirado.
- Mistura negativa: exibida como vier do simulador, sem limitar; nada a mudar.
- Publicar a v0.3.0 (merge na main e tag) para o teste manual no Windows.

## Débito técnico do loop

Lista única dos itens que foram para débito (débitos do developer na 2.1, observações da 2.2, decisões do HITL-2 e do HITL-3). Não estão aqui: os rótulos de Manete, Mistura e RPM sem o motor (resolvidos no HITL-3 pelo escopo de um motor só), os ajustes de contexto previstos para a fase Documentar e as validações no Windows (pendência abaixo).

Funcionalidade e estados
1. Falha numa migration impede o app de iniciar e só aparece no log; o piloto deveria ver uma mensagem (HITL-2).
2. SimVar do perfil (`ENGINE TYPE`, `FLAPS AVAILABLE`) inválida no MSFS 2024 pode impedir a detecção de motor ligado e o início da sessão; só aparece no log. A definição do motor junta a detecção de motor ligado com o perfil da aeronave (registrar na ADR).

Usabilidade
3. Grupos de cards sem título ou separador; a 2 colunas a divisão entre os grupos se perde (HITL-3: loop de UX do painel junto com a maximização, item 6 do backlog).
4. Abaixo de 900 px os 12 cards podem exigir rolagem (consequência aceita da grade 4/2/1).

Qualidade e arquitetura
5. `tsconfig.main.json` compila os testes junto: uma mudança de tipo quebra o `npm run build` até os testes serem atualizados, e os testes (inclusive `migrator-sqlite.test.ts`) vão para `dist/main`.
6. IDs dos parâmetros ainda tipados como `string` em `ParametroDeVoo`, `LeituraDeParametro`, `LeituraDoPacote`, no painel e na coleta (`readonly string[]`), apesar de `ParametroId` em `shared/parameter-ids.ts`.
7. `migrator-sqlite.test.ts` usa `require('fs')` e `require('path')` com `eslint-disable`; um `import` estático dispensaria os dois.
8. `shared/parameter-ids.ts` exporta uma função pura (`isParametroId`); a convenção de `shared/` fala só em tipos e constantes.
9. Ordem das migrations depende do prefixo de 3 dígitos no nome (`.sort()` lexicográfico).
10. Ramos inalcançáveis: `?? []` em `App.tsx` e um ramo defensivo em `main/simconnect` (98,66% de ramos).

### Pendência antes do encerramento (não é débito)

Roteiro manual no Windows com MSFS 2024, sobre um instalador gerado da branch do loop (como no loop-002):

1. **Início automático da sessão (UC-001) intacto com `ENGINE TYPE` e `FLAPS AVAILABLE` na definição do motor.** É o ponto de maior risco: se o MSFS 2024 rejeitar uma dessas SimVars, a detecção de motor ligado pode parar e nenhuma sessão começa.
2. Migração sobre o banco da v0.2.0 (001 e 002 em `schema_migrations`, 12 parâmetros no catálogo, sessões antigas preservadas).
3. Cessna 172: 12 cards na ordem dos grupos, coordenadas no formato "23,55052 S", manete, mistura e RPM acompanhando os controles, flapes pela extensão física.
4. Turboélice ou jato: mistura em "N/A"; manete e RPM observados (valor de RPM em turbina e faixa do reverso).
5. Aeronave sem flapes: flapes em "N/A" (`FLAPS AVAILABLE` = 0).
6. N/A continua "N/A" com o sinal perdido e com a sessão encerrada.
7. Banco sem leituras dos parâmetros N/A.
8. Troca de aeronave sem desligar o motor não muda a lista de N/A.
9. Larguras de janela: 4 colunas acima de 900 px, 2 entre 600 e 900 px, 1 abaixo de 600 px.
10. Conferir os valores de `ENGINE TYPE` no 2024 e a unidade de `TRAILING EDGE FLAPS LEFT PERCENT`.

Pergunta para o humano: o passo do bimotor previsto na 1.2 (só motor 1; RPM 0 real) continua no roteiro, já que o HITL-3 limitou o produto a aeronaves de um motor?

## Contexto atualizado

Resumo do que a fase Documentar atualiza, por área, conforme os impactos propostos nas etapas 1.1, 1.2 e 3 e as decisões dos HITL. As etapas 4.1, 4.2 e 4.4 rodam em paralelo com esta; o resultado de cada uma é conferido no HITL-4.

### 4.1 Produto
- `use_cases.md` (UC-006): critério de "possui o item" (flapes N/A sem flapes; mistura N/A sem motor a pistão; manete, RPM, latitude e longitude nunca N/A; 0 válido continua 0); N/A decidido no início da sessão e válido a sessão toda; N/A vence "—"; formatos; "Em aberto" atualizado (itens já decididos); regras aplicadas (RN-005). Pelo HITL-3, o CA-006-3 (motor 1 em multimotor) deixa de ser critério; o código continua lendo o motor 1.
- `use_cases.md` (UC-002): estados sem sinal e encerrada citam N/A; painel com 12 parâmetros.
- `use_cases.md` (UC-005): debriefing de parâmetros N/A e de sessões antigas sem os novos parâmetros fica em aberto para esse UC.
- `business_rules.md` (RN-007): critério, momento e prioridade do N/A; avaliar UC-005 em "Aplica-se a".
- `glossary.md`: Latitude, Longitude, RPM; Manete (reverso como % negativo) e Flapes (extensão física, não detente). O termo "Motor 1" proposto na 1.1 deve ser reavaliado diante do escopo de um motor.
- `product.md`: formato de latitude e longitude (graus decimais, 5 casas, hemisfério em letra, precisão total no banco); multimotor fora do escopo (HITL-3).

### 4.2 Engenharia
- `domain_model.md`: `Sessao.parametrosNaoAplicaveis` (coluna JSON `parametros_nao_aplicaveis`); 12 slugs; catálogo semeado por migrations; parâmetro N/A não gera leitura.
- `architecture.md`: ADR-008 (N/A pelo perfil da aeronave no início da sessão, persistido na Sessão, filtrado do banco e do pacote, prioridade sobre "—"; definição do motor junta a detecção de motor ligado e o perfil); ajustes em ADR-004, ADR-007 e "Canais IPC" (nenhum canal novo); IDs centralizados em `src/shared/parameter-ids.ts`.
- `code_conventions.md`: seção "Migrator" (controle por `schema_migrations`, ordem pelo prefixo, transação por migration, falha interrompe a inicialização); teste real de SQL com `node:sqlite`; situação de `shared/` com função pura.

### 4.3 ADLC
- `loop_reports/loop-003.md`: "Débito técnico do loop", pendência do Windows, "Contexto atualizado" e "Lições".
- `lessons_learned.md`: LL-012 a LL-015.
- `backlog.md`: item 7 movido para Concluídos; "Em andamento" vazio; item 6 ampliado com os débitos de UX do painel (títulos ou separadores dos grupos, rolagem abaixo de 900 px).
- `loop_report.md`: linha do loop-003 adicionada no encerramento, após o HITL-4 e o teste no Windows.

### 4.4 UX
- `design.md`: grade de 12 cards em 3 grupos (voo; atitude e posição; motor e configuração), 4 colunas acima de 900 px, 2 entre 600 e 900 px, 1 abaixo de 600 px; estado N/A do indicador (texto "N/A" no estilo do "—", unidade mantida); unidade desce de linha quando o valor é longo.
- `usability.md`: formatação dos 6 parâmetros novos (latitude e longitude "23,55052 S" e "46,63331 O", "0,00000" sem letra no zero; manete com "−" no reverso; RPM com milhar); rótulos "Manete", "Mistura" e "RPM" sem indicar o motor; "°" no rótulo da unidade; `aria-label` "<rótulo>: não aplicável"; débitos de UX em aberto (grupos sem título, rolagem).

## Lições

Ver `context/adlc/lessons_learned.md` (LL-012 a LL-015).

- LL-012: `tsconfig.main.json` compilando os testes embaralha a fronteira entre 2.1 e 2.2.
- LL-013: teste real das migrations com `node:sqlite` e migração sobre o banco real do loop anterior.
- LL-014: decisões de produto antes do loop reduzem as perguntas da 1.1; aprofundar o `/context-product`.
- LL-015: decisão de escopo no HITL-3 simplificou o UC.
