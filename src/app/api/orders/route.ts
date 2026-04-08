import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { generateCommission } from '@/lib/commissionHelper';

export async function GET() {
  const { data, error } = await getAdmin()
    .from('orders')
    .select(`
      id, order_number, date, status, total, discount,
      commission_type, commission_pct, commission_value, obs,
      client_id, referral_id, user_id, workspace, created_at,
      clients(name),
      referrals(name)
    `)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.client_id) return NextResponse.json({ error: 'Cliente obrigatório' }, { status: 400 });

  const admin = getAdmin();
  const orderId = crypto.randomUUID();

  const { count } = await admin.from('orders').select('*', { count: 'exact', head: true });
  const orderNumber = (count ?? 0) + 1;

  let commissionValue = 0;
  const total = Number(body.total ?? 0);
  if (body.referral_id) {
    const { data: ref } = await admin.from('referrals')
      .select('commission_type,commission_pct,commission')
      .eq('id', body.referral_id).single();
    if (ref) {
      commissionValue = ref.commission_type === 'percent'
        ? (total * Number(ref.commission_pct ?? 0)) / 100
        : Number(ref.commission ?? 0);
    }
  }

  const { data: order, error } = await admin.from('orders')
    .insert([{
      ...body,
      id: orderId,
      order_number: orderNumber,
      commission_value: commissionValue,
      workspace: 'principal',
      created_at: new Date().toISOString(),
    }])
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.items?.length) {
    const items = body.items.map((item: any) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: item.product_id || null,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      rep_commission_pct: item.rep_commission_pct ?? 0,
    }));
    await admin.from('order_items').insert(items);
  }

  if (body.status === 'pago' && body.referral_id && commissionValue > 0) {
    await generateCommission(admin, order, commissionValue);
  }

  await auditLog('[VENDA] Pedido criado', { order_id: orderId, order_number: orderNumber, total });
  return NextResponse.json({ order }, { status: 201 });
}
