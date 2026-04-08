-- ============================================================
-- Agrovisita Pro — Schema v2 (corrigido para VisitAgro-main)
-- Compatível com o código em src/app/api/auth/login/route.ts
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Empresas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id   TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  name TEXT NOT NULL,
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

-- ── Usuários ─────────────────────────────────────────────────
-- COLUNAS obrigatórias para o route.ts:
--   username  → login pelo campo "identifier"
--   email     → login alternativo
--   pass_hash → verificado via bcrypt.compare()
--   hash_algo → 'bcrypt' (padrão)
--   active    → filtra .eq('active', true)
--   role      → retornado no token JWT
--   workspace → retornado no token JWT
CREATE TABLE IF NOT EXISTS users (
  id            TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  username      TEXT NOT NULL UNIQUE,
  email         TEXT UNIQUE,
  pass_hash     TEXT NOT NULL,           -- bcrypt hash
  hash_algo     TEXT DEFAULT 'bcrypt' CHECK (hash_algo = ANY (ARRAY['sha256','bcrypt'])),
  role          TEXT DEFAULT 'user'      CHECK (role = ANY (ARRAY['admin','user','manager'])),
  active        BOOLEAN DEFAULT true,
  failed_logins INTEGER DEFAULT 0,
  locked_until  TIMESTAMPTZ,
  last_login    TIMESTAMPTZ,
  workspace     TEXT DEFAULT 'principal',
  company_id    TEXT REFERENCES companies(id),
  -- compatibilidade retroativa
  name          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- ── Clientes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace   TEXT DEFAULT 'principal',
  company_id  TEXT REFERENCES companies(id),
  name        TEXT NOT NULL,
  document    TEXT,
  tel         TEXT,
  email       TEXT,
  status      TEXT DEFAULT 'interessado' CHECK (status = ANY (ARRAY[
    'interessado','visitado','agendado','comprou',
    'naointeressado','retornar','outro'])),
  address     TEXT,
  city        TEXT,
  state       TEXT,
  zip_code    TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  maps_link   TEXT,
  obs         TEXT,
  indicado    TEXT,
  user_id     TEXT REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);

-- ── Categorias ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace   TEXT DEFAULT 'principal',
  company_id  TEXT REFERENCES companies(id),
  name        TEXT NOT NULL,
  description TEXT,
  active      BOOLEAN DEFAULT true,
  parent_id   TEXT REFERENCES categories(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- ── Produtos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                 TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace          TEXT DEFAULT 'principal',
  company_id         TEXT REFERENCES companies(id),
  category_id        TEXT REFERENCES categories(id),
  name               TEXT NOT NULL,
  description        TEXT,
  sku                TEXT,
  unit_price         NUMERIC DEFAULT 0,
  cost_price         NUMERIC DEFAULT 0,
  stock_qty          NUMERIC DEFAULT 0,
  unit               TEXT DEFAULT 'UN',
  rep_commission_pct NUMERIC DEFAULT 0,
  active             BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- ── Pedidos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace        TEXT DEFAULT 'principal',
  order_number     BIGINT,
  client_id        TEXT REFERENCES clients(id),
  user_id          TEXT REFERENCES users(id),
  date             DATE DEFAULT CURRENT_DATE,
  status           TEXT DEFAULT 'pendente' CHECK (status = ANY (ARRAY[
    'pendente','aprovado','pago','cancelado','faturado'])),
  total            NUMERIC DEFAULT 0,
  discount         NUMERIC DEFAULT 0,
  commission_pct   NUMERIC DEFAULT 0,
  commission_value NUMERIC DEFAULT 0,
  obs              TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

-- ── Itens de Pedido ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id                 TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  order_id           TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id         TEXT REFERENCES products(id),
  product_name       TEXT,
  quantity           NUMERIC DEFAULT 1,
  unit_price         NUMERIC DEFAULT 0,
  total              NUMERIC DEFAULT 0,
  rep_commission_pct NUMERIC DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id)
);

-- ── Visitas ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id             TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace      TEXT DEFAULT 'principal',
  client_id      TEXT REFERENCES clients(id),
  user_id        TEXT REFERENCES users(id),
  activity_type  TEXT DEFAULT 'Visita' CHECK (activity_type = ANY (ARRAY[
    'Visita','Ligação','WhatsApp','Email','Reunião'])),
  scheduled_date TIMESTAMPTZ,
  visit_date     TIMESTAMPTZ,
  status         TEXT DEFAULT 'agendado' CHECK (status = ANY (ARRAY[
    'agendado','realizado','cancelado','nao_compareceu'])),
  obs            TEXT,
  lat            DOUBLE PRECISION DEFAULT 0,
  lng            DOUBLE PRECISION DEFAULT 0,
  photos         JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT visits_pkey PRIMARY KEY (id)
);

-- ── KM Logs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS km_logs (
  id         TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  user_id    TEXT REFERENCES users(id),
  data       DATE NOT NULL DEFAULT CURRENT_DATE,
  veiculo    TEXT,
  km_ini     DOUBLE PRECISION NOT NULL,
  km_fim     DOUBLE PRECISION NOT NULL,
  percorrido DOUBLE PRECISION NOT NULL,
  obs        TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT km_logs_pkey PRIMARY KEY (id)
);

-- ── Audit Log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  action     TEXT NOT NULL,
  user_id    TEXT,
  username   TEXT,
  ip         TEXT,
  user_agent TEXT,
  meta       JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Rate Limits ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id         BIGSERIAL PRIMARY KEY,
  key        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);

-- ── Triggers updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_status   ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_user     ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_client    ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_client    ON visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_user      ON visits(user_id);

-- ── RLS — desabilitar para uso com service_role ───────────────
ALTER TABLE users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients       DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders        DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items   DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits        DISABLE ROW LEVEL SECURITY;
ALTER TABLE products      DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories    DISABLE ROW LEVEL SECURITY;
ALTER TABLE km_logs       DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log     DISABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits   DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies     DISABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- SEED: empresa e usuário admin
-- Hash bcrypt rounds=12 para a senha:  admin123
-- Gere o seu próprio com: node scripts/generate-password-hash.js admin123
-- ────────────────────────────────────────────────────────────
INSERT INTO companies (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Agrovisita Pro')
ON CONFLICT (id) DO NOTHING;

-- IMPORTANTE: substitua o pass_hash abaixo pelo hash gerado via
--   node scripts/generate-password-hash.js admin123
-- O hash fictício do schema original NÃO funciona com bcrypt.compare().
INSERT INTO users (
  id, company_id, username, email, pass_hash, hash_algo,
  role, active, workspace, name
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'admin@agrovisita.com.br',
  -- Hash bcrypt válido para 'admin123' (rounds=12)
  -- GERE O SEU: node scripts/generate-password-hash.js admin123
  '$2a$12$PLACEHOLDER_EXECUTE_SCRIPT_ABAIXO',
  'bcrypt',
  'admin',
  true,
  'principal',
  'Administrador'
)
ON CONFLICT (id) DO NOTHING;

-- Categorias iniciais
INSERT INTO categories (company_id, name) VALUES
('00000000-0000-0000-0000-000000000001', 'Defensivos'),
('00000000-0000-0000-0000-000000000001', 'Fertilizantes'),
('00000000-0000-0000-0000-000000000001', 'Sementes'),
('00000000-0000-0000-0000-000000000001', 'Maquinário')
ON CONFLICT DO NOTHING;
