-- ============================================================
-- VisitaPRO — Migration v3: Controle de KM
-- Aplique este script no SQL Editor do Supabase
-- Execute SOMENTE se desejar sincronizar registros de KM
-- com o banco de dados (atualmente os dados ficam em localStorage)
-- ============================================================

-- ── TABELA DE REGISTROS DE KM ─────────────────────────────
CREATE TABLE IF NOT EXISTS visitapro_km (
  id            TEXT PRIMARY KEY,
  user_id       TEXT,                        -- usuário que registrou
  data          DATE NOT NULL,               -- data da saída
  veiculo       TEXT,                        -- ex: Carro, Moto
  km_ini        DOUBLE PRECISION NOT NULL,   -- hodômetro inicial
  km_fim        DOUBLE PRECISION NOT NULL,   -- hodômetro final
  percorrido    DOUBLE PRECISION NOT NULL,   -- km_fim - km_ini
  combustivel   DOUBLE PRECISION DEFAULT 0, -- valor pago R$
  consumo       DOUBLE PRECISION,           -- km/l informado
  litros        DOUBLE PRECISION,           -- consumo estimado
  custo_por_km  DOUBLE PRECISION,           -- R$/km calculado
  obs           TEXT,                        -- rota, região etc.
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_km_user_id    ON visitapro_km(user_id);
CREATE INDEX IF NOT EXISTS idx_km_data       ON visitapro_km(data DESC);
CREATE INDEX IF NOT EXISTS idx_km_updated_at ON visitapro_km(updated_at DESC);

-- ── ROW LEVEL SECURITY ───────────────────────────────────
ALTER TABLE visitapro_km ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_km" ON visitapro_km;
CREATE POLICY "allow_all_km" ON visitapro_km
  FOR ALL USING (true) WITH CHECK (true);

-- ── TRIGGER UPDATED_AT ───────────────────────────────────
DROP TRIGGER IF EXISTS set_km_updated_at ON visitapro_km;
CREATE TRIGGER set_km_updated_at
  BEFORE UPDATE ON visitapro_km
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── VIEWS ÚTEIS ──────────────────────────────────────────

-- Resumo mensal por usuário
CREATE OR REPLACE VIEW visitapro_km_mensal AS
SELECT
  user_id,
  TO_CHAR(data, 'YYYY-MM')      AS mes,
  COUNT(*)                       AS total_registros,
  SUM(percorrido)                AS total_km,
  SUM(combustivel)               AS total_combustivel,
  ROUND(AVG(custo_por_km)::numeric, 2) AS media_custo_km
FROM visitapro_km
GROUP BY user_id, TO_CHAR(data, 'YYYY-MM')
ORDER BY mes DESC;

-- ============================================================
-- NOTA: A versão atual do VisitaPRO armazena os registros
-- de KM somente em localStorage (offline-first).
-- Para habilitar a sincronização com o Supabase, aplique
-- este script e adicione as funções de sync ao index.html
-- na versão futura (v3.1+).
-- ============================================================
