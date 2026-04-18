import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Gera comissões de representante para todos os itens do pedido
 * que possuam rep_commission_pct > 0.
 *
 * - Uma linha por order_item (rastreabilidade por produto).
 * - Idempotente: ignora itens que já têm comissão gerada.
 * - O representante é identificado por orders.user_id.
 *
 * @param admin   Cliente Supabase com service_role
 * @param order   Registro do pedido
 * @param items   Itens do pedido (order_items já persistidos)
 */
export async function generateRepCommissions(
  admin: SupabaseClient,
  order: {
    id: string;
    user_id?: string | null;
    workspace: string;
    client_id?: string | null;
    date?: string | null;
    total?: number | null;
  },
  items: Array<{
    id: string;
    product_id?: string | null;
    product_name?: string | null;
    quantity?: number | null;
    unit_price?: number | null;
    total?: number | null;
    rep_commission_pct?: number | null;
  }>
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];

  // ── Guarda 1: sem representante → sem comissão ─────────────────────────
  if (!order.user_id) {
    console.warn('[repCommissionHelper] order.user_id ausente — sem comissão de representante', {
      order_id: order.id,
    });
    await _auditLog(admin, '[REP_COMM] Ignorado: order.user_id nulo', {
      order_id: order.id,
      workspace: order.workspace,
    });
    return { created: 0, skipped: 0, errors: ['user_id nulo'] };
  }

  // ── Guarda 2: filtrar itens elegíveis ─────────────────────────────────
  const eligibleItems = items.filter(
    (item) => Number(item.rep_commission_pct ?? 0) > 0
  );

  if (eligibleItems.length === 0) {
    await _auditLog(admin, '[REP_COMM] Ignorado: nenhum item com rep_commission_pct > 0', {
      order_id: order.id,
      workspace: order.workspace,
      items_count: items.length,
    });
    return { created: 0, skipped: 0, errors: [] };
  }

  // ── Resolver nome do representante (sem filtro de workspace para robustez) ──
  const { data: repUser, error: repErr } = await admin
    .from('users')
    .select('id,name,username')
    .eq('id', order.user_id)
    .maybeSingle();

  if (repErr) {
    console.error('[repCommissionHelper] Erro ao buscar usuário:', repErr.message);
  }

  const repName = repUser?.name || repUser?.username || '';

  // ── Resolver nome do cliente ──────────────────────────────────────────
  const { data: client } = order.client_id
    ? await admin
        .from('clients')
        .select('name')
        .eq('id', order.client_id)
        .maybeSingle()
    : { data: null };

  const clientName = client?.name ?? '';

  let created = 0;
  let skipped = 0;

  for (const item of eligibleItems) {
    // ── Idempotência: não duplicar comissão por item ───────────────────
    const { count, error: countErr } = await admin
      .from('rep_commissions')
      .select('*', { count: 'exact', head: true })
      .eq('order_item_id', item.id)
      .eq('workspace', order.workspace);

    if (countErr) {
      console.error('[repCommissionHelper] Erro na verificação de idempotência:', countErr.message);
      errors.push(`idempotencia_check: ${countErr.message}`);
      skipped++;
      continue;
    }

    if (count && count > 0) {
      skipped++;
      continue;
    }

    // ── Calcular valor ────────────────────────────────────────────────
    const itemTotal =
      Number(item.total ?? 0) ||
      Number(item.quantity ?? 1) * Number(item.unit_price ?? 0);

    const pct    = Number(item.rep_commission_pct ?? 0);
    const amount = Math.round(itemTotal * (pct / 100) * 100) / 100;

    if (amount <= 0) {
      skipped++;
      continue;
    }

    const now = new Date().toISOString();

    // ── Insert ────────────────────────────────────────────────────────
    const { error: insertError } = await admin.from('rep_commissions').insert([
      {
        id:                 crypto.randomUUID(),
        workspace:          order.workspace,
        rep_id:             order.user_id,
        rep_name:           repName,
        order_id:           order.id,
        order_item_id:      item.id,
        order_date:         order.date ?? null,
        client_id:          order.client_id ?? null,
        client_name:        clientName,
        product_id:         item.product_id ?? null,
        product_name:       item.product_name ?? null,
        qty:                Number(item.quantity ?? 1),
        unit_price:         Number(item.unit_price ?? 0),
        rep_commission_pct: pct,
        amount,
        order_total:        Number(order.total ?? 0),
        status:             'pendente',
        created_at:         now,
        updated_at:         now,
      },
    ]);

    if (insertError) {
      console.error('[repCommissionHelper] Erro no insert:', insertError.message, {
        order_id: order.id,
        order_item_id: item.id,
        rep_id: order.user_id,
        product_id: item.product_id,
      });
      errors.push(`insert: ${insertError.message}`);
      skipped++;
      continue;
    }

    created++;
  }

  // ── Registrar resultado no audit_log ──────────────────────────────────
  await _auditLog(admin, '[REP_COMM] Processamento concluído', {
    order_id:   order.id,
    rep_id:     order.user_id,
    workspace:  order.workspace,
    created,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });

  return { created, skipped, errors };
}

// ── Audit log interno (não quebra o fluxo principal) ─────────────────────
async function _auditLog(
  admin: SupabaseClient,
  action: string,
  meta: Record<string, unknown>
): Promise<void> {
  try {
    await admin.from('audit_log').insert([{
      action,
      meta,
      created_at: new Date().toISOString(),
    }]);
  } catch {
    // audit nunca quebra o fluxo
  }
}
