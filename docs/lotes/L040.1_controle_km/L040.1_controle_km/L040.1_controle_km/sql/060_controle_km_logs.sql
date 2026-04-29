-- =============================================================================
-- Migration: 060_controle_km_logs
-- Lote: L040.1
-- Data: 2026-04-28
-- Objetivo: Adequar km_logs ao padrão de tenancy e integridade do VisitAgro.
--
-- CRITICAL: Todas as operações são idempotentes (IF NOT EXISTS / IF EXISTS).
--           Não reescreve a tabela — apenas adiciona colunas e constraints ausentes.
--           Se a tabela não existir, o bloco CREATE garante o estado completo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Criar tabela caso não exista (ambiente limpo / staging)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.km_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace    text        NOT NULL DEFAULT 'principal',
  user_id      uuid        NOT NULL,
  data         date        NOT NULL,
  veiculo      text        NOT NULL,
  km_ini       numeric     NOT NULL,
  km_fim       numeric     NOT NULL,
  percorrido   numeric     GENERATED ALWAYS AS (km_fim - km_ini) STORED,
  litros       numeric,
  combustivel  numeric,
  consumo      numeric,
  custo_por_km numeric,
  obs          text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

-- -----------------------------------------------------------------------------
-- 2. Adicionar colunas ausentes em banco existente (idempotente)
-- REGRA: DEFAULT temporário em workspace para idempotência.
--        Após aplicar, atualizar registros existentes com workspace correto.
-- -----------------------------------------------------------------------------
ALTER TABLE public.km_logs
  ADD COLUMN IF NOT EXISTS workspace   text        NOT NULL DEFAULT 'principal',
  ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

-- -----------------------------------------------------------------------------
-- 3. CHECK de integridade km_fim >= km_ini
-- CRITICAL: A API também valida, mas a constraint é a fonte de verdade do banco.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.km_logs'::regclass
      AND conname = 'chk_km_logs_km_fim_gte_ini'
  ) THEN
    ALTER TABLE public.km_logs
      ADD CONSTRAINT chk_km_logs_km_fim_gte_ini CHECK (km_fim >= km_ini);
  END IF;
END$$;

-- -----------------------------------------------------------------------------
-- 4. Índice de performance para listagens filtradas por workspace/user/data
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_km_logs_workspace_user_data
  ON public.km_logs (workspace, user_id, data)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 5. Índice único parcial: 1 registro ativo por workspace + user + data
-- REGRA: Soft-delete (deleted_at IS NOT NULL) não entra no índice — permite
--        recriar registro para o mesmo dia após remoção.
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_km_logs_active_daily
  ON public.km_logs (workspace, user_id, data)
  WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 6. Trigger para atualizar updated_at automaticamente
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_km_logs_updated_at ON public.km_logs;
CREATE TRIGGER trg_km_logs_updated_at
  BEFORE UPDATE ON public.km_logs
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- Validação pós-aplicação (executar manualmente no Supabase SQL Editor)
-- -----------------------------------------------------------------------------
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'km_logs'
-- ORDER BY ordinal_position;
--
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.km_logs'::regclass;
--
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'km_logs';
