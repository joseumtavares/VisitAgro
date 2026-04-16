-- ============================================================
-- Migration: 020_product_components.sql  (PATCH V2)
-- Versão: v0.9.5
-- Data: 2026-04-15
-- Segura para reaplicação (IF NOT EXISTS / OR REPLACE)
-- ============================================================

BEGIN;

-- ── 1. Flag is_composite na tabela products ──────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_composite boolean NOT NULL DEFAULT false;

-- ── 2. Tabela de composição ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_components (
  id                   text        NOT NULL DEFAULT (gen_random_uuid())::text,
  workspace            text        NOT NULL DEFAULT 'principal'::text,
  composite_product_id text        NOT NULL,
  component_product_id text        NOT NULL,
  quantity             numeric     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at           timestamptz          DEFAULT now(),

  CONSTRAINT product_components_pkey
    PRIMARY KEY (id),

  -- Cascade: ao deletar produto composto (hard), apaga componentes
  CONSTRAINT product_components_composite_fkey
    FOREIGN KEY (composite_product_id)
    REFERENCES public.products(id) ON DELETE CASCADE,

  -- Restrict: bloqueia hard-delete de produto que seja componente ativo
  CONSTRAINT product_components_component_fkey
    FOREIGN KEY (component_product_id)
    REFERENCES public.products(id),

  CONSTRAINT product_components_workspace_fkey
    FOREIGN KEY (workspace)
    REFERENCES public.workspaces(id),

  -- Banco: bloqueia auto-referência direta (A componente de A)
  CONSTRAINT product_components_no_self_ref
    CHECK (composite_product_id <> component_product_id),

  -- Garante unicidade de componente por composto
  CONSTRAINT product_components_unique
    UNIQUE (composite_product_id, component_product_id)
);

-- ── 3. Índices ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_product_components_composite
  ON public.product_components(composite_product_id);

CREATE INDEX IF NOT EXISTS idx_product_components_component
  ON public.product_components(component_product_id);

CREATE INDEX IF NOT EXISTS idx_product_components_workspace
  ON public.product_components(workspace, composite_product_id);

CREATE INDEX IF NOT EXISTS idx_products_is_composite
  ON public.products(workspace, is_composite)
  WHERE is_composite = true;

-- ── 4. RPC: upsert_composite_product ─────────────────────────
-- Operação atômica para criar/atualizar produto composto.
-- Resolve: transação, workspace isolation, soft-delete awareness,
--          deduplicação de componentes, validação de componentes.
--
-- Parâmetros:
--   p_product_id       text   (null = insert, uuid = update)
--   p_workspace        text
--   p_product_data     jsonb  (campos do produto, exceto id/workspace)
--   p_components       jsonb  (array de {component_product_id, quantity})
--
-- Retorna: jsonb com {product_id, cost_price, component_count, error?}
CREATE OR REPLACE FUNCTION public.upsert_composite_product(
  p_product_id   text,
  p_workspace    text,
  p_product_data jsonb,
  p_components   jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id        text;
  v_cost_price        numeric  := 0;
  v_component_count   integer  := 0;
  v_comp              jsonb;
  v_comp_id           text;
  v_comp_qty          numeric;
  v_comp_cost         numeric;
  v_comp_active       boolean;
  v_comp_is_composite boolean;
  v_comp_deleted      timestamptz;
  v_seen_ids          text[]   := ARRAY[]::text[];
  v_now               timestamptz := now();
  v_insert_rows       jsonb[]  := ARRAY[]::jsonb[];
BEGIN
  -- ── Validar componentes ──────────────────────────────────
  IF jsonb_array_length(p_components) = 0 THEN
    RETURN jsonb_build_object('error', 'Produto composto deve ter ao menos um componente.');
  END IF;

  FOR v_comp IN SELECT * FROM jsonb_array_elements(p_components)
  LOOP
    v_comp_id  := v_comp->>'component_product_id';
    v_comp_qty := (v_comp->>'quantity')::numeric;

    -- Quantidade válida
    IF v_comp_qty IS NULL OR v_comp_qty <= 0 THEN
      RETURN jsonb_build_object('error', 'Quantidade inválida para componente ' || COALESCE(v_comp_id, '?'));
    END IF;

    -- Sem ID
    IF v_comp_id IS NULL OR v_comp_id = '' THEN
      RETURN jsonb_build_object('error', 'ID de componente inválido.');
    END IF;

    -- Duplicata
    IF v_comp_id = ANY(v_seen_ids) THEN
      RETURN jsonb_build_object('error', 'Componente duplicado: ' || v_comp_id);
    END IF;
    v_seen_ids := array_append(v_seen_ids, v_comp_id);

    -- Buscar produto componente
    SELECT cost_price, active, is_composite, deleted_at
      INTO v_comp_cost, v_comp_active, v_comp_is_composite, v_comp_deleted
      FROM public.products
     WHERE id = v_comp_id AND workspace = p_workspace;

    -- Não encontrado
    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Componente não encontrado no workspace: ' || v_comp_id);
    END IF;

    -- Soft-deleted
    IF v_comp_deleted IS NOT NULL THEN
      RETURN jsonb_build_object('error', 'Componente está removido do sistema: ' || v_comp_id);
    END IF;

    -- Inativo
    IF NOT v_comp_active THEN
      RETURN jsonb_build_object('error', 'Componente está inativo: ' || v_comp_id);
    END IF;

    -- Composto de composto — BLOQUEADO (Opção A)
    -- Decisão: manter bloqueio simples. BFS desnecessário pois
    -- componentes não podem ser compostos — ciclos são impossíveis.
    IF v_comp_is_composite THEN
      RETURN jsonb_build_object('error', 'Componente não pode ser um produto composto: ' || v_comp_id);
    END IF;

    -- Acumular custo
    v_cost_price := v_cost_price + (v_comp_qty * COALESCE(v_comp_cost, 0));
    v_component_count := v_component_count + 1;

    v_insert_rows := array_append(v_insert_rows, jsonb_build_object(
      'component_product_id', v_comp_id,
      'quantity', v_comp_qty
    ));
  END LOOP;

  -- ── INSERT ou UPDATE do produto ───────────────────────────
  IF p_product_id IS NULL OR p_product_id = '' THEN
    -- INSERT
    v_product_id := gen_random_uuid()::text;
    INSERT INTO public.products (
      id, workspace,
      category_id, name, description, sku,
      finame_code, ncm_code,
      unit_price, cost_price, stock_qty, unit,
      rep_commission_pct, active, model, color,
      is_composite, created_at, updated_at
    ) VALUES (
      v_product_id, p_workspace,
      NULLIF(p_product_data->>'category_id', ''),
      p_product_data->>'name',
      NULLIF(p_product_data->>'description', ''),
      NULLIF(p_product_data->>'sku', ''),
      COALESCE(p_product_data->>'finame_code', ''),
      COALESCE(p_product_data->>'ncm_code', ''),
      COALESCE((p_product_data->>'unit_price')::numeric, 0),
      v_cost_price,
      COALESCE((p_product_data->>'stock_qty')::numeric, 0),
      COALESCE(p_product_data->>'unit', 'UN'),
      COALESCE((p_product_data->>'rep_commission_pct')::numeric, 0),
      COALESCE((p_product_data->>'active')::boolean, true),
      NULLIF(p_product_data->>'model', ''),
      NULLIF(p_product_data->>'color', ''),
      true,
      v_now, v_now
    );
  ELSE
    -- UPDATE — verificar que existe e pertence ao workspace
    v_product_id := p_product_id;
    UPDATE public.products SET
      category_id        = NULLIF(p_product_data->>'category_id', ''),
      name               = p_product_data->>'name',
      description        = NULLIF(p_product_data->>'description', ''),
      sku                = NULLIF(p_product_data->>'sku', ''),
      finame_code        = COALESCE(p_product_data->>'finame_code', ''),
      ncm_code           = COALESCE(p_product_data->>'ncm_code', ''),
      unit_price         = COALESCE((p_product_data->>'unit_price')::numeric, 0),
      cost_price         = v_cost_price,
      stock_qty          = COALESCE((p_product_data->>'stock_qty')::numeric, 0),
      unit               = COALESCE(p_product_data->>'unit', 'UN'),
      rep_commission_pct = COALESCE((p_product_data->>'rep_commission_pct')::numeric, 0),
      active             = COALESCE((p_product_data->>'active')::boolean, true),
      model              = NULLIF(p_product_data->>'model', ''),
      color              = NULLIF(p_product_data->>'color', ''),
      is_composite       = true,
      updated_at         = v_now
    WHERE id = v_product_id
      AND workspace = p_workspace
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Produto não encontrado ou já removido.');
    END IF;
  END IF;

  -- ── Substituição atômica de componentes ──────────────────
  DELETE FROM public.product_components
   WHERE composite_product_id = v_product_id
     AND workspace = p_workspace;

  FOR v_comp IN SELECT * FROM unnest(v_insert_rows)
  LOOP
    INSERT INTO public.product_components (
      id, workspace, composite_product_id,
      component_product_id, quantity, created_at
    ) VALUES (
      gen_random_uuid()::text,
      p_workspace,
      v_product_id,
      v_comp->>'component_product_id',
      (v_comp->>'quantity')::numeric,
      v_now
    );
  END LOOP;

  RETURN jsonb_build_object(
    'product_id',      v_product_id,
    'cost_price',      v_cost_price,
    'component_count', v_component_count
  );

EXCEPTION WHEN OTHERS THEN
  -- Qualquer erro aborta a transação inteira
  RETURN jsonb_build_object('error', 'Erro interno: ' || SQLERRM);
END;
$$;

COMMIT;

-- ============================================================
-- Validação após aplicar:
--
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'products' AND column_name = 'is_composite';
--
-- SELECT routine_name FROM information_schema.routines
--   WHERE routine_name = 'upsert_composite_product';
--
-- SELECT * FROM product_components LIMIT 1;
-- ============================================================
