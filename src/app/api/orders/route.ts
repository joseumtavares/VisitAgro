import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

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

  // Número sequencial do pedido
  const { count } = await admin.from('orders').select('*', { count: 'exact', head: true });
  const orderNumber = (count ?? 0) + 1;

  // Calcula comissão do indicador
  let commissionValue = 0;
  const total = Number(body.total ?? 0);
  if (body.referral_id) {
    const { data: ref } = await admin.from('referrals').select('commission_type,commission_pct,commission').eq('id', body.referral_id).single();
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

  // Insere itens se houver
  if (body.items?.length) {
    const items = body.items.map((item: any) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      rep_commission_pct: item.rep_commission_pct ?? 0,
    }));
    await admin.from('order_items').insert(items);
  }

  // Se pedido já marcado como "pago", gera comissão
  if (body.status === 'pago' && body.referral_id && commissionValue > 0) {
    await generateCommission(admin, order, commissionValue);
  }

  await auditLog('[VENDA] Pedido criado', { order_id: orderId, order_number: orderNumber, total });
  return NextResponse.json({ order }, { status: 201 });
}

export async function generateCommission(admin: any, order: any, amount: number) {
  const { data: ref } = await admin.from('referrals').select('name').eq('id', order.referral_id).maybeSingle();
  const { data: client } = await admin.from('clients').select('name').eq('id', order.client_id).maybeSingle();
  await admin.from('commissions').insert([{
    id: crypto.randomUUID(),
    workspace: 'principal',
    referral_id: order.referral_id,
    referral_name: ref?.name ?? '',
    order_id: order.id,
    client_id: order.client_id,
    client_name: client?.name ?? '',
    amount,
    commission_type: order.commission_type ?? 'fixed',
    status: 'pendente',
    order_date: order.date,
    order_total: order.total,
    created_at: new Date().toISOString(),
  }]);
}
