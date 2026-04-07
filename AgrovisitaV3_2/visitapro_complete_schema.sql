-- ============================================================
-- VisitaPRO v3.2 — Schema Completo (projeto novo)
-- Execute INTEIRO no SQL Editor do Supabase em um projeto vazio.
-- ============================================================

-- ── EXTENSÕES ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- bcrypt para senhas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- gen_random_uuid()

-- ============================================================
-- TABELAS
-- ============================================================

-- ── USUÁRIOS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitapro_users (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  username      TEXT        NOT NULL UNIQUE,
  pass_hash     TEXT        NOT NULL,
  hash_algo     TEXT        DEFAULT 'bcrypt' CHECK (hash_algo IN ('sha256','bcrypt')),
  role          TEXT        DEFAULT 'user'   CHECK (role IN ('admin','user')),
  active        BOOLEAN     DEFAULT TRUE,
  failed_logins INTEGER     DEFAULT 0,
  locked_until  TIMESTAMPTZ,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── CLIENTES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitapro_clients (
  id          TEXT             PRIMARY KEY,
  nome        TEXT             NOT NULL,
  tel         TEXT,
  estudas     TEXT,
  status      TEXT             DEFAULT 'interessado'
              CHECK (status IN ('interessado','visitado','agendado','comprou','naointeressado','retornar','outro')),
  endereco    TEXT,
  indicado    TEXT,
  obs         TEXT,
  maps_link   TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  user_id     TEXT,
  updated_at  TIMESTAMPTZ      DEFAULT NOW(),
  created_at  TIMESTAMPTZ      DEFAULT NOW()
);

-- ── CONTROLE DE KM ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitapro_km (
  id           TEXT             PRIMARY KEY,
  user_id      TEXT,
  data         DATE             NOT NULL,
  veiculo      TEXT,
  km_ini       DOUBLE PRECISION NOT NULL,
  km_fim       DOUBLE PRECISION NOT NULL,
  percorrido   DOUBLE PRECISION NOT NULL,
  combustivel  DOUBLE PRECISION DEFAULT 0,
  consumo      DOUBLE PRECISION,
  litros       DOUBLE PRECISION,
  custo_por_km DOUBLE PRECISION,
  obs          TEXT,
  updated_at   TIMESTAMPTZ      DEFAULT NOW(),
  created_at   TIMESTAMPTZ      DEFAULT NOW()
);

-- ── RATE LIMITING ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitapro_rate_limits (
  id         BIGSERIAL    PRIMARY KEY,
  key        TEXT         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── AUDIT LOG ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitapro_audit_log (
  id         BIGSERIAL    PRIMARY KEY,
  action     TEXT         NOT NULL,
  user_id    TEXT,
  username   TEXT,
  ip         TEXT,
  user_agent TEXT,
  meta       JSONB,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_clients_status     ON visitapro_clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_user_id    ON visitapro_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_updated_at ON visitapro_clients(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_km_user_id    ON visitapro_km(user_id);
CREATE INDEX IF NOT EXISTS idx_km_data       ON visitapro_km(data DESC);
CREATE INDEX IF NOT EXISTS idx_km_updated_at ON visitapro_km(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_rate_key_time ON visitapro_rate_limits(key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_action     ON visitapro_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_username   ON visitapro_audit_log(username);
CREATE INDEX IF NOT EXISTS idx_audit_ip         ON visitapro_audit_log(ip);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON visitapro_audit_log(created_at DESC);

-- ============================================================
-- FUNÇÕES
-- ============================================================

-- ── Trigger: atualiza updated_at automaticamente ─────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_clients_updated_at ON visitapro_clients;
CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON visitapro_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_km_updated_at ON visitapro_km;
CREATE TRIGGER set_km_updated_at
  BEFORE UPDATE ON visitapro_km
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Verificar senha (bcrypt legado + sha256 de bootstrap) ────
-- Chamada pelo backend via service_role — nunca diretamente pelo browser.
CREATE OR REPLACE FUNCTION visitapro_verify_pass(
  p_username TEXT,
  p_password TEXT
)
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
  SELECT pass_hash,
         COALESCE(hash_algo, 'bcrypt'),
         locked_until
    INTO v_hash, v_algo, v_locked
    FROM visitapro_users
   WHERE username = p_username
     AND active   = TRUE;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Bloquear conta por tentativas excessivas
  IF v_locked IS NOT NULL AND v_locked > NOW() THEN
    RETURN FALSE;
  END IF;

  -- Verificar senha
  IF v_algo = 'bcrypt' THEN
    v_result := (crypt(p_password, v_hash) = v_hash);
  ELSE
    -- SHA-256 legado (hex)
    v_result := (v_hash = encode(digest(p_password, 'sha256'), 'hex'));
  END IF;

  -- Atualizar contagem de falhas
  IF v_result THEN
    UPDATE visitapro_users
       SET failed_logins = 0,
           locked_until  = NULL,
           last_login    = NOW()
     WHERE username = p_username;
  ELSE
    UPDATE visitapro_users
       SET failed_logins = COALESCE(failed_logins, 0) + 1,
           locked_until  = CASE
             WHEN COALESCE(failed_logins, 0) + 1 >= 5
             THEN NOW() + INTERVAL '15 minutes'
             ELSE locked_until
           END
     WHERE username = p_username;
  END IF;

  RETURN v_result;
END;
$$;

-- ── Criar / atualizar usuário com bcrypt ─────────────────────
CREATE OR REPLACE FUNCTION visitapro_upsert_user(
  p_username TEXT,
  p_password TEXT,
  p_role     TEXT DEFAULT 'user'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_id TEXT;
BEGIN
  INSERT INTO visitapro_users (id, username, pass_hash, hash_algo, role, active)
  VALUES (
    gen_random_uuid()::TEXT,
    p_username,
    crypt(p_password, gen_salt('bf', 12)),
    'bcrypt',
    p_role,
    TRUE
  )
  ON CONFLICT (username) DO UPDATE
    SET pass_hash     = crypt(p_password, gen_salt('bf', 12)),
        hash_algo     = 'bcrypt',
        failed_logins = 0,
        locked_until  = NULL
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Clientes: RLS ativo, acesso controlado por user_id
ALTER TABLE visitapro_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_own_or_admin" ON visitapro_clients;
CREATE POLICY "clients_own_or_admin" ON visitapro_clients
  FOR ALL
  USING (
    user_id IS NULL
    OR user_id = current_setting('request.jwt.claims', TRUE)::jsonb->>'sub'
    OR EXISTS (
      SELECT 1 FROM visitapro_users
       WHERE id   = (current_setting('request.jwt.claims', TRUE)::jsonb->>'sub')
         AND role = 'admin'
         AND active = TRUE
    )
  )
  WITH CHECK (
    user_id = current_setting('request.jwt.claims', TRUE)::jsonb->>'sub'
  );

-- KM: apenas owner e admin
ALTER TABLE visitapro_km ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "km_own_or_admin" ON visitapro_km;
CREATE POLICY "km_own_or_admin" ON visitapro_km
  FOR ALL
  USING (
    user_id = current_setting('request.jwt.claims', TRUE)::jsonb->>'sub'
    OR EXISTS (
      SELECT 1 FROM visitapro_users
       WHERE id   = (current_setting('request.jwt.claims', TRUE)::jsonb->>'sub')
         AND role = 'admin'
         AND active = TRUE
    )
  );

-- Usuários: sem acesso público direto (apenas via funções SECURITY DEFINER)
ALTER TABLE visitapro_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_users" ON visitapro_users;
CREATE POLICY "no_public_users" ON visitapro_users
  FOR ALL USING (false);

-- Rate limits: sem acesso público (service_role bypassa RLS)
ALTER TABLE visitapro_rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_rate_limits" ON visitapro_rate_limits;
CREATE POLICY "no_public_rate_limits" ON visitapro_rate_limits
  FOR ALL USING (false);

-- Audit log: sem acesso público (service_role bypassa RLS)
ALTER TABLE visitapro_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_audit" ON visitapro_audit_log;
CREATE POLICY "no_public_audit" ON visitapro_audit_log
  FOR ALL USING (false);

-- ============================================================
-- GRANTS
-- ============================================================

-- Funções acessíveis pela anon key (chamadas pelo backend via service_role)
GRANT EXECUTE ON FUNCTION visitapro_verify_pass TO anon, authenticated;
GRANT EXECUTE ON FUNCTION visitapro_upsert_user TO authenticated;

-- Revoga acesso direto à tabela de usuários para anon
REVOKE ALL ON visitapro_users FROM anon;

-- ============================================================
-- VIEWS DE AUDITORIA
-- ============================================================

CREATE OR REPLACE VIEW visitapro_logins_recentes AS
SELECT username, ip, action, meta, created_at
FROM visitapro_audit_log
WHERE action IN ('login_ok','login_fail')
ORDER BY created_at DESC
LIMIT 200;

CREATE OR REPLACE VIEW visitapro_ips_suspeitos AS
SELECT
  ip,
  COUNT(*) FILTER (WHERE action = 'login_fail') AS falhas,
  COUNT(*) FILTER (WHERE action = 'login_ok')   AS sucessos,
  MAX(created_at)                                AS ultima_tentativa
FROM visitapro_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND ip IS NOT NULL
GROUP BY ip
HAVING COUNT(*) FILTER (WHERE action = 'login_fail') >= 3
ORDER BY falhas DESC;

CREATE OR REPLACE VIEW visitapro_km_mensal AS
SELECT
  user_id,
  TO_CHAR(data, 'YYYY-MM')            AS mes,
  COUNT(*)                             AS total_registros,
  SUM(percorrido)                      AS total_km,
  SUM(combustivel)                     AS total_combustivel,
  ROUND(AVG(custo_por_km)::numeric, 2) AS media_custo_km
FROM visitapro_km
GROUP BY user_id, TO_CHAR(data, 'YYYY-MM')
ORDER BY mes DESC;

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Cria o usuário admin com bcrypt (custo 12)
-- Senha: J12u08m19t79@
SELECT visitapro_upsert_user('admin', 'J12u08m19t79@', 'admin');

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
DO $$
DECLARE
  v_tables  TEXT[] := ARRAY[
    'visitapro_users','visitapro_clients','visitapro_km',
    'visitapro_rate_limits','visitapro_audit_log'
  ];
  v_table   TEXT;
  v_exists  BOOLEAN;
  v_errors  INT := 0;
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
  IF EXISTS (SELECT 1 FROM visitapro_users WHERE username = 'admin' AND active = TRUE) THEN
    RAISE NOTICE '✅ Usuário admin criado com sucesso';
  ELSE
    RAISE WARNING '❌ Usuário admin NÃO foi criado';
    v_errors := v_errors + 1;
  END IF;

  IF v_errors = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Schema criado com sucesso! VisitaPRO v3.2 pronto.';
    RAISE NOTICE '   Login: admin / J12u08m19t79@';
  ELSE
    RAISE EXCEPTION '% erro(s) encontrado(s). Verifique os warnings acima.', v_errors;
  END IF;
END $$;
