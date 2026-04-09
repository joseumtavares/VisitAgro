-- ============================================================
-- VisitAgroPro — schema_fix.sql
-- Corrige TODOS os problemas identificados no schema atual.
-- SEGURO: usa IF NOT EXISTS e ON CONFLICT — não destrói dados.
-- Execute no SQL Editor do Supabase (projeto existente).
-- ============================================================

-- ── 1. Extensões ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. Tabelas que podem não existir (criação segura) ─────────

-- Referrals (indicadores) — pode não existir no projeto inicial
CREATE TABLE IF NOT EXISTS referrals (
  id              TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace       TEXT DEFAULT 'principal',
  name            TEXT NOT NULL,
  document        TEXT,
  tel             TEXT,
  email           TEXT,
  commission_type TEXT DEFAULT 'fixed' CHECK (commission_type = ANY (ARRAY['fixed','percent'])),
  commission_pct  NUMERIC DEFAULT 0,
  commission      NUMERIC DEFAULT 0,
  bank_name       TEXT,
  bank_agency     TEXT,
  bank_account    TEXT,
  bank_pix        TEXT,
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT referrals_pkey PRIMARY KEY (id)
);

-- Environments (ambientes de cliente)
CREATE TABLE IF NOT EXISTS environments (
  id         TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace  TEXT DEFAULT 'principal',
  client_id  TEXT REFERENCES clients(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  area       NUMERIC,
  area_unit  TEXT DEFAULT 'ha',
  obs        TEXT,
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  drawing    JSONB,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT environments_pkey PRIMARY KEY (id)
);

-- Photos
CREATE TABLE IF NOT EXISTS photos (
  id          TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace   TEXT DEFAULT 'principal',
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  file_size   BIGINT,
  mime_type   TEXT,
  uploaded_by TEXT REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT photos_pkey PRIMARY KEY (id)
);

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id         TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  name       TEXT NOT NULL,
  trade_name TEXT,
  document   TEXT,
  address    TEXT,
  city       TEXT,
  state      TEXT,
  zip_code   TEXT,
  phone      TEXT,
  email      TEXT,
  logo_url   TEXT,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id               TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace        TEXT DEFAULT 'principal' UNIQUE,
  company_id       TEXT REFERENCES companies(id),
  config           JSONB DEFAULT '{}',
  dev_pin_hash     TEXT,
  dev_mode_expires TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);

-- Pre-registrations (leads)
CREATE TABLE IF NOT EXISTS pre_registrations (
  id                  TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace           TEXT DEFAULT 'principal',
  name                TEXT NOT NULL,
  tel                 TEXT,
  email               TEXT,
  interest            TEXT,
  source              TEXT DEFAULT 'site',
  status              TEXT DEFAULT 'novo' CHECK (status = ANY (ARRAY['novo','contatado','qualificado','convertido','perdido'])),
  obs                 TEXT,
  converted_client_id TEXT REFERENCES clients(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pre_registrations_pkey PRIMARY KEY (id)
);

-- Commissions (comissões do indicador)
CREATE TABLE IF NOT EXISTS commissions (
  id               TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace        TEXT DEFAULT 'principal',
  referral_id      TEXT REFERENCES referrals(id),
  referral_name    TEXT,
  order_id         TEXT REFERENCES orders(id) ON DELETE CASCADE,
  client_id        TEXT REFERENCES clients(id),
  client_name      TEXT,
  amount           NUMERIC NOT NULL DEFAULT 0,
  commission_type  TEXT DEFAULT 'fixed',
  status           TEXT DEFAULT 'pendente' CHECK (status = ANY (ARRAY['pendente','paga','cancelada'])),
  receipt_photo_ids JSONB DEFAULT '[]',
  paid_at          TIMESTAMPTZ,
  order_date       DATE,
  order_total      NUMERIC,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT commissions_pkey PRIMARY KEY (id)
);

-- Rep commissions (comissões do representante por item)
CREATE TABLE IF NOT EXISTS rep_commissions (
  id                TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace         TEXT DEFAULT 'principal',
  order_id          TEXT REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id     TEXT,
  order_date        DATE,
  client_id         TEXT REFERENCES clients(id),
  client_name       TEXT,
  product_id        TEXT REFERENCES products(id),
  product_name      TEXT,
  qty               NUMERIC DEFAULT 1,
  unit_price        NUMERIC DEFAULT 0,
  rep_commission_pct NUMERIC DEFAULT 0,
  amount            NUMERIC NOT NULL DEFAULT 0,
  order_total       NUMERIC,
  status            TEXT DEFAULT 'pendente' CHECK (status = ANY (ARRAY['pendente','paga','cancelada'])),
  receipt_photo_ids JSONB DEFAULT '[]',
  paid_at           TIMESTAMPTZ,
  reprocessed_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT rep_commissions_pkey PRIMARY KEY (id)
);

-- ── 3. COLUNAS FALTANTES EM TABELAS EXISTENTES ───────────────

-- [BUG 1] orders: colunas que o código usa mas o schema não tem
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percent';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_type    TEXT DEFAULT 'avista';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_id     TEXT REFERENCES referrals(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS environment_id  TEXT REFERENCES environments(id);

-- [BUG 2] orders: garantir order_number com sequence
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'order_number_seq') THEN
    CREATE SEQUENCE order_number_seq START 1 INCREMENT 1;
  END IF;
END $$;

-- Trigger para auto-preencher order_number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := nextval('order_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_number ON orders;
CREATE TRIGGER trg_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Backfill: preenche order_number em pedidos existentes sem número
UPDATE orders SET order_number = nextval('order_number_seq')
WHERE order_number IS NULL;

-- [BUG 3] clients: colunas usadas no código que podem faltar
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tel2         TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS category     TEXT DEFAULT 'geral';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS document     TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS document_front_path   TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS document_back_path    TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS residence_proof_path  TEXT;

-- [BUG 4] products: colunas adicionais
ALTER TABLE products ADD COLUMN IF NOT EXISTS model       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS color       TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS finame_code TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS ncm_code    TEXT DEFAULT '';

-- [BUG 5] users: company_id e name
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES companies(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS name       TEXT;

-- ── 4. ORDEM DE ITENS (garantir ON DELETE CASCADE) ───────────
-- Recriar constraint se não tiver CASCADE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'order_items_order_id_fkey'
  ) THEN
    ALTER TABLE order_items DROP CONSTRAINT order_items_order_id_fkey;
  END IF;
  ALTER TABLE order_items
    ADD CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── 5. TRIGGERS updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','clients','orders','products','categories',
    'referrals','commissions','rep_commissions','visits',
    'environments','companies','settings'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I;
       CREATE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- ── 6. ÍNDICES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_status    ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_workspace ON clients(workspace);
CREATE INDEX IF NOT EXISTS idx_orders_client     ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_workspace  ON orders(workspace);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_ref   ON commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_rep_comm_order    ON rep_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key   ON rate_limits(key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action  ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_client     ON visits(client_id);

-- ── 7. RLS DESABILITADO (service_role no backend) ─────────────
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','clients','orders','order_items','products','categories',
    'referrals','commissions','rep_commissions','visits','environments',
    'companies','settings','photos','pre_registrations',
    'audit_log','rate_limits','km_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── 8. EMPRESA E SETTINGS PADRÃO ─────────────────────────────
INSERT INTO companies (id, name, trade_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'AgroVisita Pro', 'AgroVisita')
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (id, workspace, company_id, config)
VALUES (
  gen_random_uuid()::text,
  'principal',
  '00000000-0000-0000-0000-000000000001',
  '{}'
)
ON CONFLICT (workspace) DO UPDATE
  SET company_id = EXCLUDED.company_id;

-- ── 9. VERIFICAÇÃO FINAL ──────────────────────────────────────
DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'users','clients','orders','order_items','products','categories',
    'referrals','commissions','rep_commissions','visits','environments',
    'companies','settings','photos','audit_log','rate_limits'
  ];
  v_table TEXT; v_ok BOOLEAN; v_erros INT := 0;
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    SELECT EXISTS(
      SELECT 1 FROM information_schema.tables
      WHERE table_schema='public' AND table_name=v_table
    ) INTO v_ok;
    IF v_ok THEN RAISE NOTICE '✅ %', v_table;
    ELSE RAISE WARNING '❌ Ausente: %', v_table; v_erros := v_erros + 1;
    END IF;
  END LOOP;

  -- Verificar colunas críticas
  IF EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='commission_type') THEN
    RAISE NOTICE '✅ orders.commission_type OK';
  ELSE RAISE WARNING '❌ orders.commission_type FALTANDO'; v_erros := v_erros + 1; END IF;

  IF EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='payment_type') THEN
    RAISE NOTICE '✅ orders.payment_type OK';
  ELSE RAISE WARNING '❌ orders.payment_type FALTANDO'; v_erros := v_erros + 1; END IF;

  IF v_erros = 0 THEN
    RAISE NOTICE '🎉 Schema corrigido com sucesso! VisitAgroPro pronto.';
  ELSE
    RAISE EXCEPTION '% erro(s) encontrado(s). Verifique os warnings.', v_erros;
  END IF;
END $$;
