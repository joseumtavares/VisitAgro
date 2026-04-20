/**
 * repCommissionHelper.ts — Lote L034
 *
 * REGRA DE NEGÓCIO (fonte: visitas/public/index.html — _buildCommissions v10)
 * ───────────────────────────────────────────────────────────────────────────
 * 1. Comissão de representante é POR ITEM DO PEDIDO (order_item_id como chave).
 * 2. Percentual vem do SNAPSHOT do item (rep_commission_pct persistido em
 *    order_items), nunca do produto ao vivo.
 * 3. Itens com pct <= 0 ou amount <= 0 são ignorados.
 * 4. Comissões com status 'paga' são IMUTÁVEIS — nunca removidas.
 * 5. Comissões 'pendente' do mesmo orderId são substituídas no reprocessamento.
 * 6. Idempotência de criação: verifica existência por order_item_id + workspace
 *    antes de inserir.
 *
 * FUNÇÕES EXPORTADAS
 * ──────────────────
 * generateRepCommissions  → chamada ao criar/pagar pedido (POST/PUT /orders)
 * reprocessRepCommissions → chamada pelo /api/admin/reprocess
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Tipos internos ──────────────────────────────────────────────────────────

interface OrderMeta {
  id: string;
  user_id?: string | null;
  workspace: string;
  client_id?: string | null;
  date?: string | null;
  total?: number | null;
}

interface ItemSnapshot {
  id: string;
  product_id?: string | null;
  product_name?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  total?: number | null;
  rep_commission_pct?: number | null;
}

export interface RepCommissionResult {
  created: number;
  skipped: number;
  errors: string[];
}

// ─── generateRepCommissions ──────────────────────────────────────────────────
/**
 * Gera comissões de representante para todos os itens elegíveis de um pedido.
 * Seguro para chamada em POST (pedido criado já pago) e PUT (transição para pago).
 *
 * Idempotente: ignora itens que já possuem comissão registrada (qualquer status).
 * Não sobrescreve comissões pagas.
 */
export async function generateRepCommissions(
  admin: SupabaseClient,
  order: OrderMeta,
  items: ItemSnapshot[]
): Promise<RepCommissionResult> {
  const errors: string[] = [];

  // Guarda 1: representante obrigatório
  if (!order.user_id) {
    await _audit(admin, '[REP_COMM] Ignorado: user_id nulo', {
      order_id:  order.id,
      workspace: order.workspace,
    });
    return { created: 0, skipped: 0, errors: ['user_id nulo'] };
  }

  // Guarda 2: filtrar itens elegíveis usando SNAPSHOT do item
  const eligible = items.filter(
    (item) => Number(item.rep_commission_pct ?? 0) > 0
  );

  if (eligible.length === 0) {
    await _audit(admin, '[REP_COMM] Ignorado: nenhum item elegível', {
      order_id:    order.id,
      workspace:   order.workspace,
      items_total: items.length,
    });
    return { created: 0, skipped: 0, errors: [] };
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

  for (const item of eligible) {
    // ── Idempotência por order_item_id ─────────────────────────────────────
    const { count, error: countErr } = await admin
      .from('rep_commissions')
      .select('*', { count: 'exact', head: true })
      .eq('order_item_id', item.id)
      .eq('workspace', order.workspace);

    if (countErr) {
      errors.push(`idempotencia_check[${item.id}]: ${countErr.message}`);
      skipped++;
      continue;
    }

    if ((count ?? 0) > 0) {
      skipped++;
      continue;
    }

    // ── Calcular usando snapshot do item ────────────────────────────────────
    const qty        = Number(item.quantity   ?? 1);
    const unitPrice  = Number(item.unit_price ?? 0);
    const itemTotal  = Number(item.total ?? 0) || qty * unitPrice;
    const pct        = Number(item.rep_commission_pct ?? 0);
    const amount     = Math.round(itemTotal * (pct / 100) * 100) / 100;

    if (amount <= 0) {
      skipped++;
      continue;
    }

    const now = new Date().toISOString();

    const { error: insertErr } = await admin
      .from('rep_commissions')
      .insert([{
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
        qty,
        unit_price:         unitPrice,
        rep_commission_pct: pct,
        amount,
        order_total:        Number(order.total ?? 0),
        status:             'pendente',
        receipt_photo_ids:  [],
        reprocessed_at:     null,
        created_at:         now,
        updated_at:         now,
      }]);

    if (insertErr) {
      errors.push(`insert[${item.id}]: ${insertErr.message}`);
      skipped++;
      continue;
    }

    created++;
  }

  await _audit(admin, '[REP_COMM] Geração concluída', {
    order_id:  order.id,
    rep_id:    order.user_id,
    workspace: order.workspace,
    created,
    skipped,
    ...(errors.length ? { errors } : {}),
  });

  return { created, skipped, errors };
}

// ─── reprocessRepCommissions ─────────────────────────────────────────────────
/**
 * Reprocessa comissões de representante para todos os pedidos pagos do workspace.
 *
 * REGRA (fonte: visitas _buildCommissions + reprocessCommissions v10):
 * ─ Preserva comissões com status 'paga' (imutáveis).
 * ─ Remove comissões 'pendente' do pedido que estejam divergentes.
 * ─ Gera novas comissões para itens sem cobertura ou com valores divergentes.
 * ─ Detecta divergência por: qty, unit_price, rep_commission_pct.
 * ─ Não toca em pedidos sem user_id.
 * ─ Registra reprocessed_at nas comissões criadas por esta função.
 */
export async function reprocessRepCommissions(
  admin: SupabaseClient,
  workspace: string,
  userId?: string
): Promise<{ ordersChecked: number; ordersChanged: number; created: number; errors: string[] }> {
  const errors: string[] = [];
  let ordersChecked = 0;
  let ordersChanged = 0;
  let totalCreated  = 0;

  // Buscar todos os pedidos pagos com user_id definido
  const { data: orders, error: ordersErr } = await admin
    .from('orders')
    .select('id,user_id,client_id,date,total,workspace')
    .eq('workspace', workspace)
    .eq('status', 'pago')
    .is('deleted_at', null)
    .not('user_id', 'is', null);

  if (ordersErr) {
    return { ordersChecked: 0, ordersChanged: 0, created: 0, errors: [ordersErr.message] };
  }

  for (const order of orders ?? []) {
    ordersChecked++;

    // Buscar itens do pedido (snapshot)
    const { data: items, error: itemsErr } = await admin
      .from('order_items')
      .select('id,product_id,product_name,quantity,unit_price,total,rep_commission_pct')
      .eq('order_id', order.id);

    if (itemsErr) {
      errors.push(`order_items[${order.id}]: ${itemsErr.message}`);
      continue;
    }

    const eligibleItems = (items ?? []).filter(
      (item) => Number(item.rep_commission_pct ?? 0) > 0
    );

    // Buscar comissões existentes do pedido
    const { data: existingComms } = await admin
      .from('rep_commissions')
      .select('id,order_item_id,qty,unit_price,rep_commission_pct,status')
      .eq('order_id', order.id)
      .eq('workspace', workspace);

    const paidComms    = (existingComms ?? []).filter((c) => c.status === 'paga');
    const pendingComms = (existingComms ?? []).filter((c) => c.status === 'pendente');
    const paidItemIds  = new Set(paidComms.map((c) => c.order_item_id).filter(Boolean));

    // ── Detectar necessidade de reprocessamento ─────────────────────────────
    // (mesma lógica de visitas/reprocessCommissions v10)
    const unpaidEligible = eligibleItems.filter(
      (item) => !paidItemIds.has(item.id)
    );

    let needsUpdate = unpaidEligible.length !== pendingComms.length;

    if (!needsUpdate) {
      for (const item of unpaidEligible) {
        const existing = pendingComms.find((c) => c.order_item_id === item.id);
        if (!existing) { needsUpdate = true; break; }

        const pct = Number(item.rep_commission_pct ?? 0);
        const qty = Number(item.quantity ?? 1);
        const unitPrice = Number(item.unit_price ?? 0);

        if (
          Number(existing.qty)                !== qty       ||
          Number(existing.unit_price)          !== unitPrice ||
          Number(existing.rep_commission_pct)  !== pct
        ) {
          needsUpdate = true;
          break;
        }
      }
    }

    if (!needsUpdate) continue;

    ordersChanged++;

    // ── Remover apenas as pendentes (pagas são preservadas) ─────────────────
    if (pendingComms.length > 0) {
      const pendingIds = pendingComms.map((c) => c.id);
      const { error: delErr } = await admin
        .from('rep_commissions')
        .delete()
        .in('id', pendingIds);

      if (delErr) {
        errors.push(`delete_pending[${order.id}]: ${delErr.message}`);
        continue;
      }
    }

    // ── Resolver rep e client uma vez ────────────────────────────────────────
    const { data: repUser } = await admin
      .from('users')
      .select('id,name,username')
      .eq('id', order.user_id)
      .maybeSingle();
    const repName = repUser?.name || repUser?.username || '';

    const { data: clientRow } = order.client_id
      ? await admin.from('clients').select('name').eq('id', order.client_id).maybeSingle()
      : { data: null };
    const clientName = clientRow?.name ?? '';

    // ── Recriar comissões para itens não pagos ───────────────────────────────
    const now = new Date().toISOString();

    for (const item of unpaidEligible) {
      const qty       = Number(item.quantity   ?? 1);
      const unitPrice = Number(item.unit_price ?? 0);
      const itemTotal = Number(item.total ?? 0) || qty * unitPrice;
      const pct       = Number(item.rep_commission_pct ?? 0);
      const amount    = Math.round(itemTotal * (pct / 100) * 100) / 100;

      if (amount <= 0) continue;

      const { error: insertErr } = await admin
        .from('rep_commissions')
        .insert([{
          id:                 crypto.randomUUID(),
          workspace,
          rep_id:             order.user_id,
          rep_name:           repName,
          order_id:           order.id,
          order_item_id:      item.id,
          order_date:         order.date ?? null,
          client_id:          order.client_id ?? null,
          client_name:        clientName,
          product_id:         item.product_id ?? null,
          product_name:       item.product_name ?? null,
          qty,
          unit_price:         unitPrice,
          rep_commission_pct: pct,
          amount,
          order_total:        Number(order.total ?? 0),
          status:             'pendente',
          receipt_photo_ids:  [],
          reprocessed_at:     now,     // marca que foi criado via reprocessamento
          created_at:         now,
          updated_at:         now,
        }]);

      if (insertErr) {
        errors.push(`reprocess_insert[${item.id}]: ${insertErr.message}`);
        continue;
      }

      totalCreated++;
    }
  }

  await _audit(admin, '[REP_COMM] Reprocessamento concluído', {
    workspace,
    triggered_by: userId ?? null,
    orders_checked:  ordersChecked,
    orders_changed:  ordersChanged,
    total_created:   totalCreated,
    ...(errors.length ? { errors } : {}),
  });

  return {
    ordersChecked,
    ordersChanged,
    created: totalCreated,
    errors,
  };
}

// ─── Audit interno ────────────────────────────────────────────────────────────
async function _audit(
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
    // audit nunca quebra o fluxo principal
  }
}
