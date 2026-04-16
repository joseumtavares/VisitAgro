-- ============================================================
-- VisitAgro — Migration 030: Comissões de Representantes
-- Aplicar no Supabase SQL Editor ANTES do deploy
-- Segura para reaplicação (IF NOT EXISTS / OR REPLACE)
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Adicionar rep_id e rep_name em rep_commissions
--    Lacuna estrutural: a tabela existia mas não identificava
--    qual representante (user) recebeu a comissão.
-- ------------------------------------------------------------

ALTER TABLE public.rep_commissions
  ADD COLUMN IF NOT EXISTS rep_id   TEXT REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS rep_name TEXT;

-- ------------------------------------------------------------
-- 2. Índices
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_rep_commissions_rep_id
  ON public.rep_commissions(rep_id);

CREATE INDEX IF NOT EXISTS idx_rep_commissions_workspace_status
  ON public.rep_commissions(workspace, status);

CREATE INDEX IF NOT EXISTS idx_rep_commissions_order_id
  ON public.rep_commissions(order_id);

CREATE INDEX IF NOT EXISTS idx_rep_commissions_order_item_id
  ON public.rep_commissions(order_item_id);

-- ------------------------------------------------------------
-- 3. Função geradora: generate_rep_commissions
--    Chamada pelo backend quando pedido muda para 'pago'.
--    Cria um rep_commission por order_item com pct > 0.
--    Idempotente: ignora item que já tem registro.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_rep_commissions(
  p_order_id  TEXT,
  p_workspace TEXT
)
RETURNS TABLE(
  created_count INT,
  skipped_count INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_order          RECORD;
  v_item           RECORD;
  v_rep_name       TEXT;
  v_amount         NUMERIC;
  v_created        INT := 0;
  v_skipped        INT := 0;
BEGIN
  -- Carregar pedido
  SELECT o.id, o.user_id, o.client_id, o.date, o.total, o.workspace
  INTO   v_order
  FROM   public.orders o
  WHERE  o.id        = p_order_id
    AND  o.workspace = p_workspace
    AND  o.deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido % não encontrado no workspace %', p_order_id, p_workspace;
  END IF;

  IF v_order.user_id IS NULL THEN
    RETURN QUERY SELECT 0, 0;
    RETURN;
  END IF;

  -- Nome do representante
  SELECT COALESCE(u.name, u.username)
  INTO   v_rep_name
  FROM   public.users u
  WHERE  u.id = v_order.user_id;

  -- Iterar sobre os itens do pedido
  FOR v_item IN
    SELECT oi.id, oi.product_id, oi.product_name, oi.quantity,
           oi.unit_price, oi.total, oi.rep_commission_pct
    FROM   public.order_items oi
    WHERE  oi.order_id = p_order_id
      AND  oi.rep_commission_pct > 0
  LOOP
    -- Verificar se já existe comissão para este item
    IF EXISTS (
      SELECT 1 FROM public.rep_commissions rc
      WHERE  rc.order_item_id = v_item.id
        AND  rc.workspace     = p_workspace
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Calcular valor
    v_amount := ROUND(
      COALESCE(v_item.total, v_item.quantity * v_item.unit_price)
      * (v_item.rep_commission_pct / 100),
      2
    );

    -- Inserir comissão
    INSERT INTO public.rep_commissions (
      id,
      workspace,
      rep_id,
      rep_name,
      order_id,
      order_item_id,
      order_date,
      client_id,
      client_name,
      product_id,
      product_name,
      qty,
      unit_price,
      rep_commission_pct,
      amount,
      order_total,
      status,
      created_at,
      updated_at
    )
    SELECT
      gen_random_uuid()::TEXT,
      p_workspace,
      v_order.user_id,
      v_rep_name,
      p_order_id,
      v_item.id,
      v_order.date,
      v_order.client_id,
      (SELECT c.name FROM public.clients c WHERE c.id = v_order.client_id LIMIT 1),
      v_item.product_id,
      v_item.product_name,
      v_item.quantity,
      v_item.unit_price,
      v_item.rep_commission_pct,
      v_amount,
      v_order.total,
      'pendente',
      now(),
      now();

    v_created := v_created + 1;
  END LOOP;

  RETURN QUERY SELECT v_created, v_skipped;
END;
$$;

-- ------------------------------------------------------------
-- 4. RLS — adicionar policies para rep_id (leitura própria)
-- ------------------------------------------------------------

-- A tabela já tem RLS habilitada pela migration-base anterior.
-- Adicionamos uma policy de leitura por rep_id além da de workspace.

DROP POLICY IF EXISTS select_own_rep_commissions ON public.rep_commissions;
CREATE POLICY select_own_rep_commissions
ON public.rep_commissions
FOR SELECT
USING (
  public.is_admin()
  OR workspace = public.get_current_workspace()
  OR rep_id    = public.get_current_user_id()
);

COMMIT;

-- ------------------------------------------------------------
-- Rollback (executar manualmente se necessário):
-- DROP FUNCTION IF EXISTS public.generate_rep_commissions(text, text);
-- DROP POLICY IF EXISTS select_own_rep_commissions ON public.rep_commissions;
-- ALTER TABLE public.rep_commissions DROP COLUMN IF EXISTS rep_id;
-- ALTER TABLE public.rep_commissions DROP COLUMN IF EXISTS rep_name;
-- DROP INDEX IF EXISTS idx_rep_commissions_rep_id;
-- DROP INDEX IF EXISTS idx_rep_commissions_workspace_status;
-- ------------------------------------------------------------
