-- ============================================================
-- MIGRAÇÃO v2 — Agrovisita Pro
-- Adiciona colunas faltantes para as novas funcionalidades
-- Execute no SQL Editor do Supabase (seguro — usa IF NOT EXISTS)
-- ============================================================

-- ── clientes: telefone 2 + categoria ─────────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tel2        TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS category    TEXT DEFAULT 'geral';

-- ── produtos: modelo + cor ────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS model      TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS color      TEXT;

-- ── indicadores (referrals): dados bancários ──────────────────
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS bank_name    TEXT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS bank_agency  TEXT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS bank_pix     TEXT;

-- ── settings: PIN de segurança ────────────────────────────────
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dev_pin_hash TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dev_mode_expires TIMESTAMPTZ;

-- ── Garante RLS desabilitado nas tabelas novas usadas ─────────
ALTER TABLE referrals      DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders         DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    DISABLE ROW LEVEL SECURITY;
ALTER TABLE commissions    DISABLE ROW LEVEL SECURITY;
ALTER TABLE rep_commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE photos         DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories     DISABLE ROW LEVEL SECURITY;
ALTER TABLE environments   DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings       DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies      DISABLE ROW LEVEL SECURITY;

-- ── Insert settings padrão se não existir ────────────────────
INSERT INTO settings (id, workspace, config)
VALUES (gen_random_uuid()::text, 'principal', '{}')
ON CONFLICT (workspace) DO NOTHING;

-- ── Verificação ───────────────────────────────────────────────
SELECT table_name, COUNT(*) as total_cols
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('clients','products','referrals','settings')
GROUP BY table_name ORDER BY table_name;
