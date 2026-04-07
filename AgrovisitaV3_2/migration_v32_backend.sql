-- ============================================================
-- VisitaPRO — Migration v3.2: Infraestrutura de Backend
-- Execute no SQL Editor do Supabase APÓS migration_v31_security.sql
-- ============================================================

-- ── TABELA: rate_limits ──────────────────────────────────────
-- Armazena tentativas de acesso para rate limiting entre
-- instâncias serverless (funciona sem Redis).
CREATE TABLE IF NOT EXISTS visitapro_rate_limits (
  id         BIGSERIAL PRIMARY KEY,
  key        TEXT        NOT NULL,  -- ex: 'ip:1.2.3.4' ou 'user:admin'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice na chave + tempo (usado pelo SELECT de contagem)
CREATE INDEX IF NOT EXISTS idx_rate_key_time
  ON visitapro_rate_limits (key, created_at DESC);

-- Limpeza automática de entradas antigas (> 10 minutos)
-- via pg_cron (habilite em Supabase → Database → Extensions → pg_cron)
-- SELECT cron.schedule('cleanup-rate-limits', '*/5 * * * *',
--   $$DELETE FROM visitapro_rate_limits WHERE created_at < NOW() - INTERVAL '10 minutes'$$);

-- ── TABELA: audit_log ────────────────────────────────────────
-- Registro imutável de eventos de segurança.
CREATE TABLE IF NOT EXISTS visitapro_audit_log (
  id         BIGSERIAL   PRIMARY KEY,
  action     TEXT        NOT NULL,   -- 'login_ok' | 'login_fail' | 'logout' | 'sync_up' | 'sync_down' | 'delete' | 'access_denied'
  user_id    TEXT,                   -- ID do usuário (se autenticado)
  username   TEXT,                   -- nome do usuário
  ip         TEXT,                   -- IP da requisição
  user_agent TEXT,                   -- User-Agent do browser/app
  meta       JSONB,                  -- dados extras (path, clientId, count, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_action     ON visitapro_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_username   ON visitapro_audit_log(username);
CREATE INDEX IF NOT EXISTS idx_audit_ip         ON visitapro_audit_log(ip);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON visitapro_audit_log(created_at DESC);

-- ── SEGURANÇA DAS NOVAS TABELAS ──────────────────────────────

-- rate_limits: apenas o serviço (service_role) pode escrever
ALTER TABLE visitapro_rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_rate_limits" ON visitapro_rate_limits;
CREATE POLICY "no_public_rate_limits" ON visitapro_rate_limits
  FOR ALL USING (false);  -- nenhum acesso público; service_role bypassa RLS

-- audit_log: apenas service_role pode inserir; nenhum acesso público
ALTER TABLE visitapro_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_audit" ON visitapro_audit_log;
CREATE POLICY "no_public_audit" ON visitapro_audit_log
  FOR ALL USING (false);

-- Admin autenticado pode consultar audit_log via API
-- (a API usa service_role, não precisa de policy — mas documentamos a intenção)

-- ── VIEW: logins recentes ────────────────────────────────────
CREATE OR REPLACE VIEW visitapro_logins_recentes AS
SELECT
  username,
  ip,
  action,
  meta,
  created_at
FROM visitapro_audit_log
WHERE action IN ('login_ok', 'login_fail')
ORDER BY created_at DESC
LIMIT 200;

-- ── VIEW: falhas suspeitas por IP (últimas 24h) ──────────────
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

-- ── COLUNA user_id EM visitapro_clients ──────────────────────
-- Garante que a coluna existe (segura se já existir)
ALTER TABLE visitapro_clients
  ADD COLUMN IF NOT EXISTS user_id TEXT;

-- ── RLS ATUALIZADO PARA CLIENTES (ownership) ─────────────────
-- Remove política aberta anterior e adiciona por usuário
DROP POLICY IF EXISTS "allow_all_clients" ON visitapro_clients;

-- Usuário vê apenas seus clientes; admin vê todos
-- (o backend usa service_role que bypassa RLS, mas esta policy
--  protege acesso direto via anon/authenticated keys)
CREATE POLICY "clients_own_or_admin" ON visitapro_clients
  FOR ALL
  USING (
    user_id IS NULL          -- registros sem owner são visíveis a todos (migração)
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

-- ============================================================
-- RESUMO DO QUE FOI CRIADO:
--   visitapro_rate_limits  — rate limiting distribuído
--   visitapro_audit_log    — auditoria de segurança
--   view logins_recentes   — últimos 200 logins
--   view ips_suspeitos     — IPs com 3+ falhas em 24h
--   RLS clients atualizado — acesso por ownership
-- ============================================================
