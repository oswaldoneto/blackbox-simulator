-- UC-006: amplia o conjunto de parâmetros de 6 para 12 e registra, na sessão,
-- os parâmetros que a aeronave não possui (N/A, RN-007).

-- Lista JSON de slugs não aplicáveis, decidida na criação da sessão.
ALTER TABLE sessoes ADD COLUMN parametros_nao_aplicaveis TEXT NOT NULL DEFAULT '[]';

-- Seed: parâmetros novos. Os slugs precisam bater com PARAMETER_IDS em
-- src/shared/parameter-ids.ts (o SQL não importa a constante TypeScript).
INSERT OR IGNORE INTO parametros_de_voo (id, nome, unidade, ativo) VALUES
  ('latitude',   'Latitude',  '°',   1),
  ('longitude',  'Longitude', '°',   1),
  ('throttle_1', 'Manete',    '%',   1),
  ('mixture_1',  'Mistura',   '%',   1),
  ('rpm_1',      'RPM',       'rpm', 1),
  ('flaps',      'Flapes',    '%',   1);
