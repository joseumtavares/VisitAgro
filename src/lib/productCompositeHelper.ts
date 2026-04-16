// src/lib/productCompositeHelper.ts  (PATCH V2 — fix build)
// Helpers para produto composto.
//
// DECISÃO ARQUITETURAL — Opção A (bloqueio simples):
//   Produto composto NÃO pode ter outro produto composto como componente.
//   Ciclos são impossíveis por construção. BFS removido.
//
// NOTA DE TIPAGEM:
//   O cliente Supabase retorna joins como array mesmo em relações 1-1.
//   Ex: component: [{...}] em vez de component: {...}
//   Normalizamos para objeto único nas funções abaixo.
//   Cast direto para ComponentRow[] causaria erro de build —
//   por isso usamos `as unknown[]` e mapeamos manualmente.

import type { SupabaseClient } from '@supabase/supabase-js';

// ── Tipos ─────────────────────────────────────────────────────

export interface ComponentInput {
  component_product_id: string;
  quantity: number;
}

export interface UpsertCompositeResult {
  product_id:      string;
  cost_price:      number;
  component_count: number;
}

export interface UpsertCompositeError {
  error: string;
}

export interface ComponentRow {
  id:                   string;
  composite_product_id: string;
  component_product_id: string;
  quantity:             number;
  created_at:           string;
  component: {
    id:                 string;
    name:               string;
    unit_price:         number;
    cost_price:         number | null;
    unit:               string;
    rep_commission_pct: number | null;
    active:             boolean;
  } | null;
}

// ── Validação rápida antes de chamar a RPC ────────────────────

export interface QuickValidationResult {
  valid: boolean;
  error?: string;
}

export function validateComponentsQuick(
  components: ComponentInput[]
): QuickValidationResult {
  if (!components || components.length === 0) {
    return { valid: false, error: 'Produto composto deve ter ao menos um componente.' };
  }

  const seen = new Set<string>();

  for (const c of components) {
    if (!c.component_product_id || c.component_product_id.trim() === '') {
      return { valid: false, error: 'Todos os componentes devem ter um produto selecionado.' };
    }
    if (!c.quantity || Number(c.quantity) <= 0) {
      return { valid: false, error: 'Todos os componentes devem ter quantidade maior que zero.' };
    }
    if (seen.has(c.component_product_id)) {
      return { valid: false, error: `Componente duplicado na lista: ${c.component_product_id}` };
    }
    seen.add(c.component_product_id);
  }

  return { valid: true };
}

// ── RPC: upsert atômico ───────────────────────────────────────

export async function upsertCompositeProduct(
  admin: SupabaseClient,
  productId: string | null,
  workspace: string,
  productData: Record<string, unknown>,
  components: ComponentInput[]
): Promise<{ data: UpsertCompositeResult | null; error: string | null }> {
  const { data, error } = await admin.rpc('upsert_composite_product', {
    p_product_id:   productId ?? '',
    p_workspace:    workspace,
    p_product_data: productData,
    p_components:   components,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  // RPC retorna jsonb — checar se veio campo error de negócio
  const result = data as Record<string, unknown>;
  if (result && typeof result.error === 'string' && result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      product_id:      result.product_id as string,
      cost_price:      result.cost_price as number,
      component_count: result.component_count as number,
    },
    error: null,
  };
}

// ── Buscar componentes de um produto composto ─────────────────

export async function fetchProductComponents(
  admin: SupabaseClient,
  compositeProductId: string,
  workspace: string
): Promise<ComponentRow[]> {
  const { data, error } = await admin
    .from('product_components')
    .select(`
      id,
      composite_product_id,
      component_product_id,
      quantity,
      created_at,
      component:products!product_components_component_product_id_fkey(
        id, name, unit_price, cost_price, unit, rep_commission_pct, active
      )
    `)
    .eq('composite_product_id', compositeProductId)
    .eq('workspace', workspace);

  if (error) {
    console.error('[productCompositeHelper] fetchProductComponents:', error.message);
    return [];
  }

  if (!data) return [];

  // Cast via unknown para evitar conflito entre tipo inferido pelo Supabase
  // (component como array) e o tipo declarado (component como objeto único).
  return (data as unknown[]).map((raw) => {
    const row = raw as {
      id: string;
      composite_product_id: string;
      component_product_id: string;
      quantity: number;
      created_at: string;
      component: unknown;
    };

    // Supabase retorna join 1-1 como array — pegar primeiro elemento
    const compRaw = row.component;
    const component = Array.isArray(compRaw)
      ? (compRaw[0] as ComponentRow['component'] ?? null)
      : (compRaw as ComponentRow['component'] ?? null);

    return {
      id:                   row.id,
      composite_product_id: row.composite_product_id,
      component_product_id: row.component_product_id,
      quantity:             row.quantity,
      created_at:           row.created_at,
      component,
    } satisfies ComponentRow;
  });
}

// ── Verificar se produto é componente de algum composto ativo ─

export async function isProductUsedAsComponent(
  admin: SupabaseClient,
  productId: string,
  workspace: string
): Promise<{ used: boolean; compositeName?: string }> {
  const { data, error } = await admin
    .from('product_components')
    .select(`
      composite_product_id,
      composite:products!product_components_composite_product_id_fkey(
        name, deleted_at
      )
    `)
    .eq('component_product_id', productId)
    .eq('workspace', workspace)
    .limit(5);

  if (error || !data) return { used: false };

  // Filtrar vínculos cujo composto pai NÃO está deletado
  const activeLinks = (data as unknown[]).filter((raw) => {
    const row = raw as { composite: unknown };
    const comp = Array.isArray(row.composite) ? row.composite[0] : row.composite;
    return comp != null && (comp as { deleted_at: unknown }).deleted_at == null;
  });

  if (activeLinks.length === 0) return { used: false };

  const firstRow = activeLinks[0] as { composite: unknown };
  const firstComp = Array.isArray(firstRow.composite)
    ? firstRow.composite[0]
    : firstRow.composite;

  return {
    used: true,
    compositeName:
      (firstComp as { name?: string } | null)?.name ?? 'produto composto',
  };
}

// ── Limpar vínculos ao soft-delete de produto composto ────────

export async function clearCompositeComponents(
  admin: SupabaseClient,
  compositeProductId: string,
  workspace: string
): Promise<void> {
  await admin
    .from('product_components')
    .delete()
    .eq('composite_product_id', compositeProductId)
    .eq('workspace', workspace);
}
