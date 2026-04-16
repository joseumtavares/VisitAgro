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
 * @param order   Registro do pedido (precisa de id, user_id, workspace, client_id, date, total)
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
): Promise<{ created: number; skipped: number }> {
  if (!order.user_id) {
    return { created: 0, skipped: 0 };
  }

  const eligibleItems = items.filter(
    (item) => Number(item.rep_commission_pct ?? 0) > 0
  );

  if (eligibleItems.length === 0) {
    return { created: 0, skipped: 0 };
  }

  // Resolver nome do representante
  const { data: repUser } = await admin
    .from('users')
    .select('id,name,username')
    .eq('id', order.user_id)
    .maybeSingle();

  const repName = repUser?.name || repUser?.username || '';

  // Resolver nome do cliente
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
    // Verificar idempotência: já existe comissão para este item?
    const { count } = await admin
      .from('rep_commissions')
      .select('*', { count: 'exact', head: true })
      .eq('order_item_id', item.id)
      .eq('workspace', order.workspace);

    if (count && count > 0) {
      skipped++;
      continue;
    }

    const itemTotal = Number(item.total ?? 0) ||
      (Number(item.quantity ?? 1) * Number(item.unit_price ?? 0));

    const pct    = Number(item.rep_commission_pct ?? 0);
    const amount = Math.round(itemTotal * (pct / 100) * 100) / 100;

    if (amount <= 0) {
      skipped++;
      continue;
    }

    const now = new Date().toISOString();

    await admin.from('rep_commissions').insert([{
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
    }]);

    created++;
  }

  return { created, skipped };
}
