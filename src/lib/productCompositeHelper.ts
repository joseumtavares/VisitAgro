// src/lib/productCompositeHelper.ts  (PATCH V2)
// Helpers para produto composto.
//
// DECISÃO ARQUITETURAL — Opção A (bloqueio simples):
//   Produto composto NÃO pode ter outro produto composto como componente.
//   Consequência: ciclos de composição são IMPOSSÍVEIS por construção.
//   Portanto: BFS de detecção de ciclo foi REMOVIDO.
//   Justificativa: BFS exigia múltiplas queries, era complexo de manter
//   e protegia um cenário que deixou de existir com o bloqueio de Opção A.
//   Se futuramente compostos-de-compostos forem necessários,
//   reintroduzir BFS + permissão explícita de forma controlada.
//
// TRANSAÇÃO:
//   POST e PUT de produto composto usam a RPC `upsert_composite_product`
//   que executa toda a operação atomicamente no banco.
//   Não há operações em múltiplas chamadas sem transação.

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

// ── Validação rápida no backend (antes de chamar RPC) ─────────
// Previne round-trip desnecessário para erros óbvios.

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

// ── RPC: upsert atômico via Supabase ─────────────────────────

/**
 * Cria ou atualiza um produto composto de forma atômica via RPC.
 *
 * A função `upsert_composite_product` no banco cuida de:
 *  - validar cada componente (existe, ativo, não-deletado, mesmo workspace)
 *  - bloquear composto-de-composto
 *  - calcular cost_price = Σ (qty × cost_price componente)
 *  - INSERT ou UPDATE no produto
 *  - DELETE + INSERT atômico dos componentes
 *  - tudo dentro de uma única transação PL/pgSQL
 *
 * @param admin        - cliente supabase service_role
 * @param productId    - null para INSERT, uuid para UPDATE
 * @param workspace    - workspace do usuário
 * @param productData  - campos do produto (sem id, workspace, is_composite, cost_price)
 * @param components   - lista de {component_product_id, quantity}
 */
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

  // RPC retorna jsonb — verificar se veio erro de negócio
  const result = data as UpsertCompositeResult | UpsertCompositeError;

  if ('error' in result && result.error) {
    return { data: null, error: result.error };
  }

  return { data: result as UpsertCompositeResult, error: null };
}

// ── Buscar componentes de um produto composto ─────────────────

export interface ComponentRow {
  id:                   string;
  composite_product_id: string;
  component_product_id: string;
  quantity:             number;
  created_at:           string;
  component: {
    id:                string;
    name:              string;
    unit_price:        number;
    cost_price:        number | null;
    unit:              string;
    rep_commission_pct: number | null;
    active:            boolean;
  } | null;
}

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

  return (data ?? []).map((row: any): ComponentRow => {
    const component = Array.isArray(row.component)
      ? (row.component[0] ?? null)
      : (row.component ?? null);

    return {
      id: row.id,
      composite_product_id: row.composite_product_id,
      component_product_id: row.component_product_id,
      quantity: Number(row.quantity),
      created_at: row.created_at,
      component: component
        ? {
            id: component.id,
            name: component.name,
            unit_price: Number(component.unit_price),
            cost_price: component.cost_price != null ? Number(component.cost_price) : null,
            unit: component.unit,
            rep_commission_pct: component.rep_commission_pct != null
              ? Number(component.rep_commission_pct)
              : null,
            active: Boolean(component.active),
          }
        : null,
    };
  });
}

// ── Verificar se produto é componente de algum composto ativo ─

export async function isProductUsedAsComponent(
  admin: SupabaseClient,
  productId: string,
  workspace: string
): Promise<{ used: boolean; compositeName?: string }> {
  // Busca vinculos onde o composto NÃO está deletado
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

  // Filtrar apenas vínculos cujo produto composto NÃO está deletado
  const activeLinks = data.filter((row: any) => {
    const composite = Array.isArray(row.composite) ? row.composite[0] : row.composite;
    return composite && composite.deleted_at == null;
  });

  if (activeLinks.length === 0) return { used: false };

  const composite = Array.isArray(activeLinks[0].composite)
    ? activeLinks[0].composite[0]
    : activeLinks[0].composite;

  return {
    used: true,
    compositeName: composite?.name ?? 'produto composto',
  };
}

// ── Limpar vínculos ao fazer soft-delete de produto composto ──

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
