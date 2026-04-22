-- ============================================================
-- VisitAgro — Migration 050: Perfil 'representative' + rep_regions
-- Lote: L036-A
-- Data: 2026-04-21
-- Seguro para reaplicação (IF NOT EXISTS / OR REPLACE / DO $$)
--
-- CONTEXTO
-- ─────────
-- O schema atual (banco real 2026-04-21) já possui:
--   - tabela rep_regions com colunas (id, workspace, rep_id,
--     state, city, created_at, updated_at)
--   - users.role CHECK ainda sem 'representative'
--
-- Esta migration:
-- 1. Adiciona 'representative' ao CHECK de users.role
-- 2. Cria índice de performance em rep_regions
--
-- NÃO cria tabelas novas.
-- NÃO remove dados.
-- ============================================================

BEGIN;

-- ── 1. Adicionar 'representative' ao CHECK constraint de users.role ──────────
-- Precisamos substituir o constraint existente.
-- O nome do constraint no banco é 'users_role_check' (padrão gerado pelo PG).
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

-- ── 2. Índices de performance em rep_regions ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rep_regions_rep_id
  ON public.rep_regions (rep_id);

CREATE INDEX IF NOT EXISTS idx_rep_regions_workspace
  ON public.rep_regions (workspace, rep_id);

COMMIT;

-- ── Rollback manual ────────────────────────────────────────────────────────
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
-- ALTER TABLE public.users ADD CONSTRAINT users_role_check
--   CHECK (role = ANY (ARRAY['admin','user','manager']));
-- DROP INDEX IF EXISTS public.idx_rep_regions_rep_id;
-- DROP INDEX IF EXISTS public.idx_rep_regions_workspace;

-- ── Validação pós-aplicação ────────────────────────────────────────────────
-- -- Deve retornar 1 linha com 'representative' no array:
-- SELECT conname, consrc FROM pg_constraint
-- WHERE conrelid = 'public.users'::regclass AND conname = 'users_role_check';
--
-- -- Deve retornar 2 linhas:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'rep_regions'
--   AND indexname IN ('idx_rep_regions_rep_id','idx_rep_regions_workspace');
