-- ============================================================
-- AgrovisitaPRO — Schema Completo Unificado v1.0
-- Combina: Segurança e Mapa (AgrovisitaV3_2) + Gestão Completa (Visitas 10_3)
-- Execute no SQL Editor do Supabase em um projeto vazio.
-- ============================================================

-- ── EXTENSÕES ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- bcrypt para senhas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- gen_random_uuid()

-- ============================================================
-- TABELAS PRINCIPAIS
-- ============================================================

-- ── USUÁRIOS (segurança aprimorada do AgrovisitaV3_2) ───────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  username      TEXT        NOT NULL UNIQUE,
  email         TEXT        UNIQUE,
  pass_hash     TEXT        NOT NULL,
  hash_algo     TEXT        DEFAULT 'bcrypt' CHECK (hash_algo IN ('sha256','bcrypt')),
  role          TEXT        DEFAULT 'user' CHECK (role IN ('admin','user','manager')),
  active        BOOLEAN     DEFAULT TRUE,
  failed_logins INTEGER     DEFAULT 0,
  locked_until  TIMESTAMPTZ,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── EMPRESAS / WORKSPACES (do Visitas 10_3) ─────────────────
CREATE TABLE IF NOT EXISTS companies (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name            TEXT NOT NULL,
  trade_name      TEXT,
  document        TEXT, -- CNPJ/CPF
  address         TEXT,
  city            TEXT,
  state           TEXT,
  zip_code        TEXT,
  phone           TEXT,
  email           TEXT,
  logo_url        TEXT,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── CLIENTES (combina geolocalização + documentos) ──────────
CREATE TABLE IF NOT EXISTS clients (
  id                    TEXT PRIMARY KEY,
  workspace             TEXT DEFAULT 'principal',
  name                  TEXT NOT NULL,
  document              TEXT, -- CPF/CNPJ
  tel                   TEXT,
  email                 TEXT,
  status                TEXT DEFAULT 'interessado'
                        CHECK (status IN ('interessado','visitado','agendado','comprou','naointeressado','retornar','outro')),
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  zip_code              TEXT,
  lat                   DOUBLE PRECISION,
  lng                   DOUBLE PRECISION,
  maps_link             TEXT,
  obs                   TEXT,
  indicado              TEXT, -- quem indicou
  user_id               TEXT, -- responsável
  document_front_path   TEXT,
  document_back_path    TEXT,
  residence_proof_path  TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── CATEGORIAS DE PRODUTOS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  workspace     TEXT DEFAULT 'principal',
  name          TEXT NOT NULL,
  description   TEXT,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── PRODUTOS (com FINAME e NCM do Visitas 10_3) ─────────────
CREATE TABLE IF NOT EXISTS products (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  workspace         TEXT DEFAULT 'principal',
  category_id       TEXT REFERENCES categories(id),
  name              TEXT NOT NULL,
  description       TEXT,
  sku               TEXT,
  finame_code       TEXT DEFAULT '',
  ncm_code          TEXT DEFAULT '',
  unit_price        DECIMAL(10,2) DEFAULT 0,
  cost_price        DECIMAL(10,2) DEFAULT 0,
  stock_qty         DECIMAL(10,2) DEFAULT 0,
  unit              TEXT DEFAULT 'UN',
  rep_commission_pct DECIMAL(5,2) DEFAULT 0, -- comissão representante %
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── AMBIENTES / TALHÕES (do Visitas 10_3) ───────────────────
CREATE TABLE IF NOT EXISTS environments (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  workspace     TEXT DEFAULT 'principal',
  client_id     TEXT REFERENCES clients(id),
  name          TEXT NOT NULL,
  area          DECIMAL(10,2), -- área em hectares
  area_unit     TEXT DEFAULT 'ha',
  obs           TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  drawing       JSONB, -- polígono do ambiente
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDICADORES (para comissões de indicação) ───────────────
CREATE TABLE IF NOT EXISTS referrals (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  workspace       TEXT DEFAULT 'principal',
  name            TEXT NOT NULL,
  document        TEXT,
  tel             TEXT,
  email           TEXT,
  commission_type TEXT DEFAULT 'fixed' CHECK (commission_type IN ('fixed','percent')),
  commission_pct  DECIMAL(5,2) DEFAULT 0,
  commission      DECIMAL(10,2) DEFAULT 0, -- valor fixo
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── PEDIDOS / VENDAS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  workspace       TEXT DEFAULT 'principal',
  order_number    BIGINT,
  client_id       TEXT REFERENCES clients(id),
  referral_id     TEXT REFERENCES referrals(id),
  environment_id  TEXT REFERENCES environments(id),
  user_id         TEXT REFERENCES users(id),
  date            DATE DEFAULT CURRENT_DATE,
  status          TEXT DEFAULT 'pendente'
                  CHECK (status IN ('pendente','aprovado','pago','cancelado','faturado')),
  total           DECIMAL(10,2) DEFAULT 0,
  discount        DECIMAL(10,2) DEFAULT 0,
  commission_type TEXT DEFAULT 'percent',
  commission_pct  DECIMAL(5,2) DEFAULT 0,
  commission_value DECIMAL(10,2) DEFAULT 0,
  obs             TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ITENS DO PEDIDO ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  order_id          TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id        TEXT REFERENCES products(id),
  product_name      TEXT, -- snapshot do nome
  quantity          DECIMAL(10,2) DEFAULT 1,
  unit_price        DECIMAL(10,2) DEFAULT 0,
  total             DECIMAL(10,2) DEFAULT 0,
  rep_commission_pct DECIMAL(5,2) DEFAULT 0, -- snapshot da comissão
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── COMISSÕES DE INDICADORES ────────────────────────────────
CREATE TABLE IF NOT EXISTS commissions (
  id              TEXT PRIMARY KEY,
  workspace       TEXT DEFAULT 'principal',
  referral_id     TEXT REFERENCES referrals(id),
  referral_name   TEXT,
  order_id        TEXT REFERENCES orders(id),
  client_id       TEXT REFERENCES clients(id),
  client_name     TEXT,
  amount          DECIMAL(10,2) NOT NULL,
  commission_type TEXT DEFAULT 'fixed',
  status          TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','paga','cancelada')),
  receipt_photo_ids JSONB DEFAULT '[]',
  paid_at         TIMESTAMPTZ,
  order_date      DATE,
  order_total     DECIMAL(10,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── COMISSÕES DE REPRESENTANTES ─────────────────────────────
CREATE TABLE IF NOT EXISTS rep_commissions (
  id                TEXT PRIMARY KEY,
  workspace         TEXT DEFAULT 'principal',
  order_id          TEXT REFERENCES orders(id),
  order_item_id     TEXT, -- chave por item do pedido
  order_date        DATE,
  client_id         TEXT REFERENCES clients(id),
  client_name       TEXT,
  product_id        TEXT REFERENCES products(id),
  product_name      TEXT,
  qty               DECIMAL(10,2) DEFAULT 1,
  unit_price        DECIMAL(10,2) DEFAULT 0,
  rep_commission_pct DECIMAL(5,2) DEFAULT 0,
  amount            DECIMAL(10,2) NOT NULL,
  order_total       DECIMAL(10,2),
  status            TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','paga','cancelada')),
  receipt_photo_ids JSONB DEFAULT '[]',
  paid_at           TIMESTAMPTZ,
  reprocessed_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTROLE DE KM (do AgrovisitaV3_2) ──────────────────────
CREATE TABLE IF NOT EXISTS km_logs (
  id            TEXT PRIMARY KEY,
  user_id       TEXT REFERENCES users(id),
  data          DATE NOT NULL,
  veiculo       TEXT,
  km_ini        DOUBLE PRECISION NOT NULL,
  km_fim        DOUBLE PRECISION NOT NULL,
  percorrido    DOUBLE PRECISION NOT NULL,
  combustivel   DOUBLE PRECISION DEFAULT 0,
  consumo       DOUBLE PRECISION,
  litros        DOUBLE PRECISION,
  custo_por_km  DOUBLE PRECISION,
  obs           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── VISITAS / AGENDAMENTOS (do Visitas 10_3 com geo) ───────
CREATE TABLE IF NOT EXISTS visits (
  id              TEXT PRIMARY KEY,
  workspace       TEXT DEFAULT 'principal',
  client_id       TEXT REFERENCES clients(id),
  user_id         TEXT REFERENCES users(id),
  activity_type   TEXT DEFAULT 'Visita' CHECK (activity_type IN ('Visita','Ligação','WhatsApp','Email','Reunião')),
  scheduled_date  TIMESTAMPTZ,
  visit_date      TIMESTAMPTZ,
  status          TEXT DEFAULT 'agendado' CHECK (status IN ('agendado','realizado','cancelado','nao_compareceu')),
  obs             TEXT,
  lat             DOUBLE PRECISION DEFAULT 0,
  lng             DOUBLE PRECISION DEFAULT 0,
  photos          JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── PRÉ-CADASTRO (leads do Visitas 10_3) ───────────────────
CREATE TABLE IF NOT EXISTS pre_registrations (
  id            TEXT PRIMARY KEY,
  workspace     TEXT DEFAULT 'principal',
  name          TEXT NOT NULL,
  tel           TEXT,
  email         TEXT,
  interest      TEXT,
  source        TEXT DEFAULT 'site',
  status        TEXT DEFAULT 'novo' CHECK (status IN ('novo','contatado','qualificado','convertido','perdido')),
  obs           TEXT,
  converted_client_id TEXT REFERENCES clients(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── FOTOS / ARQUIVOS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photos (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  workspace     TEXT DEFAULT 'principal',
  entity_type   TEXT NOT NULL, -- 'client','visit','commission','rep_commission'
  entity_id     TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  file_path     TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_size     BIGINT,
  mime_type     TEXT,
  uploaded_by   TEXT REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── RATE LIMITING (segurança AgrovisitaV3_2) ───────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id         BIGSERIAL PRIMARY KEY,
  key        TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── AUDIT LOG (segurança AgrovisitaV3_2) ────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  action     TEXT NOT NULL,
  user_id    TEXT,
  username   TEXT,
  ip         TEXT,
  user_agent TEXT,
  meta       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CONFIGURAÇÕES DA EMPRESA ────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  workspace     TEXT DEFAULT 'principal' UNIQUE,
  company_id    TEXT REFERENCES companies(id),
  config        JSONB DEFAULT '{}',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

-- Clientes
CREATE INDEX IF NOT EXISTS idx_clients_workspace ON clients(workspace);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_updated_at ON clients(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_geo ON clients(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_docs
  ON clients (workspace)
  WHERE document_front_path IS NOT NULL OR document_back_path IS NOT NULL OR residence_proof_path IS NOT NULL;

-- Produtos
CREATE INDEX IF NOT EXISTS idx_products_workspace ON products(workspace);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_ncm ON products(workspace, ncm_code) WHERE ncm_code IS NOT NULL AND ncm_code <> '';
CREATE INDEX IF NOT EXISTS idx_products_finame ON products(workspace, finame_code) WHERE finame_code IS NOT NULL AND finame_code <> '';
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active) WHERE active = TRUE;

-- Pedidos
CREATE INDEX IF NOT EXISTS idx_orders_workspace ON orders(workspace);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number) WHERE order_number IS NOT NULL;

-- Itens do pedido
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Comissões
CREATE INDEX IF NOT EXISTS idx_commissions_workspace ON commissions(workspace);
CREATE INDEX IF NOT EXISTS idx_commissions_referral ON commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

CREATE INDEX IF NOT EXISTS idx_rep_commissions_workspace ON rep_commissions(workspace);
CREATE INDEX IF NOT EXISTS idx_rep_commissions_order ON rep_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_rep_commissions_status ON rep_commissions(status);

-- Visitas
CREATE INDEX IF NOT EXISTS idx_visits_workspace ON visits(workspace);
CREATE INDEX IF NOT EXISTS idx_visits_client ON visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_user ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_activity ON visits(workspace, client_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_visits_geo ON visits(workspace) WHERE lat <> 0 AND lng <> 0;
CREATE INDEX IF NOT EXISTS idx_visits_scheduled ON visits(scheduled_date) WHERE scheduled_date IS NOT NULL;

-- KM
CREATE INDEX IF NOT EXISTS idx_km_user_id ON km_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_km_data ON km_logs(data DESC);
CREATE INDEX IF NOT EXISTS idx_km_updated_at ON km_logs(updated_at DESC);

-- Audit log
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_username ON audit_log(username);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON audit_log(ip);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);

-- Rate limits
CREATE INDEX IF NOT EXISTS idx_rate_key_time ON rate_limits(key, created_at DESC);

-- ============================================================
-- FUNÇÕES E TRIGGERS
-- ============================================================

-- Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica trigger em todas as tabelas com updated_at
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_environments_updated_at BEFORE UPDATE ON environments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_commissions_updated_at BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_rep_commissions_updated_at BEFORE UPDATE ON rep_commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_km_logs_updated_at BEFORE UPDATE ON km_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_pre_registrations_updated_at BEFORE UPDATE ON pre_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Sequência para número do pedido
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1;

-- Trigger: gera order_number automático
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

-- Função: verificar senha (bcrypt + sha256 legado)
CREATE OR REPLACE FUNCTION verify_user_pass(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash      TEXT;
  v_algo      TEXT;
  v_locked    TIMESTAMPTZ;
  v_result    BOOLEAN := FALSE;
BEGIN
  SELECT pass_hash, COALESCE(hash_algo, 'bcrypt'), locked_until
    INTO v_hash, v_algo, v_locked
    FROM users
   WHERE username = p_username AND active = TRUE;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF v_locked IS NOT NULL AND v_locked > NOW() THEN
    RETURN FALSE;
  END IF;

  IF v_algo = 'bcrypt' THEN
    v_result := (crypt(p_password, v_hash) = v_hash);
  ELSE
    v_result := (v_hash = encode(digest(p_password, 'sha256'), 'hex'));
  END IF;

  IF v_result THEN
    UPDATE users SET failed_logins = 0, locked_until = NULL, last_login = NOW()
     WHERE username = p_username;
  ELSE
    UPDATE users
       SET failed_logins = COALESCE(failed_logins, 0) + 1,
           locked_until = CASE
             WHEN COALESCE(failed_logins, 0) + 1 >= 5
             THEN NOW() + INTERVAL '15 minutes'
             ELSE locked_until
           END
     WHERE username = p_username;
  END IF;

  RETURN v_result;
END;
$$;

-- Função: criar/atualizar usuário com bcrypt
CREATE OR REPLACE FUNCTION upsert_user(p_username TEXT, p_password TEXT, p_role TEXT DEFAULT 'user')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_id TEXT;
BEGIN
  INSERT INTO users (id, username, pass_hash, hash_algo, role, active)
  VALUES (
    gen_random_uuid()::TEXT,
    p_username,
    crypt(p_password, gen_salt('bf', 12)),
    'bcrypt',
    p_role,
    TRUE
  )
  ON CONFLICT (username) DO UPDATE
    SET pass_hash = crypt(p_password, gen_salt('bf', 12)),
        hash_algo = 'bcrypt',
        failed_logins = 0,
        locked_until = NULL
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rep_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE km_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (simplificadas - ajustar conforme necessidade)
-- Usuários: apenas admin pode ver todos, usuário vê apenas si mesmo
DROP POLICY IF EXISTS "users_policy" ON users;
CREATE POLICY "users_policy" ON users
  FOR ALL USING (
    id = current_setting('request.jwt.claims', TRUE)::jsonb->>'sub'
    OR EXISTS (
      SELECT 1 FROM users WHERE id = (current_setting('request.jwt.claims', TRUE)::jsonb->>'sub') AND role = 'admin'
    )
  );

-- Demais tabelas: acesso baseado em workspace ou user_id
DROP POLICY IF EXISTS "workspace_policy" ON clients;
CREATE POLICY "workspace_policy" ON clients
  FOR ALL USING (
    workspace = current_setting('request.workspace', TRUE)
    OR current_setting('request.jwt.claims', TRUE)::jsonb->>'role' = 'admin'
  );

DROP POLICY IF EXISTS "km_policy" ON km_logs;
CREATE POLICY "km_policy" ON km_logs
  FOR ALL USING (
    user_id = current_setting('request.jwt.claims', TRUE)::jsonb->>'sub'
    OR current_setting('request.jwt.claims', TRUE)::jsonb->>'role' = 'admin'
  );

-- Tabelas sem acesso público direto
DROP POLICY IF EXISTS "no_public_users" ON users;
CREATE POLICY "no_public_users" ON users FOR ALL USING (false);

DROP POLICY IF EXISTS "no_public_rate_limits" ON rate_limits;
CREATE POLICY "no_public_rate_limits" ON rate_limits FOR ALL USING (false);

DROP POLICY IF EXISTS "no_public_audit" ON audit_log;
CREATE POLICY "no_public_audit" ON audit_log FOR ALL USING (false);

-- ============================================================
-- GRANTS
-- ============================================================

GRANT EXECUTE ON FUNCTION verify_user_pass TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_user TO authenticated;
REVOKE ALL ON users FROM anon;

-- ============================================================
-- VIEWS DE AUDITORIA E RELATÓRIOS
-- ============================================================

-- Logins recentes
CREATE OR REPLACE VIEW logins_recentes AS
SELECT username, ip, action, meta, created_at
FROM audit_log
WHERE action IN ('login_ok','login_fail')
ORDER BY created_at DESC
LIMIT 200;

-- IPs suspeitos
CREATE OR REPLACE VIEW ips_suspeitos AS
SELECT
  ip,
  COUNT(*) FILTER (WHERE action = 'login_fail') AS falhas,
  COUNT(*) FILTER (WHERE action = 'login_ok') AS sucessos,
  MAX(created_at) AS ultima_tentativa
FROM audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND ip IS NOT NULL
GROUP BY ip
HAVING COUNT(*) FILTER (WHERE action = 'login_fail') >= 3
ORDER BY falhas DESC;

-- KM mensal por usuário
CREATE OR REPLACE VIEW km_mensal AS
SELECT
  user_id,
  TO_CHAR(data, 'YYYY-MM') AS mes,
  COUNT(*) AS total_registros,
  SUM(percorrido) AS total_km,
  SUM(combustivel) AS total_combustivel,
  ROUND(AVG(custo_por_km)::numeric, 2) AS media_custo_km
FROM km_logs
GROUP BY user_id, TO_CHAR(data, 'YYYY-MM')
ORDER BY mes DESC;

-- Resumo de comissões pendentes
CREATE OR REPLACE VIEW comissoes_pendentes AS
SELECT
  workspace,
  COUNT(*) AS quantidade,
  SUM(amount) AS total_pendente
FROM commissions
WHERE status = 'pendente'
GROUP BY workspace;

CREATE OR REPLACE VIEW rep_comissoes_pendentes AS
SELECT
  workspace,
  COUNT(*) AS quantidade,
  SUM(amount) AS total_pendente
FROM rep_commissions
WHERE status = 'pendente'
GROUP BY workspace;

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Usuário admin padrão (senha: J12u08m19t79@)
SELECT upsert_user('admin', 'J12u08m19t79@', 'admin');

-- Workspace padrão
INSERT INTO settings (id, workspace, config)
VALUES (gen_random_uuid()::TEXT, 'principal', '{"theme": "dark", "map_provider": "openstreetmap"}')
ON CONFLICT (workspace) DO NOTHING;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'users','companies','clients','categories','products','environments',
    'referrals','orders','order_items','commissions','rep_commissions',
    'km_logs','visits','pre_registrations','photos','rate_limits','audit_log','settings'
  ];
  v_table TEXT;
  v_exists BOOLEAN;
  v_errors INT := 0;
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = v_table
    ) INTO v_exists;
    IF v_exists THEN
      RAISE NOTICE '✅ Tabela existe: %', v_table;
    ELSE
      RAISE WARNING '❌ Tabela ausente: %', v_table;
      v_errors := v_errors + 1;
    END IF;
  END LOOP;

  -- Verifica usuário admin
  IF EXISTS (SELECT 1 FROM users WHERE username = 'admin' AND active = TRUE) THEN
    RAISE NOTICE '✅ Usuário admin criado com sucesso';
  ELSE
    RAISE WARNING '❌ Usuário admin NÃO foi criado';
    v_errors := v_errors + 1;
  END IF;

  IF v_errors = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Schema AgrovisitaPRO criado com sucesso!';
    RAISE NOTICE '   Login: admin / J12u08m19t79@';
  ELSE
    RAISE EXCEPTION '% erro(s) encontrado(s). Verifique os warnings acima.', v_errors;
  END IF;
END $$;

-- ============================================================
-- FIM DO SCHEMA AGROVISITAPRO v1.0
-- ============================================================
