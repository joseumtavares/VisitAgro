-- ============================================================
-- VisitaPRO — Migration v3.1: Segurança de Autenticação
-- Execute no SQL Editor do Supabase APÓS a migration_v3_km.sql
-- ============================================================

-- ── EXTENSÃO PGCRYPTO (necessária para bcrypt) ────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── COLUNAS EXTRAS NA TABELA DE USUÁRIOS ─────────────────────
-- Adiciona suporte a bcrypt e controle de tentativas de login
ALTER TABLE visitapro_users
  ADD COLUMN IF NOT EXISTS hash_algo     TEXT    DEFAULT 'sha256'
                                         CHECK (hash_algo IN ('sha256','bcrypt')),
  ADD COLUMN IF NOT EXISTS failed_logins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until  TIMESTAMPTZ;

-- ── FUNÇÃO: verificar senha (suporta SHA-256 legado + bcrypt) ─
-- Chamada pelo front-end via Supabase RPC para validação segura
-- no servidor — a senha NUNCA transita em texto puro no banco.
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
  -- Busca usuário ativo
  SELECT pass_hash, COALESCE(hash_algo,'sha256'), locked_until
    INTO v_hash, v_algo, v_locked
    FROM visitapro_users
   WHERE username = p_username
     AND active   = TRUE;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Verifica bloqueio por tentativas excessivas
  IF v_locked IS NOT NULL AND v_locked > NOW() THEN
    RETURN FALSE;
  END IF;

  -- Verifica senha conforme algoritmo armazenado
  IF v_algo = 'bcrypt' THEN
    v_result := (crypt(p_password, v_hash) = v_hash);
  ELSE
    -- SHA-256 legado (hex string)
    v_result := (v_hash = encode(digest(p_password, 'sha256'), 'hex'));
  END IF;

  -- Registra tentativas falhas / reseta em caso de sucesso
  IF v_result THEN
    UPDATE visitapro_users
       SET failed_logins = 0, locked_until = NULL, last_login = NOW()
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

-- ── FUNÇÃO: criar/atualizar usuário com bcrypt ────────────────
-- Use esta função para criar novos usuários ou redefinir senhas.
-- Novos usuários usarão bcrypt automaticamente.
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
    crypt(p_password, gen_salt('bf', 12)),  -- bcrypt, custo 12
    'bcrypt',
    p_role,
    TRUE
  )
  ON CONFLICT (username) DO UPDATE
    SET pass_hash    = crypt(p_password, gen_salt('bf', 12)),
        hash_algo    = 'bcrypt',
        failed_logins = 0,
        locked_until  = NULL
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ── MIGRAÇÃO DE USUÁRIOS LEGADOS SHA-256 → bcrypt ─────────────
-- Não é possível converter automaticamente (hash é unidirecional).
-- Na próxima vez que um usuário legado fizer login com sucesso
-- via SHA-256, o front-end pode chamar visitapro_upsert_user
-- para atualizar o hash para bcrypt (upgrade transparente).
-- Usuários que nunca logarem permanecerão em SHA-256 até
-- redefinição de senha manual pelo admin.

-- ── GRANTS DE SEGURANÇA ───────────────────────────────────────
GRANT EXECUTE ON FUNCTION visitapro_verify_pass   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION visitapro_upsert_user   TO authenticated;

-- Revoga acesso direto à tabela de usuários para anon
-- (o acesso é feito exclusivamente pelas funções SECURITY DEFINER)
REVOKE ALL ON visitapro_users FROM anon;
GRANT SELECT (id, username, role, active, last_login) ON visitapro_users TO authenticated;

-- ── RLS: protege KM por usuário ───────────────────────────────
-- Substitui a política aberta da migration_v3_km.sql
DROP POLICY IF EXISTS "allow_all_km" ON visitapro_km;

-- Admin vê tudo; outros veem apenas seus próprios registros
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

-- ============================================================
-- NOTAS DE IMPLANTAÇÃO
-- ============================================================
-- 1. Execute este arquivo INTEIRO no SQL Editor do Supabase.
-- 2. Depois de executar, teste no console do navegador:
--      await verifySupabase('admin', 'SUA_SENHA')  → deve retornar true
-- 3. Para criar o primeiro usuário admin via bcrypt:
--      SELECT visitapro_upsert_user('admin', 'SUA_SENHA', 'admin');
-- 4. Para novos usuários de campo:
--      SELECT visitapro_upsert_user('vendedor1', 'senha123', 'user');
-- ============================================================
