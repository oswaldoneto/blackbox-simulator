CREATE TABLE IF NOT EXISTS sessoes (
  id                TEXT PRIMARY KEY,
  iniciada_em       TEXT NOT NULL,
  encerrada_em      TEXT,
  aeronave          TEXT NOT NULL DEFAULT '',
  aerodromo_origem  TEXT,
  aerodromo_destino TEXT,
  status            TEXT NOT NULL DEFAULT 'ativa'
);

CREATE TABLE IF NOT EXISTS parametros_de_voo (
  id      TEXT PRIMARY KEY,
  nome    TEXT NOT NULL,
  unidade TEXT NOT NULL,
  ativo   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS leituras_de_parametro (
  sessao_id    TEXT NOT NULL,
  parametro_id TEXT NOT NULL,
  timestamp    TEXT NOT NULL,
  valor        REAL NOT NULL,
  FOREIGN KEY (sessao_id)    REFERENCES sessoes (id),
  FOREIGN KEY (parametro_id) REFERENCES parametros_de_voo (id)
);

-- Seed: conjunto inicial de parâmetros ativos
INSERT OR IGNORE INTO parametros_de_voo (id, nome, unidade, ativo) VALUES
  ('altitude_msl',       'Altitude MSL',        'ft',  1),
  ('airspeed_ias',       'Velocidade IAS',       'kt',  1),
  ('vertical_speed',     'Velocidade vertical',  'fpm', 1),
  ('heading_magnetic',   'Rumo magnético',       '°',   1),
  ('pitch',              'Arfagem',              '°',   1),
  ('bank',               'Rolagem',              '°',   1);
