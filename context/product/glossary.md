# Glossário

> Propósito: Termos do produto e o seu significado, para que pessoas e agentes usem as mesmas palavras.
> Atualizar quando: surgir um termo novo ou um termo mudar de sentido.
> Relacionados: nenhum
> Última atualização: 2026-11-17 · loop-003

## Termos

| Termo | Significado | Onde aparece |
|-------|-------------|--------------|
| Blackbox Simulator | Nome do produto; ferramenta que coleta, registra e visualiza parâmetros de voo de simuladores de voo. | product.md |
| Caixa-preta | Sinônimo informal de Blackbox Simulator, inspirado no dispositivo de registro de dados de aeronaves reais. | product.md |
| Simulador de voo | Software de simulação de voo, como Microsoft Flight Simulator 2024, que expõe dados de sensores da aeronave simulada. | product.md |
| Voo | Sessão completa de simulação, desde a decolagem (ou início do táxi) até o pouso e parada da aeronave. | product.md |
| Parâmetro de voo | Grandeza medida durante o voo, como altitude, velocidade, atitude ou potência do motor, fornecida pelo simulador. | product.md |
| Conjunto de parâmetros | Parâmetros de voo que o produto coleta, registra e exibe; pode ser ampliado. | product.md, business_rules.md (RN-002) |
| Conjunto inicial de parâmetros | Primeira versão do conjunto de parâmetros, com 6 parâmetros (loop-001). | product.md |
| Latitude | Posição da aeronave no sentido norte-sul, em graus decimais; exibida com 5 casas decimais e hemisfério em letra (N ou S), por exemplo "23,55052 S". Nunca é N/A. | product.md, use_cases.md (UC-006) |
| Longitude | Posição da aeronave no sentido leste-oeste, em graus decimais; exibida com 5 casas decimais e hemisfério em letra (L ou O), por exemplo "46,63331 O". Nunca é N/A. | product.md, use_cases.md (UC-006) |
| Manete | Alavanca de potência do motor; registrada em % de avanço, exibida em % inteiro. Com reverso, aparece como % negativo (ex.: "−20"). Nunca é N/A. | product.md, use_cases.md (UC-006) |
| Mistura | Controle da proporção ar/combustível do motor a pistão; registrada em %, exibida em % inteiro. N/A se o motor não é a pistão. | product.md, use_cases.md (UC-006) |
| RPM | Rotações por minuto do motor; exibida em número inteiro. Com o motor parado, 0 é valor real. Nunca é N/A. | product.md, use_cases.md (UC-006) |
| Flapes | Superfícies de hipersustentação da asa; registradas em % de extensão física da superfície (não pelo detente), de 0 a 100, exibidas em % inteiro. Flapes recolhidos são 0, não N/A; N/A só se a aeronave não tem flapes. | product.md, use_cases.md (UC-006) |
| N/A (não se aplica) | Estado de um parâmetro cujo item a aeronave em uso não possui; decidido pelos dados da aeronave ao ligar o motor e válido a sessão toda. Exibido como "N/A", sem leitura gravada, e com prioridade sobre "Sem sinal" e sobre a sessão encerrada. | business_rules.md (RN-007), use_cases.md (UC-002, UC-006) |
| Visualização em tempo real | Exibição dos parâmetros de voo enquanto o voo está em andamento, atualizada a cada 1 s e com atraso máximo de 2 s entre o simulador e o painel de tempo real. | product.md, use_cases.md (UC-002) |
| Painel de tempo real | Área principal da janela do Blackbox Simulator que, durante uma sessão ativa, exibe o valor atual de cada parâmetro do conjunto de parâmetros, atualizado a cada 1 s. Aparece sozinho quando a sessão fica ativa. | use_cases.md (UC-002) |
| Sem sinal | Estado de um parâmetro no painel de tempo real quando, com a sessão ativa, a conexão com o simulador cai ou passam 2 s sem leitura nova. O valor é exibido como "—" e o painel mostra o aviso "Sem sinal do simulador". | use_cases.md (UC-002) |
| Debriefing | Revisão e interpretação dos dados registrados após o encerramento do voo. Também chamado de análise pós-voo. | product.md |
| Sessão | Uso contínuo do produto durante um voo, do início da coleta até o encerramento. Sinônimo de Voo no contexto do produto. | product.md |
| Piloto | Usuário do produto — pode ser piloto real (profissional ou estudante de aviação) ou virtual (usuário de simulador) — que usa o Blackbox Simulator para melhorar suas técnicas com base em dados. | product.md |
