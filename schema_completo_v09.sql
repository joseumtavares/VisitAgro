-- ============================================================
-- VisitAgroPro — Schema Completo v0.9
-- Execute INTEIRO no SQL Editor do Supabase (projeto novo),
-- ou use schema_fix.sql para aplicar em banco existente.
--
-- Inclui TODAS as tabelas, índices, triggers, RLS e seeds.
-- ============================================================

-- ── Extensões ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Sequência para numeração de pedidos ──────────────────────
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1 INCREMENT 1;

-- ══════════════════════════════════════════════════════════════
-- TABELAS
-- ══════════════════════════════════════════════════════════════

-- ── Empresas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  name        TEXT        NOT NULL,
  trade_name  TEXT,
  document    TEXT,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  zip_code    TEXT,
  phone       TEXT,
  email       TEXT,
  logo_url    TEXT,
  active      BOOLEAN     DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);

-- ── Usuários ─────────────────────────────────────────────────
-- Colunas obrigatórias para autenticação JWT:
--   username  → login pelo campo "identifier"
--   email     → login alternativo
--   pass_hash → bcrypt hash (rounds=12)
--   hash_algo → 'bcrypt' ou 'sha256' (legado)
--   active    → filtra ativos apenas
--   role      → 'admin' | 'user' | 'manager'
--   workspace → isolamento multi-tenant
CREATE TABLE IF NOT EXISTS users (
  id            TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  username      TEXT        NOT NULL UNIQUE,
  email         TEXT        UNIQUE,
  pass_hash     TEXT        NOT NULL,
  hash_algo     TEXT        DEFAULT 'bcrypt'
                CHECK (hash_algo = ANY (ARRAY['sha256','bcrypt'])),
  role          TEXT        DEFAULT 'user'
                CHECK (role = ANY (ARRAY['admin','user','manager'])),
  active        BOOLEAN     DEFAULT true,
  failed_logins INTEGER     DEFAULT 0,
  locked_until  TIMESTAMPTZ,
  last_login    TIMESTAMPTZ,
  workspace     TEXT        DEFAULT 'principal',
  company_id    TEXT        REFERENCES companies(id),
  name          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- ── Categorias (de cliente ou produto) ───────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace   TEXT        DEFAULT 'principal',
  company_id  TEXT        REFERENCES companies(id),
  name        TEXT        NOT NULL,
  description TEXT,
  active      BOOLEAN     DEFAULT true,
  parent_id   TEXT        REFERENCES categories(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- ── Clientes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id                    TEXT             NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace             TEXT             DEFAULT 'principal',
  company_id            TEXT             REFERENCES companies(id),
  name                  TEXT             NOT NULL,
  document              TEXT,
  tel                   TEXT,
  tel2                  TEXT,
  email                 TEXT,
  status                TEXT             DEFAULT 'interessado'
    CHECK (status = ANY (ARRAY[
      'interessado','visitado','agendado','comprou',
      'naointeressado','retornar','outro'])),
  category              TEXT             DEFAULT 'geral',
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  zip_code              TEXT,
  lat                   DOUBLE PRECISION,
  lng                   DOUBLE PRECISION,
  maps_link             TEXT,
  obs                   TEXT,
  indicado              TEXT,
  user_id               TEXT             REFERENCES users(id),
  document_front_path   TEXT,
  document_back_path    TEXT,
  residence_proof_path  TEXT,
  created_at            TIMESTAMPTZ      DEFAULT NOW(),
  updated_at            TIMESTAMPTZ      DEFAULT NOW(),
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);

-- ── Produtos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                 TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace          TEXT        DEFAULT 'principal',
  company_id         TEXT        REFERENCES companies(id),
  category_id        TEXT        REFERENCES categories(id),
  name               TEXT        NOT NULL,
  description        TEXT,
  sku                TEXT,
  model              TEXT,
  color              TEXT,
  finame_code        TEXT        DEFAULT '',
  ncm_code           TEXT        DEFAULT '',
  unit_price         NUMERIC     DEFAULT 0,
  cost_price         NUMERIC     DEFAULT 0,
  stock_qty          NUMERIC     DEFAULT 0,
  unit               TEXT        DEFAULT 'UN',
  rep_commission_pct NUMERIC     DEFAULT 0,
  active             BOOLEAN     DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- ── Indicadores / Referrals ───────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id              TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace       TEXT        DEFAULT 'principal',
  name            TEXT        NOT NULL,
  document        TEXT,
  tel             TEXT,
  email           TEXT,
  commission_type TEXT        DEFAULT 'fixed'
    CHECK (commission_type = ANY (ARRAY['fixed','percent'])),
  commission_pct  NUMERIC     DEFAULT 0,
  commission      NUMERIC     DEFAULT 0,
  bank_name       TEXT,
  bank_agency     TEXT,
  bank_account    TEXT,
  bank_pix        TEXT,
  active          BOOLEAN     DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT referrals_pkey PRIMARY KEY (id)
);

-- ── Pedidos ──────────────────────────────────────────────────
-- NOTA: a coluna 'items' NÃO existe aqui — itens ficam em order_items.
-- Bug histórico: o payload da API enviava items junto ao pedido,
-- causando erro "could not find items column". CORRIGIDO em orders/route.ts
-- via destructuring: const { items, ...orderData } = body;
CREATE TABLE IF NOT EXISTS orders (
  id               TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace        TEXT        DEFAULT 'principal',
  order_number     BIGINT,
  client_id        TEXT        REFERENCES clients(id),
  referral_id      TEXT        REFERENCES referrals(id),
  environment_id   TEXT,
  user_id          TEXT        REFERENCES users(id),
  date             DATE        DEFAULT CURRENT_DATE,
  status           TEXT        DEFAULT 'pendente'
    CHECK (status = ANY (ARRAY['pendente','aprovado','pago','cancelado','faturado'])),
  payment_type     TEXT        DEFAULT 'avista',
  total            NUMERIC     DEFAULT 0,
  discount         NUMERIC     DEFAULT 0,
  commission_type  TEXT        DEFAULT 'percent',
  commission_pct   NUMERIC     DEFAULT 0,
  commission_value NUMERIC     DEFAULT 0,
  obs              TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

-- Trigger para auto-numerar pedidos
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

-- ── Itens de Pedido ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id                 TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  order_id           TEXT        REFERENCES orders(id) ON DELETE CASCADE,
  product_id         TEXT        REFERENCES products(id),
  product_name       TEXT,
  quantity           NUMERIC     DEFAULT 1,
  unit_price         NUMERIC     DEFAULT 0,
  total              NUMERIC     DEFAULT 0,
  rep_commission_pct NUMERIC     DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id)
);

-- ── Visitas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id             TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace      TEXT        DEFAULT 'principal',
  client_id      TEXT        REFERENCES clients(id),
  user_id        TEXT        REFERENCES users(id),
  activity_type  TEXT        DEFAULT 'Visita'
    CHECK (activity_type = ANY (ARRAY['Visita','Ligação','WhatsApp','Email','Reunião'])),
  scheduled_date TIMESTAMPTZ,
  visit_date     TIMESTAMPTZ,
  status         TEXT        DEFAULT 'agendado'
    CHECK (status = ANY (ARRAY['agendado','realizado','cancelado','nao_compareceu'])),
  obs            TEXT,
  lat            DOUBLE PRECISION DEFAULT 0,
  lng            DOUBLE PRECISION DEFAULT 0,
  photos         JSONB       DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT visits_pkey PRIMARY KEY (id)
);

-- ── Comissões do Indicador ────────────────────────────────────
CREATE TABLE IF NOT EXISTS commissions (
  id               TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace        TEXT        DEFAULT 'principal',
  referral_id      TEXT        REFERENCES referrals(id),
  referral_name    TEXT,
  order_id         TEXT        REFERENCES orders(id) ON DELETE CASCADE,
  client_id        TEXT        REFERENCES clients(id),
  client_name      TEXT,
  amount           NUMERIC     NOT NULL DEFAULT 0,
  commission_type  TEXT        DEFAULT 'fixed',
  status           TEXT        DEFAULT 'pendente'
    CHECK (status = ANY (ARRAY['pendente','paga','cancelada'])),
  receipt_photo_ids JSONB      DEFAULT '[]',
  paid_at          TIMESTAMPTZ,
  order_date       DATE,
  order_total      NUMERIC,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT commissions_pkey PRIMARY KEY (id)
);

-- ── Comissões do Representante ────────────────────────────────
CREATE TABLE IF NOT EXISTS rep_commissions (
  id                 TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace          TEXT        DEFAULT 'principal',
  order_id           TEXT        REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id      TEXT,
  order_date         DATE,
  client_id          TEXT        REFERENCES clients(id),
  client_name        TEXT,
  product_id         TEXT        REFERENCES products(id),
  product_name       TEXT,
  qty                NUMERIC     DEFAULT 1,
  unit_price         NUMERIC     DEFAULT 0,
  rep_commission_pct NUMERIC     DEFAULT 0,
  amount             NUMERIC     NOT NULL DEFAULT 0,
  order_total        NUMERIC,
  status             TEXT        DEFAULT 'pendente'
    CHECK (status = ANY (ARRAY['pendente','paga','cancelada'])),
  receipt_photo_ids  JSONB       DEFAULT '[]',
  paid_at            TIMESTAMPTZ,
  reprocessed_at     TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT rep_commissions_pkey PRIMARY KEY (id)
);

-- ── KM Logs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS km_logs (
  id           TEXT             NOT NULL DEFAULT (gen_random_uuid())::text,
  user_id      TEXT             REFERENCES users(id),
  data         DATE             NOT NULL DEFAULT CURRENT_DATE,
  veiculo      TEXT,
  km_ini       DOUBLE PRECISION NOT NULL,
  km_fim       DOUBLE PRECISION NOT NULL,
  percorrido   DOUBLE PRECISION NOT NULL,
  combustivel  DOUBLE PRECISION DEFAULT 0,
  consumo      DOUBLE PRECISION,
  litros       DOUBLE PRECISION,
  custo_por_km DOUBLE PRECISION,
  obs          TEXT,
  created_at   TIMESTAMPTZ      DEFAULT NOW(),
  updated_at   TIMESTAMPTZ      DEFAULT NOW(),
  CONSTRAINT km_logs_pkey PRIMARY KEY (id)
);

-- ── Environments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS environments (
  id         TEXT             NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace  TEXT             DEFAULT 'principal',
  client_id  TEXT             REFERENCES clients(id) ON DELETE CASCADE,
  name       TEXT             NOT NULL,
  area       NUMERIC,
  area_unit  TEXT             DEFAULT 'ha',
  obs        TEXT,
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  drawing    JSONB,
  active     BOOLEAN          DEFAULT true,
  created_at TIMESTAMPTZ      DEFAULT NOW(),
  updated_at TIMESTAMPTZ      DEFAULT NOW(),
  CONSTRAINT environments_pkey PRIMARY KEY (id)
);

-- ── Fotos ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photos (
  id          TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace   TEXT        DEFAULT 'principal',
  entity_type TEXT        NOT NULL,
  entity_id   TEXT        NOT NULL,
  file_name   TEXT        NOT NULL,
  file_path   TEXT        NOT NULL,
  file_url    TEXT        NOT NULL,
  file_size   BIGINT,
  mime_type   TEXT,
  uploaded_by TEXT        REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT photos_pkey PRIMARY KEY (id)
);

-- ── Configurações ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id               TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace        TEXT        DEFAULT 'principal' UNIQUE,
  company_id       TEXT        REFERENCES companies(id),
  config           JSONB       DEFAULT '{}',
  dev_pin_hash     TEXT,
  dev_mode_expires TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);

-- ── Pré-cadastros / Leads ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS pre_registrations (
  id                  TEXT        NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace           TEXT        DEFAULT 'principal',
  name                TEXT        NOT NULL,
  tel                 TEXT,
  email               TEXT,
  interest            TEXT,
  source              TEXT        DEFAULT 'site',
  status              TEXT        DEFAULT 'novo'
    CHECK (status = ANY (ARRAY['novo','contatado','qualificado','convertido','perdido'])),
  obs                 TEXT,
  converted_client_id TEXT        REFERENCES clients(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pre_registrations_pkey PRIMARY KEY (id)
);

-- ── Audit Log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL   PRIMARY KEY,
  action     TEXT        NOT NULL,
  user_id    TEXT,
  username   TEXT,
  ip         TEXT,
  user_agent TEXT,
  meta       JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Rate Limits ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id         BIGSERIAL   PRIMARY KEY,
  key        TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- ÍNDICES
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_clients_status     ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_workspace  ON clients(workspace);
CREATE INDEX IF NOT EXISTS idx_clients_user       ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_client      ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_workspace   ON orders(workspace);
CREATE INDEX IF NOT EXISTS idx_order_items_order  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order  ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_ref    ON commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_rep_comm_order     ON rep_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_rep_comm_status    ON rep_commissions(status);
CREATE INDEX IF NOT EXISTS idx_visits_client      ON visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_user        ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key    ON rate_limits(key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action       ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created      ON audit_log(created_at DESC);

-- ══════════════════════════════════════════════════════════════
-- FUNÇÃO E TRIGGERS: updated_at automático
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','clients','orders','products','categories','referrals',
    'commissions','rep_commissions','visits','environments',
    'companies','settings','km_logs'
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

-- ══════════════════════════════════════════════════════════════
-- RLS — desabilitado (backend usa service_role que bypassa RLS)
-- ══════════════════════════════════════════════════════════════
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

-- ══════════════════════════════════════════════════════════════
-- SEEDS: empresa, usuário admin e categorias iniciais
-- ══════════════════════════════════════════════════════════════

-- Empresa padrão
INSERT INTO companies (id, name, trade_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'AgroVisita Pro', 'AgroVisita')
ON CONFLICT (id) DO NOTHING;

-- Usuário admin
-- Senha padrão: admin123
-- Hash bcrypt rounds=12 gerado offline e verificado
-- Para gerar outro: node scripts/generate-password-hash.js NOVA_SENHA
INSERT INTO users (
  id, company_id, username, email,
  pass_hash, hash_algo, role, active, workspace, name
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'admin@agrovisita.com.br',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY6C8yGHxR7XHZW',
  'bcrypt', 'admin', true, 'principal', 'Administrador'
)
ON CONFLICT (id) DO UPDATE SET
  pass_hash  = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY6C8yGHxR7XHZW',
  hash_algo  = 'bcrypt',
  active     = true;

-- Settings padrão
INSERT INTO settings (id, workspace, company_id, config)
VALUES (
  gen_random_uuid()::text,
  'principal',
  '00000000-0000-0000-0000-000000000001',
  '{}'
)
ON CONFLICT (workspace) DO NOTHING;

-- Categorias de produto iniciais
INSERT INTO categories (workspace, company_id, name)
SELECT 'principal', '00000000-0000-0000-0000-000000000001', unnest(ARRAY[
  'Defensivos', 'Fertilizantes', 'Sementes', 'Maquinário',
  'Irrigação', 'Nutrição Animal', 'Outros'
])
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'users','clients','orders','order_items','products','categories',
    'referrals','commissions','rep_commissions','visits','environments',
    'companies','settings','photos','audit_log','rate_limits','km_logs'
  ];
  v_table TEXT; v_ok BOOLEAN; v_erros INT := 0;
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    SELECT EXISTS(
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_table
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

  IF EXISTS(SELECT 1 FROM users WHERE username = 'admin' AND active = TRUE) THEN
    RAISE NOTICE '✅ Usuário admin criado — login: admin / admin123';
  ELSE RAISE WARNING '❌ Admin NÃO criado'; v_erros := v_erros + 1; END IF;

  IF v_erros = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 VisitAgroPro v0.9 — Schema OK!';
    RAISE NOTICE '   Login: admin / admin123';
    RAISE NOTICE '   Troque a senha em: /dashboard/settings';
  ELSE
    RAISE EXCEPTION '% erro(s). Verifique os warnings acima.', v_erros;
  END IF;
END $$;
