-- UC-003: índice para buscar a última leitura de uma sessão (MAX(timestamp) por
-- sessao_id), usado no encerramento da sessão e no reparo das sessões ativas antigas.
CREATE INDEX IF NOT EXISTS idx_leituras_sessao_timestamp
  ON leituras_de_parametro (sessao_id, timestamp);
