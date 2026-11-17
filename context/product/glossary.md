# Glossário

> Propósito: Termos do produto e o seu significado, para que pessoas e agentes usem as mesmas palavras.
> Atualizar quando: surgir um termo novo ou um termo mudar de sentido.
> Relacionados: nenhum
> Última atualização: 2026-11-16 · loop-002

## Termos

| Termo | Significado | Onde aparece |
|-------|-------------|--------------|
| Blackbox Simulator | Nome do produto; ferramenta que coleta, registra e visualiza parâmetros de voo de simuladores de voo. | product.md |
| Caixa-preta | Sinônimo informal de Blackbox Simulator, inspirado no dispositivo de registro de dados de aeronaves reais. | product.md |
| Simulador de voo | Software de simulação de voo, como Microsoft Flight Simulator 2024, que expõe dados de sensores da aeronave simulada. | product.md |
| Voo | Sessão completa de simulação, desde a decolagem (ou início do táxi) até o pouso e parada da aeronave. | product.md |
| Parâmetro de voo | Grandeza medida durante o voo, como altitude, velocidade, atitude ou potência do motor, fornecida pelo simulador. | product.md |
| Conjunto inicial de parâmetros | Subconjunto de parâmetros de voo selecionados para a primeira versão do produto; outros poderão ser adicionados futuramente. | product.md |
| Visualização em tempo real | Exibição dos parâmetros de voo enquanto o voo está em andamento, atualizada a cada 1 s e com atraso máximo de 2 s entre o simulador e o painel de tempo real. | product.md, use_cases.md (UC-002) |
| Painel de tempo real | Área principal da janela do Blackbox Simulator que, durante uma sessão ativa, exibe o valor atual de cada parâmetro do conjunto inicial, atualizado a cada 1 s. Aparece sozinho quando a sessão fica ativa. | use_cases.md (UC-002) |
| Sem sinal | Estado de um parâmetro no painel de tempo real quando, com a sessão ativa, a conexão com o simulador cai ou passam 2 s sem leitura nova. O valor é exibido como "—" e o painel mostra o aviso "Sem sinal do simulador". | use_cases.md (UC-002) |
| Debriefing | Revisão e interpretação dos dados registrados após o encerramento do voo. Também chamado de análise pós-voo. | product.md |
| Sessão | Uso contínuo do produto durante um voo, do início da coleta até o encerramento. Sinônimo de Voo no contexto do produto. | product.md |
| Piloto | Usuário do produto — pode ser piloto real (profissional ou estudante de aviação) ou virtual (usuário de simulador) — que usa o Blackbox Simulator para melhorar suas técnicas com base em dados. | product.md |
