/**
 * /api/admin/reprocess — Lote L034
 *
 * ANTES: reprocessava apenas comissões de indicador (referral).
 * AGORA: reprocessa também comissões de representante via
 *        reprocessRepCommissions() do repCommissionHelper.
 *
 * Preservações garantidas:
 * - Comissões de indicador (referral): lógica anterior intacta.
 * - Comissões de representante pagas: preservadas (imutáveis).
 * - Comissões de representante pendentes divergentes: substituídas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog }         from '@/lib/supabaseAdmin';
import { generateCommission }          from '@/lib/commissionHelper';
import { reprocessRepCommissions }     from '@/lib/repCommissionHelper';

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  const admin     = getAdmin();
  const workspace = req.headers.get('x-workspace') || 'principal';
  const userId    = req.headers.get('x-user-id')   || '';

  // ── Verificação de PIN ──────────────────────────────────────────────────────
  const { data: settings } = await admin
    .from('settings')
    .select('dev_pin_hash')
    .eq('workspace', workspace)
    .maybeSingle();

  if (settings?.dev_pin_hash) {
    const crypto = await import('crypto');
    const hash   = crypto.createHash('sha256').update(pin ?? '').digest('hex');

    if (hash !== settings.dev_pin_hash) {
      return NextResponse.json({ error: 'PIN inválido' }, { status: 403 });
    }
  }

  // ── 1. Reprocessar comissões de INDICADOR (referral) — lógica original ─────
  const { data: orders, error: ordersError } = await admin
    .from('orders')
    .select('id,referral_id,commission_value,total,client_id,date,commission_type,status,workspace,deleted_at')
    .eq('workspace', workspace)
    .eq('status', 'pago')
    .is('deleted_at', null)
    .not('referral_id', 'is', null);

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  let referralCreated = 0;

  for (const order of orders ?? []) {
    if (!order.referral_id || !Number(order.commission_value)) continue;

    const { count, error: countError } = await admin
      .from('commissions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace', workspace)
      .eq('order_id', order.id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (!count || count === 0) {
      await generateCommission(admin, order, Number(order.commission_value));
      referralCreated++;
    }
  }

  // ── 2. Reprocessar comissões de REPRESENTANTE — novo ──────────────────────
  const repResult = await reprocessRepCommissions(admin, workspace, userId || undefined);

  // ── Audit consolidado ──────────────────────────────────────────────────────
  await auditLog(
    '[MANUTENÇÃO] Reprocessamento completo',
    {
      workspace,
      referral_orders_checked: orders?.length ?? 0,
      referral_commissions_created: referralCreated,
      rep_orders_checked:     repResult.ordersChecked,
      rep_orders_changed:     repResult.ordersChanged,
      rep_commissions_created: repResult.created,
      ...(repResult.errors.length ? { rep_errors: repResult.errors } : {}),
    },
    userId
  );

  return NextResponse.json({
    ok: true,
    // ─ Campos existentes (compatibilidade com frontend atual) ─
    processed: orders?.length ?? 0,
    created:   referralCreated,
    // ─ Campos novos (rep commissions) ─
    rep: {
      ordersChecked:  repResult.ordersChecked,
      ordersChanged:  repResult.ordersChanged,
      created:        repResult.created,
      errors:         repResult.errors,
    },
  });
}
