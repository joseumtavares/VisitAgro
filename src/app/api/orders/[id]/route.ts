import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { generateCommission } from '@/lib/commissionHelper';
import { getRequestContext } from '@/lib/requestContext';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { workspace } = getRequestContext(req);
  const admin = getAdmin();
  const { data: order, error } = await admin.from('orders')
    .select('*, clients(name), referrals(name), order_items(*, products(name))')
    .eq('id', params.id)
    .eq('workspace', workspace)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { workspace } = getRequestContext(req);
  const admin = getAdmin();
  const body = await req.json();

  const { data: prev } = await admin.from('orders')
    .select('status,referral_id,commission_value,total,client_id,date,commission_type,workspace')
    .eq('id', params.id)
    .eq('workspace', workspace)
    .single();

  const { items: _items, payment_type: _pt, ...updateData } = body;
  const { data: order, error } = await admin.from('orders')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('workspace', workspace)
    .select()
    .single();
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { workspace } = getRequestContext(req);
  const { error } = await getAdmin()
    .from('orders')
    .update({ status: 'cancelado', updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('workspace', workspace);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
