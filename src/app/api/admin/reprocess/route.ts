import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { generateCommission } from '@/lib/commissionHelper';

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  const admin = getAdmin();

  // Verifica PIN
  const { data: settings } = await admin.from('settings').select('dev_pin_hash').eq('workspace','principal').maybeSingle();
  if (settings?.dev_pin_hash) {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(pin ?? '').digest('hex');
    if (hash !== settings.dev_pin_hash) {
      return NextResponse.json({ error: 'PIN inválido' }, { status: 403 });
    }
  }

  // Busca pedidos pagos sem comissão
  const { data: orders } = await admin.from('orders')
    .select('id,referral_id,commission_value,total,client_id,date,commission_type,status')
    .eq('status','pago').not('referral_id','is',null);

  let created = 0;
  for (const order of orders ?? []) {
    if (!order.referral_id || !Number(order.commission_value)) continue;
    const { count } = await admin.from('commissions').select('*',{count:'exact',head:true}).eq('order_id',order.id);
    if (!count || count === 0) {
      await generateCommission(admin, order, Number(order.commission_value));
      created++;
    }
  }

  await auditLog('[MANUTENÇÃO] Comissões reprocessadas', { orders_checked: orders?.length ?? 0, commissions_created: created });
  return NextResponse.json({ ok: true, processed: orders?.length ?? 0, created });
}
