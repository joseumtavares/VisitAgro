import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { generateCommission } from '@/lib/commissionHelper';

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  const admin = getAdmin();
  const workspace = req.headers.get('x-workspace') || 'principal';
  const userId = req.headers.get('x-user-id') || '';

  const { data: settings } = await admin
    .from('settings')
    .select('dev_pin_hash')
    .eq('workspace', workspace)
    .maybeSingle();

  if (settings?.dev_pin_hash) {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(pin ?? '').digest('hex');

    if (hash !== settings.dev_pin_hash) {
      return NextResponse.json({ error: 'PIN inválido' }, { status: 403 });
    }
  }

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

  let created = 0;

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
      created++;
    }
  }

  await auditLog(
    '[MANUTENÇÃO] Comissões reprocessadas',
    {
      workspace,
      orders_checked: orders?.length ?? 0,
      commissions_created: created,
    },
    userId
  );

  return NextResponse.json({
    ok: true,
    processed: orders?.length ?? 0,
    created,
  });
}
