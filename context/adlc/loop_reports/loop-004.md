# Loop 004

Loop: 004
Data de início: 2026-11-17
Item do backlog: 3 — Encerrar sessão de coleta
Caso de uso: UC-003
Fase atual: concluído

---
HITL-1 aprovado em 2026-11-17
HITL-2 aprovado em 2026-11-17
HITL-3 retorno: corrigir 2 ajustes de tela (mensagem de erro do encerramento e tempo da notificação) — 2026-11-17
HITL-2 (2ª rodada) aprovado em 2026-11-17, com revisão curta (usabilidade)
HITL-3 aprovado em 2026-11-17
HITL-4 aprovado em 2026-11-17 (encerramento condicionado ao teste manual no Windows)
Teste manual no Windows com MSFS 2024 aprovado em 2026-11-17 (v0.4.0): roteiro de 14 passos (sessões antigas, voo normal, táxi, motor que volta, pane em voo, religamento, abertura do app, queda de conexão, pausa, menu, aeronaves)
Loop encerrado em 2026-11-17

## 1.1 Especificação de negócio

### Critérios de aceite atuais e problemas

- CA-003-1: "Dado que uma sessão está ativa, quando o piloto desliga o motor no simulador, então o sistema encerra a sessão e todos os parâmetros coletados ficam disponíveis para debriefing." Confirmados o gatilho (RN-004) e o efeito visível (painel congelado com aviso, notificação "Sessão encerrada. Dados salvos.", barra "Encerrada"). "Disponíveis para debriefing" não é verificável sem o UC-005; proposta: status encerrada, hora de fim gravada, duração calculável e leituras preservadas.
- CA-003-2: "quando o piloto abre a lista de voos, então a sessão recém-encerrada aparece na lista com data, hora e duração." Depende do UC-004 (não entregue). Proposta: este loop grava `encerradaEm` e o status; a exibição na lista fica no UC-004, que já tem esse critério.

### Critérios faltantes (decisão humana)

1. O que conta como "motor desligado": combustão falsa na hora ou após N segundos; hora de fim no instante da parada ou no fim da espera. Uma pane em voo com planeio partiria o voo em dois se o encerramento for imediato.
2. Simulador caído ou conexão perdida com sessão ativa; app fechado com sessão ativa; app reaberto com motor desligado e sessão ativa gravada (hora de fim: última leitura, fechamento ou reabertura).
3. Sessões órfãs das versões v0.1.0 a v0.3.0 (status ativa, sem hora de fim): encerrar quando, com que hora de fim; órfã sem leituras.
4. Motor religado após o encerramento: nova sessão (RN-003), sem reabrir a anterior; religamento logo em seguida.
5. Sessão muito curta (ex.: 5 s): gravar e mostrar, ou descartar/ocultar (descartar conflita com RN-005).
6. "Persistir todos os dados": as leituras já são gravadas a cada 1 s; confirmar que o encerramento grava só `encerradaEm` e o status; leitura do último ciclo; notificação só após confirmar a gravação; falha ao gravar o encerramento.
7. Duração: `encerradaEm − iniciadaEm` (motor ligado a motor desligado, incluindo táxi e períodos sem sinal); formato fica para o UC-004.
8. Painel após o encerramento: até quando mostra "Sessão encerrada"; ao reabrir o app, mostra a última sessão encerrada ou a orientação.

### Decisões do humano (2026-11-17)

1. Encerramento: a sessão encerra quando a aeronave está no solo e o motor fica parado por 15 s seguidos. Pane em voo não encerra; motor que volta antes dos 15 s mantém a mesma sessão.
2. Queda do simulador ou app fechado com sessão ativa: a queda de conexão não encerra (painel em "Sem sinal"). Ao abrir o app, uma sessão ativa gravada é encerrada com a hora da última leitura se o motor não estiver ligado; se estiver ligado, a sessão continua (comportamento atual).
3. Sessões antigas (v0.1.0 a v0.3.0) sem encerramento: encerradas na atualização com hora de fim igual à última leitura; sem leitura, hora de fim igual à hora de início (duração 0). Exceção: a mais recente continua se o motor estiver ligado ao abrir.
4. Sessão curta: toda sessão fica gravada (RN-005). Ocultar voos curtos, se preciso, é filtro da lista de voos (UC-004).

Padrões assumidos até o HITL-1, que pode mudá-los:
- Hora de fim: o início do período de 15 s em que as duas condições valem (motor parado e aeronave no solo), ou seja, o mais tarde entre o instante em que o motor parou e o instante do toque no solo.
- CA-003-2 sai do UC-003: este loop grava `encerradaEm` e o status; a exibição na lista fica no UC-004. CA-003-1 reescrito como verificável (status encerrada, hora de fim, leituras preservadas). Critérios numerados.
- Persistência no encerramento: só `encerradaEm` e o status (as leituras já são gravadas a cada 1 s); a notificação "Sessão encerrada. Dados salvos." sai depois de confirmada a gravação; se a gravação falhar, log e notificação de erro "Não foi possível salvar o encerramento da sessão.".
- Duração = `encerradaEm − iniciadaEm`, incluindo táxi e períodos sem sinal; formato fica para o UC-004.
- Painel após o encerramento: "Sessão encerrada" com valores congelados até o motor ser religado (nova sessão, RN-003) ou o app ser fechado; ao reabrir, a orientação "Inicie o simulador e ligue o motor para começar".
- Religamento após o encerramento: sempre uma nova sessão; nunca reabre a anterior.
- Glossário: alinhar "Voo" com "Sessão" (do motor ligado ao encerramento) e criar "Sessão encerrada" e "Duração".
- RN-006 e RN-007 passam a listar o UC-003.

### Regras de negócio aplicáveis

- RN-004 (central; sem critério de detecção, tempo mínimo nem casos de queda ou fechamento).
- RN-005 (retenção; conflita com descarte de sessões curtas).
- RN-003 (religamento inicia nova sessão).
- RN-007 (N/A continua na sessão encerrada).
- RN-006 (só observa; ainda não lista o UC-003).
- RN-001 (indireta, queda de conexão).

### Termos relevantes do glossário

Sessão, Voo (definição "da decolagem até o pouso" não bate com a do produto, "do motor ligado ao desligado"), Painel de tempo real, Sem sinal, N/A, Debriefing. Termos sugeridos: Sessão encerrada, Duração, Lista de voos, Sessão órfã (se tratada), Motor desligado (se houver tempo mínimo).

### Impactos propostos no contexto de produto

- UC-003: reescrever CA-003-1 verificável; mover CA-003-2 para o UC-004 e deixar critério de gravar hora de fim e duração; numerar critérios; fluxos alternativos conforme decisões; RN-003 e RN-007 (e RN-006) em "Regras aplicadas"; status "Em andamento". UC-002 fluxo B: atualizar "Só ocorre no uso real depois do UC-003".
- RN-004: critério de motor desligado, queda, fechamento, hora de fim, órfãs. RN-005 ou regra nova se houver sessão mínima. RN-006 e RN-007 com o UC-003.
- glossary.md: termos novos e alinhamento de "Voo".

## 1.2 Refinamento técnico

### Observações do estado atual

- `session:get-active` lê o banco direto; com a verificação na abertura, passa a ler a memória do `CollectionService`.
- `buscarSessaoAtiva` usa `LIMIT 1` sem `ORDER BY` (sessão restaurada arbitrária com várias órfãs).
- Religamento já cria sessão nova se o encerramento zerar `sessaoAtiva`; `criarSessao` sempre gera UUID novo.
- O renderer já trata `session:ended` (notificação, valores congelados, barra "Encerrada"); falta o caminho de erro.
- `leituras_de_parametro` sem índice.
- `CollectionService.encerrar()` fecha o cliente SimConnect; nome colide com encerramento de sessão.

### Tarefas de implementação

1. `simconnect-client.ts`: definição própria `DEF_ID_GROUND` com `SIM ON GROUND` (Bool, INT32, período SECOND), fora da definição do motor (falha só impede o encerramento, não o início). Callbacks `onEngineSample` e `onGroundSample`.
2. `detector-de-encerramento.ts` (novo): máquina de estados pura medida pelos instantes das amostras (sem timer); `ENCERRAMENTO_LIMITE_MS = 15000`; hora de fim = primeira amostra com motor parado e no solo; zera se o motor volta ou sai do solo; "no solo" desconhecido nunca encerra.
3. `collection-service.ts`: liga o detector; queda de conexão zera o detector e não encerra; `encerrarSessao` grava, zera a sessão e emite `onSessaoEncerrada` só após gravar, ou `onFalhaAoEncerrar` na falha; renomear `encerrar()` para `fecharConexao()`.
4. Abertura: sessão gravada fica "em verificação" (sem gravar leituras, sem pacote, `getSessaoAtual()` nulo). Primeira amostra do motor ligada confirma (com "Coleta iniciada"); parada encerra com a última leitura (ou hora de início), sem notificação. Sem amostra até `VERIFICACAO_ABERTURA_MS`, encerra.
5. `session-handler.ts` / `index.ts`: `session:get-active` usa getter da memória; remove `_getWindow`.
6. `session-repository.ts`: `encerrarSessao(id, encerradaEm)` (só de ativa; erro se não mudar uma linha); `buscarSessaoAtiva` ordenada pela mais recente.
7. `reading-repository.ts`: `buscarUltimaLeituraEm(sessaoId)` via `MAX(timestamp)`.
8. Sessões antigas: encerrar todas as ativas exceto a mais recente (que vai para a verificação da tarefa 4). Opções: (a) migration 003 única; (b) rotina a cada abertura (repara também falhas de gravação). Possível índice `(sessao_id, timestamp)` na migration 003.
9. Falha ao gravar: canal push novo `session:end-failed`; main loga e tira a sessão da memória (religamento abre nova); no banco fica ativa e é encerrada na próxima abertura; sem nova tentativa.
10. `index.ts`: liga `onSessaoEncerrada` a `emitSessionEnded` e `onFalhaAoEncerrar` a `emitSessionEndFailed`; chama a rotina da tarefa 8; fechar o app não encerra a sessão.
11. Renderer: `use-active-session` trata `end-failed` como encerrada para exibição; `App.tsx` mostra "Não foi possível salvar o encerramento da sessão." como erro.
12. Constantes no main.

### Testes necessários

Detector com amostras e instantes explícitos (15 s, 14 s, motor que volta, sai do solo, pane em voo, pane seguida de pouso, corte após pouso, solo desconhecido); serviço (gravação antes da emissão, nada gravado depois, queda sem encerrar, religamento com sessão nova, motor que tosse mantém a sessão, verificação na abertura com fake timers); repositórios com SQL real (`encerrarSessao`, `buscarSessaoAtiva`, `buscarUltimaLeituraEm`); sessões antigas sobre banco do loop-003; cliente SimConnect (definição de solo, motor inalterado); renderer (notificações de sucesso e erro); IPC.

Roteiro manual no Windows (14 passos): migração de sessões antigas sobre a v0.3.0; voo normal com corte; táxi com paradas; corte e religamento antes de 15 s; motor que tosse; pane em voo com planeio; religamento após encerramento; fechar e reabrir app com motor ligado, com motor cortado e sem simulador; simulador fechado em voo; pausa; menu e novo voo; `SIM ON GROUND` sem exceção em 2 aeronaves (e hidroavião, se possível).

### Riscos e dependências

- `SIM ON GROUND` no MSFS 2024 a confirmar (hidroavião, quique, slew, menu); definição isolada limita a falha ao não encerramento.
- Prazo da verificação na abertura: sem dados não há resposta segura; prazo curto pode partir um voo em dois se o SimConnect demorar.
- Leituras gravadas durante a espera de 15 s ficam depois de `encerradaEm`.
- Queda de conexão na janela de 15 s zera a contagem e pode inflar a duração.
- Menu e novo voo sem cortar o motor: dois voos numa sessão (limitação conhecida).
- Pausa do simulador conta como tempo parado.
- Abertura com motor parado em voo encerra a sessão restaurada (decisão 2 ao pé da letra).
- Mensagem de erro não orienta o piloto; push de falha pode se perder na abertura.
- Índice na migration 003; débito do `tsconfig.main.json`.

### Impactos propostos no contexto

- architecture.md: ADR-004 (definição de solo separada); ADR-009 nova (encerramento); canais IPC (`session:ended` emitido após gravação, `session:get-active` da memória, `session:end-failed`); diretriz de no máximo uma sessão ativa.
- domain_model.md: semântica de `encerradaEm`, transição única, duração, leituras após o fim.
- code_conventions.md: migration 003 e rotina de saneamento; testes de tempo por amostras e fake timers.
- design.md e usability.md: notificação de erro, estado "Encerrada" no uso real, textos, reabertura sem notificação.
- Produto: UC-002 fluxo B deixa de ser "só depois do UC-003".

### Decisões do HITL-1 (2026-11-17)

1. Verificação na abertura: `VERIFICACAO_ABERTURA_MS = 15000`. Sem dado do motor em 15 s, a sessão restaurada é encerrada com a última leitura (o humano aceitou o risco de partir um voo se o SimConnect demorar).
2. Sessões antigas: rotina a cada abertura (opção b), que encerra toda sessão ativa exceto a mais recente; migration 003 cria o índice `(sessao_id, timestamp)` em `leituras_de_parametro`.
3. Queda de conexão durante a espera de 15 s: a contagem é mantida. Se ao reconectar o motor continua parado e a aeronave no solo, vale o instante original em que as duas condições começaram; se qualquer condição deixou de valer, a contagem zera.
4. Padrões aprovados com o plano: leituras dos 15 s de espera ficam gravadas (o UC-005 corta a exibição na hora de fim); falha ao gravar o encerramento mostra a notificação de erro, tira a sessão da memória e a próxima abertura a encerra; encerramento na abertura é silencioso; a confirmação da sessão restaurada mostra "Coleta iniciada"; sair ao menu e iniciar outro voo sem cortar o motor é limitação conhecida; demais padrões da seção 1.1 confirmados.

## O que foi feito

### 2.1 Implementar (UC-003)

Tarefas 1 a 12 implementadas com os ajustes do HITL-1. Código de produção compila (`tsc` do main sem os testes); lint limpo; `dist/main/main/db/migrations` com 001, 002 e 003. Sem commit; nada em context/ alterado pelo developer.

Arquivos novos: `src/main/simconnect/detector-de-encerramento.ts` (função pura `avancarDetector`, `ENCERRAMENTO_LIMITE_MS = 15000`, contagem mantida na queda de conexão), `src/main/db/migrations/003-indice-leituras.sql` (índice `idx_leituras_sessao_timestamp`).

Arquivos alterados: `simconnect-client.ts` (definição `DEF_ID_GROUND` com `SIM ON GROUND`; callbacks `onEngineSample` e `onGroundSample`), `collection-service.ts` (detector ligado; encerramento grava e então emite, ou emite falha; verificação na abertura com `VERIFICACAO_ABERTURA_MS = 15000`; `encerrar()` virou `fecharConexao()`), `session-handler.ts` (`session:get-active` da memória; `emitSessionEndFailed`), `session-repository.ts` (`buscarSessaoAtiva` ordenada; `encerrarSessao`; `encerrarSessoesAtivasAnteriores`), `reading-repository.ts` (`buscarUltimaLeituraEm`), `ipc-channels.ts`, `preload.ts`, `electron-api.d.ts`, `session-ipc.ts` (canal `session:end-failed`), `index.ts` (rotina de sessões antigas após as migrations; eventos de encerramento e falha), `use-active-session.ts` e `App.tsx` (falha exibida como encerrada e notificação de erro).

Desvios:
- Queda de conexão mantém a contagem (ajuste do HITL-1, em vez de zerar).
- Detector como função pura com estado no serviço.
- `session:end-failed` leva a sessão como estava na memória; o renderer a marca encerrada só para exibição.
- Falha ao encerrar na abertura só gera log (sem notificação nem push): a confirmar no HITL-2.
- Falha da rotina de sessões antigas só gera log e não impede o app de abrir.
- Definição de solo registrada depois da dos parâmetros.

Débito:
- Diferença de menos de 1 s entre a hora de fim e as leituras (pedidos distintos ao SimConnect).
- A confirmação da sessão restaurada reaproveita o evento de sessão criada.

Testes quebrados pelas mudanças: 82 falhas em 6 arquivos (`collection-service.test.ts` 23, `use-active-session.test.ts` 14, `App.test.tsx` 40, `migrator-sqlite.test.ts` 3, `session-handler.test.ts` 1, `simconnect-client.test.ts` 1).

### 2.1 Implementar, 2ª rodada (ajustes do HITL-3)

- `App.tsx`: notificação de `session:end-failed` com o texto "Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura." (tipo error).
- `use-notification.ts`: cada notificação recebe um `id` incremental; `App.tsx` usa `key={notification.id}` no `<Notification>`, que remonta e reinicia os 4 s a cada notificação (inclusive texto repetido). `Notification.tsx` sem mudança.
- Lint e `tsc` do renderer limpos; 1 teste quebrado pelo texto novo (`App.test.tsx`, constante `ERRO_ENCERRAMENTO`).

## Testes

### 2.2 Testar (UC-003)

Resultado: 25 arquivos e 422 testes passando; `npm run build`, `tsc` do renderer e lint sem erros. Só arquivos de teste editados; nenhum bug de produção encontrado.

Testes antigos ajustados: `collection-service.test.ts` (mocks novos; sessão restaurada passa pela verificação; `fecharConexao`), `use-active-session.test.ts` e `App.test.tsx` (`onSessionEndFailed`), `migrator-sqlite.test.ts` (3 migrations), `session-handler.test.ts` (getter da memória), `simconnect-client.test.ts` (3 pedidos).

Testes novos: `detector-de-encerramento.test.ts` (26: limite de 15 s, hora de fim, motor que tosse, saída do solo, pane em voo, pane e pouso, corte após pouso, desconhecidos, queda de conexão com contagem mantida); `collection-service.test.ts` (de 25 para 62: encerramento, gravação antes da emissão, falha, religamento, queda, verificação na abertura com fake timers); `session-repository-sqlite.test.ts` (24, SQL real: `encerrarSessao`, `buscarSessaoAtiva`, `buscarUltimaLeituraEm`, rotina de sessões antigas idempotente, banco do loop-003); migration 003 (índice usado pela busca, `EXPLAIN QUERY PLAN`); IPC, cliente SimConnect e renderer (notificações de sucesso e erro, painel encerrado na falha, "Coleta iniciada" na confirmação).

Cobertura: 100% em `main/db` e `main/ipc`; `main/simconnect` 100% de linhas e 96,8% de ramos (guardas inalcançáveis); total 91,05% de linhas. Sem cobertura: `src/main/index.ts` (chamada da rotina de sessões antigas e ligação dos eventos de encerramento).

Conferência no app (macOS, banco real do loop-003): migration 003 aplicada, índice criado, console sem erros.

Perguntas do tester: adaptador de `node:sqlite` duplicado em dois testes (um helper iria para `dist/main` pelo débito do `tsconfig.main.json`); testes de SQL real de `buscarUltimaLeituraEm` ficam em `session-repository-sqlite.test.ts`.

### Decisões do HITL-2 (2026-11-17)

- Falha ao gravar o encerramento feito na abertura: só log, sem aviso na tela; a rotina da próxima abertura tenta de novo.
- Adaptador de `node:sqlite` duplicado em dois testes: fica como débito, ligado ao do `tsconfig.main.json`; vira helper quando os testes saírem do build. Testes de SQL real de `buscarUltimaLeituraEm` podem ficar em `session-repository-sqlite.test.ts`.

### 2.2 Testar, 2ª rodada (ajustes do HITL-3)

- `App.test.tsx`: constante do texto de erro atualizada; teste do texto exato e do tipo error; describe com fake timers mostrando que cada notificação nova fica 4 s completos (troca aos 3 s, texto repetido, erro repetido, caso real "Sessão encerrada. Dados salvos." seguido de "Coleta iniciada" 1 s depois).
- `use-notification.test.ts`: id novo a cada notificação (inclusive texto igual e após limpar); funções estáveis entre renderizações.
- Resultado: 25 arquivos e 432 testes passando; build, `tsc` do renderer e lint sem erros.
- Conferência pelo orquestrador: sem o `key={notification.id}`, 4 testes de `App.test.tsx` falham; com ele, todos passam.

## Revisão e decisões

### 3. Revisão (2026-11-17)

Os 4 revisores aprovaram sem bloqueantes. Pendência para antes do encerramento: roteiro manual de 14 passos no Windows com o MSFS 2024.

#### 3.1 Funcionalidade
Todos os critérios (com as decisões) atendidos; UC-001, UC-002 e UC-006 sem regressão.
Não bloqueantes:
1. Sessão de falha de gravação encerrada na abertura fica com hora de fim até 15 s depois (última leitura inclui a espera).
2. `lastEngineCombustion` não zera na queda de conexão (anterior ao loop): simulador fechado com motor ligado e outro voo carregado com motor ligado continua na mesma sessão; com motor parado no solo, encerra com a hora do novo voo e duração inflada. Ainda não registrado como limitação.
3. Falha de gravação: sessão "Encerrada" na tela mas ativa no banco; reabertura com motor ligado a confirma e junta dois voos (raro).
4. `index.ts` sem teste automatizado (fica no roteiro manual).
5. Riscos aceitos dependentes do Windows: `SIM ON GROUND` (hidroavião, quique, slew, menu), pausa, abertura com motor parado em voo.

#### 3.2 Qualidade
Lint, 422 testes, build e `tsc` do renderer sem erros; nenhum `any`; meta de cobertura atingida.
Não bloqueantes: 4 guardas defensivas sem teste em `collection-service.ts`; novos `require` com `eslint-disable` no teste de SQL real; comentário em inglês em `simconnect-client.ts`; `ESTADO_INICIAL_DETECTOR` mutável (sugestão `Readonly`/`Object.freeze`).

#### 3.3 Usabilidade
Notificações de sucesso e erro, estado "Encerrada" no uso real, reabertura e "Coleta iniciada" conformes.
Não bloqueantes:
1. Mensagem de erro não orienta o piloto nem diz que as leituras estão preservadas.
2. Na falha, painel e barra mostram "Encerrada" e a falha só aparece numa notificação de 4 s.
3. Durante a verificação na abertura (até 15 s) com motor ligado, a tela mostra "Aguardando motor" e a orientação para ligar o motor.
4. Notificação de erro com `role="status"`/`aria-live="polite"` (o usual seria `role="alert"`).
5. Notificação que substitui outra herda o tempo restante da anterior (timer não reinicia); afeta religamento logo após o encerramento.

#### 3.4 Arquitetura
Separação main/renderer, ADR-005 no canal novo, preload mínimo, RN-006, transição única, migration 003 e rotina segura e idempotente, ordem de inicialização conformes.
Não bloqueantes:
1. Sessão marcada como encerrada no renderer fica com `encerradaEm: null` (estado de exibição; documentar).
2. No banco, a regra de no máximo uma sessão ativa é eventual (falhas seguidas de religamento) e reparada na abertura; documentar. Pergunta: índice único parcial num loop futuro.
3. `encerrarSessao` e `encerrarSessaoRestaurada` fora de transação (sem risco hoje); transação redundante na rotina.
4. Push de falha perdido antes de o renderer montar.
5. `fecharConexao()` não é chamado (anterior ao loop).
6. Migration 003 pode atrasar a primeira abertura em bancos grandes.

### 3. Revisão, 2ª rodada curta (2026-11-17)

Usabilidade revisou só os 2 ajustes: corretos, sem bloqueantes.
Não bloqueantes:
1. O texto de erro (19 palavras) provavelmente não é lido inteiro em 4 s com atenção dividida; a notificação não pode ser fechada nem pausada (WCAG 2.2.1).
2. Com 3 a 4 linhas, a notificação cobre mais o card do canto superior direito por 4 s (agrava débito "Notificação sobre o card").
3. A remontagem pelo `key` faz a notificação que substitui outra ser montada já com o texto, o que pode impedir o anúncio por alguns leitores de tela (agrava débito de região viva).
4. "próxima abertura" pode não deixar claro que é a do app.

### Decisões do HITL-3, 2ª rodada (2026-11-17)

- Revisão aprovada. Os itens da 2ª rodada (tempo de leitura da notificação de erro, notificação mais alta sobre o card, anúncio da notificação remontada, "próxima abertura do app") viram débito de UX, junto com os débitos de notificação já registrados, para um loop de UX do painel.

### Decisões do HITL-3, 1ª rodada (2026-11-17)

- Voltar para Implementar só com 2 ajustes:
  1. Mensagem de erro do encerramento: "Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura."
  2. O tempo de 4 s da notificação reinicia a cada notificação nova (hoje herda o tempo restante da anterior).
- Limitação conhecida a registrar: simulador fechado com o motor ligado e outro voo carregado já com o motor ligado ficam na mesma sessão (junto com "sair ao menu e iniciar outro voo").
- Demais itens menores viram débito, inclusive garantir no banco, num loop futuro, no máximo uma sessão ativa.
- Depois dos ajustes: rodada curta de testes e revisão só de usabilidade.

### 4. Documentação (2026-11-17)

- 4.1 Produto: UC-003 reescrito (fluxos A a H, CA-003-1 a CA-003-10, limitações conhecidas, regras RN-003 a RN-007, status "Em andamento", nota do critério movido para o UC-004); UC-002 fluxo B atualizado; RN-004 reescrita; RN-003, RN-006 e RN-007 com o UC-003; glossário com "Voo" alinhado, "Sessão encerrada" e "Duração". product.md sem mudança (limitações ficam no UC-003).
- 4.2 Engenharia: ADR-009 (encerramento); ADR-004 revista; diretriz de no máximo uma sessão ativa na memória com reparo no banco; canais IPC atualizados; domain_model.md com a semântica de `encerradaEm`, transição única, índice e tipos internos; code_conventions.md com a migration 003, a rotina de saneamento, padrões de teste de tempo e de SQL real. Em aberto: índice único parcial; `lastEngineCombustion` na queda de conexão.
- 4.3 ADLC: débito técnico (25 itens), limitações conhecidas (4), roteiro de 14 passos ajustado, lições LL-016 a LL-019, backlog (item 3 concluído; débitos de notificação no item 6). Perguntas: critério de parada para rodadas curtas; passo de falha de gravação no roteiro; itens de backlog para sessão ativa única no banco e separação de voos.
- 4.4 UX: design.md com "Encerrada" no uso real, notificação (tempo que reinicia, 320 px, textos) e débitos; usability.md com a seção do encerramento e débitos de leitor de tela. Observação: design.md lista estado warning da notificação que o código não tem (anterior ao loop).

### Decisões do HITL-4 (2026-11-17)

- Regra de parada: no máximo uma rodada curta por loop após o HITL-3; o que ela levantar vai para débito, salvo bloqueante. Registrada em agent_development_lifecycle.md e nas skills loop-review do .bob e do .claude.
- Backlog: item 8 "Débito técnico: banco e build" (sessão ativa única no banco, testes fora do build, adaptador de SQLite único). Separação de voos quando o simulador fecha continua limitação conhecida.
- Passo de falha de gravação não entra no roteiro manual (difícil de provocar; coberto por testes automatizados).
- Publicar a v0.4.0 (merge na main e tag) para o teste manual no Windows.

## Débito técnico do loop

Lista única dos itens que foram para débito: débitos do developer na 2.1, decisões do HITL-2, achados não bloqueantes das revisões (1ª e 2ª rodadas) e decisões do HITL-3. Não estão aqui: a mensagem de erro e o reinício dos 4 s da notificação (corrigidos na 2ª rodada), as limitações conhecidas (subseção própria abaixo), os ajustes de contexto previstos para a fase Documentar e as validações no Windows (pendência abaixo).

Funcionalidade e estados
1. No banco, a regra de no máximo uma sessão ativa é eventual: falhas de gravação seguidas de religamento podem deixar mais de uma sessão ativa, reparadas pela rotina da abertura. Garantir no banco (ex.: índice único parcial) num loop futuro (3.4, HITL-3).
2. Falha ao gravar o encerramento: o painel e a barra mostram "Encerrada", mas no banco a sessão continua ativa; se o app for reaberto com o motor ligado, a sessão é confirmada e junta dois voos (raro) (3.1).
3. Sessão com falha de gravação encerrada na abertura fica com hora de fim até 15 s depois da real, porque a última leitura inclui a espera (3.1).
4. `lastEngineCombustion` não zera na queda de conexão (anterior ao loop): simulador fechado com o motor ligado e outro voo carregado com o motor parado no solo encerra a sessão com a hora do novo voo, com duração inflada (3.1). O caso com o motor ligado no novo voo é limitação conhecida (abaixo).
5. Diferença de menos de 1 s entre a hora de fim e as leituras, porque solo, motor e parâmetros são pedidos distintos ao SimConnect (2.1).
6. A confirmação da sessão restaurada reaproveita o evento de sessão criada (2.1).
7. O push de `session:end-failed` pode se perder se chegar antes de o renderer montar (3.4).
8. Pausa do simulador conta como tempo parado na espera de 15 s (risco da 1.2, a observar no Windows).

Usabilidade (para o loop de UX do painel, item 6 do backlog)
9. Na falha de gravação, painel e barra mostram "Encerrada" e a falha só aparece numa notificação de 4 s (3.3).
10. Durante a verificação na abertura (até 15 s) com o motor ligado, a tela mostra "Aguardando motor" e a orientação para ligar o motor (3.3).
11. Notificação de erro com `role="status"`/`aria-live="polite"`; o usual para erro é `role="alert"` (3.3).
12. O texto de erro (19 palavras) provavelmente não é lido inteiro em 4 s com atenção dividida; a notificação não pode ser fechada nem pausada (WCAG 2.2.1) (3.3, 2ª rodada).
13. Com 3 a 4 linhas, a notificação cobre mais o card do canto superior direito por 4 s (agrava o débito "Notificação sobre o card") (3.3, 2ª rodada).
14. A remontagem pelo `key` faz a notificação que substitui outra ser montada já com o texto, o que pode impedir o anúncio por alguns leitores de tela; a região viva deveria ficar sempre montada (3.3, 2ª rodada).
15. "próxima abertura" pode não deixar claro que é a abertura do app (3.3, 2ª rodada).

Qualidade e arquitetura
16. `src/main/index.ts` sem teste automatizado (chamada da rotina de sessões antigas e ligação dos eventos de encerramento); fica coberto pelo roteiro manual (2.2, 3.1).
17. Adaptador de `node:sqlite` duplicado em dois testes; vira helper quando os testes saírem do build, ligado ao débito do `tsconfig.main.json` (HITL-2).
18. Novos `require` com `eslint-disable` no teste de SQL real (3.2).
19. 4 guardas defensivas sem teste em `collection-service.ts` (3.2).
20. Comentário em inglês em `simconnect-client.ts` (3.2).
21. `ESTADO_INICIAL_DETECTOR` mutável; sugestão `Readonly`/`Object.freeze` (3.2).
22. Sessão marcada como encerrada no renderer fica com `encerradaEm: null` (estado só de exibição; documentar) (3.4).
23. `encerrarSessao` e `encerrarSessaoRestaurada` fora de transação (sem risco hoje); transação redundante na rotina de sessões antigas (3.4).
24. `fecharConexao()` não é chamado (anterior ao loop) (3.4).
25. Migration 003 (índice em `leituras_de_parametro`) pode atrasar a primeira abertura em bancos grandes (3.4).

### Limitações conhecidas (não são débito)

Registradas por decisão do HITL-1 e do HITL-3:
- Sair ao menu e iniciar outro voo sem cortar o motor: os dois voos ficam na mesma sessão.
- Simulador fechado com o motor ligado e outro voo carregado já com o motor ligado: os dois voos ficam na mesma sessão.
- Leituras gravadas durante a espera de 15 s ficam depois de `encerradaEm`; o UC-005 corta a exibição na hora de fim.
- Abertura do app com o motor parado em voo encerra a sessão restaurada (decisão 2 ao pé da letra).

### Pendência antes do encerramento (não é débito)

Roteiro manual no Windows com MSFS 2024, sobre um instalador gerado da branch do loop (como nos loops 002 e 003), ajustado às decisões do HITL-1 (prazo de 15 s na verificação da abertura; contagem mantida na queda de conexão):

1. Migração sobre o banco da v0.3.0: migration 003 registrada e índice criado; sessões ativas antigas encerradas com a hora da última leitura (sem leitura, hora de início e duração 0), exceto a mais recente, que passa pela verificação da abertura.
2. Voo normal com corte: após o pouso, motor cortado por 15 s encerra a sessão; notificação "Sessão encerrada. Dados salvos.", barra "Encerrada" e painel congelado; no banco, status encerrada e `encerradaEm` no início dos 15 s.
3. Táxi com paradas: a sessão não encerra enquanto o motor estiver ligado.
4. Corte e religamento antes de 15 s: mesma sessão.
5. Motor que tosse (falha de combustão breve): mesma sessão.
6. Pane em voo com planeio: não encerra no ar; depois do pouso, encerra após 15 s com motor parado no solo.
7. Religamento após o encerramento: nova sessão, com "Coleta iniciada"; a anterior não é reaberta.
8. Fechar e reabrir o app com o motor ligado: a sessão continua e "Coleta iniciada" aparece na confirmação (até 15 s; observar a tela "Aguardando motor" nesse intervalo).
9. Reabrir o app com o motor cortado: a sessão restaurada é encerrada sem notificação, com a hora da última leitura.
10. Reabrir o app sem o simulador: sem dado do motor em 15 s, a sessão restaurada é encerrada com a hora da última leitura.
11. Simulador fechado em voo: painel em "Sem sinal" e a sessão não encerra. Variante: queda de conexão durante a espera de 15 s com o motor parado no solo; ao reconectar com as duas condições ainda válidas, a sessão encerra com o instante original.
12. Pausa do simulador com o motor parado no solo: observar se a pausa conta na espera de 15 s.
13. Menu e novo voo sem cortar o motor: confirmar a limitação conhecida (mesma sessão).
14. `SIM ON GROUND` sem exceção no log em 2 aeronaves (e num hidroavião, se possível), sem afetar o início automático da sessão (UC-001).

## Contexto atualizado

Resumo do que a fase Documentar atualiza, por área, conforme os impactos propostos nas etapas 1.1, 1.2 e 3 e as decisões dos HITL. As etapas 4.1, 4.2 e 4.4 rodam em paralelo com esta; o resultado de cada uma é conferido no HITL-4.

### 4.1 Produto
- `use_cases.md` (UC-003): CA-003-1 reescrito como verificável (status encerrada, hora de fim gravada, leituras preservadas); CA-003-2 sai do UC-003 (a exibição na lista fica no UC-004); critérios numerados; fluxos alternativos conforme as decisões (15 s com motor parado no solo; pane em voo não encerra; queda de conexão não encerra e mantém a contagem; verificação na abertura com prazo de 15 s; sessões antigas; religamento sempre abre nova sessão; sessão curta gravada; falha de gravação com o texto "Não foi possível salvar o encerramento. Os dados do voo foram mantidos e o encerramento será concluído na próxima abertura."); regras aplicadas RN-003, RN-006 e RN-007; limitações conhecidas (menu e novo voo; simulador fechado com motor ligado e outro voo com motor ligado).
- `use_cases.md` (UC-002): fluxo B deixa de ser "só depois do UC-003".
- `use_cases.md` (UC-004): recebe a exibição da sessão encerrada na lista (data, hora e duração) e o filtro de voos curtos, se preciso.
- `business_rules.md`: RN-004 com o critério de encerramento (motor parado e aeronave no solo por 15 s), hora de fim, queda de conexão, abertura do app e sessões antigas; RN-005 (toda sessão fica gravada); RN-006 e RN-007 passam a listar o UC-003.
- `glossary.md`: "Voo" alinhado com "Sessão" (do motor ligado ao encerramento); termos novos "Sessão encerrada" e "Duração".

### 4.2 Engenharia
- `architecture.md`: ADR-004 revista (definição de solo `SIM ON GROUND` separada da do motor); ADR-009 nova (encerramento: detector como função pura medida pelos instantes das amostras, 15 s, contagem mantida na queda, verificação na abertura com 15 s, rotina de sessões antigas a cada abertura, falha de gravação); canais IPC (`session:ended` emitido após a gravação, `session:get-active` lido da memória, `session:end-failed` novo); diretriz de no máximo uma sessão ativa, hoje eventual e reparada na abertura; sessão encerrada no renderer com `encerradaEm: null` como estado de exibição.
- `domain_model.md`: semântica de `encerradaEm`, transição única de ativa para encerrada, duração = `encerradaEm − iniciadaEm`, leituras gravadas depois da hora de fim.
- `code_conventions.md`: migration 003 (índice `(sessao_id, timestamp)`) e rotina de saneamento das sessões antigas; testes de comportamento com tempo por amostras com instantes explícitos e fake timers; `encerrar()` renomeado para `fecharConexao()`.

### 4.3 ADLC
- `loop_reports/loop-004.md`: "Débito técnico do loop", limitações conhecidas, pendência do Windows, "Contexto atualizado" e "Lições".
- `lessons_learned.md`: LL-016 a LL-019.
- `backlog.md`: item 3 movido para Concluídos; "Em andamento" vazio; item 6 ampliado com os débitos de UX de notificação.
- `loop_report.md`: linha do loop-004 adicionada no encerramento, após o HITL-4 e o teste no Windows.

### 4.4 UX
- `design.md`: notificação de erro do encerramento; estado "Encerrada" no uso real; reabertura sem notificação; "Coleta iniciada" na confirmação da sessão restaurada; o tempo de 4 s reinicia a cada notificação nova; débitos de UX de notificação em aberto.
- `usability.md`: textos "Sessão encerrada. Dados salvos." e da falha de gravação; anúncio das notificações por leitor de tela; débitos em aberto (tempo de leitura, notificação sobre o card, região viva, `role="alert"`, "Aguardando motor" durante a verificação).

## Lições

Ver `context/adlc/lessons_learned.md` (LL-016 a LL-019).

- LL-016: a 2ª rodada curta de revisão gerou novos itens menores; falta critério de parada para rodadas curtas.
- LL-017: teste de mutação simples (remover a correção) confirmou que o teste do timer pegava o problema.
- LL-018: detector como função pura medida pelos instantes das amostras tornou testáveis as decisões com tempo.
- LL-019: decisão parcial do humano por mensagem livre durante uma pergunta múltipla.
