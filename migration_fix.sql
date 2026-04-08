-- ============================================================
-- MIGRAÇÃO SEGURA — Agrovisita Pro
-- Roda sobre banco existente sem destruir dados
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── 1. Garantir extensões ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. Tabela companies (cria se não existir) ────────────────
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

-- Seed empresa padrão
INSERT INTO companies (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Agrovisita Pro')
ON CONFLICT (id) DO NOTHING;

-- ── 3. Ajustar tabela users existente ────────────────────────
-- Adiciona colunas faltantes uma a uma (ignora se já existir)

ALTER TABLE users ADD COLUMN IF NOT EXISTS username      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pass_hash     TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hash_algo     TEXT DEFAULT 'bcrypt';
ALTER TABLE users ADD COLUMN IF NOT EXISTS role          TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS active        BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace     TEXT DEFAULT 'principal';
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id    TEXT REFERENCES companies(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_logins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until  TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login    TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name          TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- Se veio do schema antigo com password_hash, copia para pass_hash
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    UPDATE users SET pass_hash = password_hash WHERE pass_hash IS NULL;
  END IF;
END $$;

-- Se veio do schema antigo com is_active, copia para active
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    UPDATE users SET active = is_active WHERE active IS NULL;
  END IF;
END $$;

-- Garante que active = true para registros sem valor
UPDATE users SET active = true WHERE active IS NULL;

-- Adiciona UNIQUE em username se ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_username_key'
  ) THEN
    -- Só adiciona se não há duplicatas
    IF (SELECT COUNT(*) FROM (
          SELECT username FROM users WHERE username IS NOT NULL
          GROUP BY username HAVING COUNT(*) > 1
        ) dups) = 0 THEN
      ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
  END IF;
END $$;

-- ── 4. Demais tabelas (cria se não existirem) ────────────────

CREATE TABLE IF NOT EXISTS clients (
  id         TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace  TEXT DEFAULT 'principal',
  company_id TEXT REFERENCES companies(id),
  name       TEXT NOT NULL,
  document   TEXT,
  tel        TEXT,
  email      TEXT,
  status     TEXT DEFAULT 'interessado',
  address    TEXT,
  city       TEXT,
  state      TEXT,
  zip_code   TEXT,
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  maps_link  TEXT,
  obs        TEXT,
  indicado   TEXT,
  user_id    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace   TEXT DEFAULT 'principal',
  company_id  TEXT REFERENCES companies(id),
  name        TEXT NOT NULL,
  description TEXT,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

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

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace        TEXT DEFAULT 'principal',
  order_number     BIGINT,
  client_id        TEXT,
  user_id          TEXT,
  date             DATE DEFAULT CURRENT_DATE,
  status           TEXT DEFAULT 'pendente',
  total            NUMERIC DEFAULT 0,
  discount         NUMERIC DEFAULT 0,
  commission_pct   NUMERIC DEFAULT 0,
  commission_value NUMERIC DEFAULT 0,
  obs              TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

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

CREATE TABLE IF NOT EXISTS visits (
  id             TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace      TEXT DEFAULT 'principal',
  client_id      TEXT REFERENCES clients(id),
  user_id        TEXT,
  activity_type  TEXT DEFAULT 'Visita',
  scheduled_date TIMESTAMPTZ,
  visit_date     TIMESTAMPTZ,
  status         TEXT DEFAULT 'agendado',
  obs            TEXT,
  lat            DOUBLE PRECISION DEFAULT 0,
  lng            DOUBLE PRECISION DEFAULT 0,
  photos         JSONB DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT visits_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS km_logs (
  id         TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  user_id    TEXT,
  data       DATE NOT NULL DEFAULT CURRENT_DATE,
  veiculo    TEXT,
  km_ini     DOUBLE PRECISION NOT NULL DEFAULT 0,
  km_fim     DOUBLE PRECISION NOT NULL DEFAULT 0,
  percorrido DOUBLE PRECISION NOT NULL DEFAULT 0,
  obs        TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT km_logs_pkey PRIMARY KEY (id)
);

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

CREATE TABLE IF NOT EXISTS rate_limits (
  id         BIGSERIAL PRIMARY KEY,
  key        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_clients_status  ON clients(status);
CREATE INDEX IF NOT EXISTS idx_orders_client   ON orders(client_id);

-- ── 5. Desabilitar RLS (service_role precisa de acesso total) ─
ALTER TABLE users       DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients     DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders      DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits      DISABLE ROW LEVEL SECURITY;
ALTER TABLE products    DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories  DISABLE ROW LEVEL SECURITY;
ALTER TABLE km_logs     DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log   DISABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies   DISABLE ROW LEVEL SECURITY;

-- ── 6. Seed categorias ───────────────────────────────────────
INSERT INTO categories (company_id, name)
SELECT '00000000-0000-0000-0000-000000000001', unnest(ARRAY[
  'Defensivos','Fertilizantes','Sementes','Maquinário'
])
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- ── 7. USUÁRIO ADMIN ─────────────────────────────────────────
-- ATENÇÃO: substitua o valor de pass_hash pelo hash gerado com:
--   node scripts/generate-password-hash.js admin123
--
-- Se já existe um usuário admin, apenas atualiza o hash.
-- Se não existe, insere um novo.

DO $$
DECLARE
  v_hash TEXT := 'COLE_O_HASH_AQUI';  -- ← substitua este valor
BEGIN
  IF v_hash = 'COLE_O_HASH_AQUI' THEN
    RAISE NOTICE '⚠️  ATENÇÃO: Substitua COLE_O_HASH_AQUI pelo hash gerado com: node scripts/generate-password-hash.js admin123';
  ELSE
    INSERT INTO users (
      id, company_id, username, email,
      pass_hash, hash_algo, role, active, workspace, name
    ) VALUES (
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000001',
      'admin',
      'admin@agrovisita.com.br',
      v_hash,
      'bcrypt',
      'admin',
      true,
      'principal',
      'Administrador'
    )
    ON CONFLICT (id) DO UPDATE SET
      pass_hash  = EXCLUDED.pass_hash,
      active     = true,
      username   = EXCLUDED.username,
      company_id = EXCLUDED.company_id;

    RAISE NOTICE '✅ Usuário admin inserido/atualizado com sucesso.';
  END IF;
END $$;

-- ── Verificação final ────────────────────────────────────────
SELECT
  id,
  username,
  email,
  role,
  active,
  CASE WHEN pass_hash IS NOT NULL AND pass_hash != 'COLE_O_HASH_AQUI'
       THEN '✅ hash presente'
       ELSE '❌ hash ausente ou placeholder'
  END AS hash_status
FROM users
WHERE username = 'admin';
