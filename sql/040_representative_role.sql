-- ============================================================
-- VisitAgro — Migration 040: Suporte ao role 'representative'
-- Aplicar no Supabase SQL Editor ANTES do deploy
-- Seguro para reaplicação (IF EXISTS check antes de adicionar)
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. Ampliar CHECK constraint de users.role
--    Adiciona 'representative' sem perder os valores existentes
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role = ANY (ARRAY[
    'admin'::text,
    'user'::text,
    'manager'::text,
    'representative'::text
  ]));

-- ────────────────────────────────────────────────────────────
-- 2. Índice para busca rápida de representantes por workspace
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_role_workspace
  ON public.users(workspace, role)
  WHERE role = 'representative';

-- ────────────────────────────────────────────────────────────
-- 3. Índice em rep_regions (caso ainda não exista)
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_rep_regions_workspace_rep
  ON public.rep_regions(workspace, rep_id);

CREATE INDEX IF NOT EXISTS idx_rep_regions_rep_id
  ON public.rep_regions(rep_id);

COMMIT;

-- ────────────────────────────────────────────────────────────
-- Validação pós-aplicação:
--
-- SELECT constraint_name, check_clause
--   FROM information_schema.check_constraints
--  WHERE constraint_name = 'users_role_check';
--
-- INSERT INTO users (username, pass_hash, hash_algo, role, workspace)
-- VALUES ('test_rep', 'x', 'bcrypt', 'representative', 'principal')
-- ON CONFLICT DO NOTHING;
-- ────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────
-- Rollback (executar manualmente se necessário):
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
-- ALTER TABLE public.users ADD CONSTRAINT users_role_check
--   CHECK (role = ANY (ARRAY['admin','user','manager']));
-- DROP INDEX IF EXISTS idx_users_role_workspace;
-- ────────────────────────────────────────────────────────────
