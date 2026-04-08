import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { generateCommission } from '@/lib/commissionHelper';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdmin();
  const { data: order, error } = await admin.from('orders')
    .select('*, clients(name), referrals(name), order_items(*, products(name))')
    .eq('id', params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdmin();
  const body = await req.json();

  const { data: prev } = await admin.from('orders')
    .select('status,referral_id,commission_value,total,client_id,date,commission_type')
    .eq('id', params.id).single();

  const { data: order, error } = await admin.from('orders')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (prev?.status !== 'pago' && body.status === 'pago' && order.referral_id && Number(order.commission_value) > 0) {
    const { count } = await admin.from('commissions')
      .select('*', { count: 'exact', head: true }).eq('order_id', params.id);
    if (!count || count === 0) {
      await generateCommission(admin, order, Number(order.commission_value));
    }
    await auditLog('[COMISSÃO] Gerada automaticamente', { order_id: params.id, amount: order.commission_value });
  }

  return NextResponse.json({ order });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await getAdmin().from('orders').update({ status: 'cancelado' }).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
