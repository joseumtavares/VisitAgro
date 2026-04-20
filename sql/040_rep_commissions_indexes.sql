-- ============================================================
-- VisitAgro — Migration 040: Índice de unicidade por order_item_id
-- Lote: L034
-- Data: 2026-04-20
-- Seguro para reaplicação (IF NOT EXISTS)
--
-- CONTEXTO
-- ─────────
-- A tabela rep_commissions já possui as colunas necessárias
-- (rep_id, rep_name, order_item_id, reprocessed_at) adicionadas
-- pela migration 030. O banco real (schema_atual_supabase.sql)
-- confirma que todas essas colunas existem.
--
-- Esta migration adiciona apenas:
-- 1. Índice UNIQUE parcial em order_item_id (apenas status != 'paga')
--    → garante no banco que nenhum item gere comissão duplicada
--      enquanto pendente.
-- 2. Índices de performance para consultas frequentes da tela
--    de comissões de representantes.
--
-- NÃO altera estrutura de tabelas existentes.
-- NÃO remove dados.
-- ============================================================

BEGIN;

-- ── 1. Índice UNIQUE parcial: evita duplicidade de pendentes por item ─────────
-- Permite múltiplas linhas 'paga' para o mesmo item (histórico),
-- mas impede mais de uma linha 'pendente' por order_item_id + workspace.
CREATE UNIQUE INDEX IF NOT EXISTS uq_rep_commissions_pending_item
  ON public.rep_commissions (workspace, order_item_id)
  WHERE status = 'pendente' AND order_item_id IS NOT NULL;

-- ── 2. Índice para listagem por representante (tela rep-commissions) ──────────
CREATE INDEX IF NOT EXISTS idx_rep_commissions_rep_id_workspace
  ON public.rep_commissions (workspace, rep_id, status);

-- ── 3. Índice para reprocessamento (busca por order_id + status) ─────────────
CREATE INDEX IF NOT EXISTS idx_rep_commissions_order_status
  ON public.rep_commissions (order_id, status);

COMMIT;

-- ── Rollback manual (executar se necessário) ───────────────────────────────
-- DROP INDEX IF EXISTS public.uq_rep_commissions_pending_item;
-- DROP INDEX IF EXISTS public.idx_rep_commissions_rep_id_workspace;
-- DROP INDEX IF EXISTS public.idx_rep_commissions_order_status;

-- ── Validação pós-aplicação ────────────────────────────────────────────────
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'rep_commissions'
--   AND indexname IN (
--     'uq_rep_commissions_pending_item',
--     'idx_rep_commissions_rep_id_workspace',
--     'idx_rep_commissions_order_status'
--   );
-- Esperado: 3 linhas retornadas.
