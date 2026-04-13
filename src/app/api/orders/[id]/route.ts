import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { generateCommission } from '@/lib/commissionHelper';
import { getRequestContext } from '@/lib/requestContext';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdmin();
  const { workspace } = getRequestContext(req);

  const { data: order, error } = await admin
    .from('orders')
    .select(`
      *,
      clients(name),
      referrals(name),
      order_items(*, products(name))
    `)
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdmin();
  const { workspace, userId } = getRequestContext(req);
  const body = await req.json();

  if (typeof body.version !== 'number') {
    return NextResponse.json(
      { error: 'Versão do pedido obrigatória para atualização.' },
      { status: 409 }
    );
  }

  const { data: prev, error: prevError } = await admin
    .from('orders')
    .select('id,status,referral_id,commission_value,total,client_id,date,commission_type,workspace,version,deleted_at')
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .single();

  if (prevError || !prev) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  }

  const {
    items: _items,
    payment_type: _paymentType,
    workspace: _workspace,
    deleted_at: _deletedAt,
    order_number: _orderNumber,
    ...updateData
  } = body;

  const payload: Record<string, any> = {
    ...updateData,
    version: body.version,
    updated_at: new Date().toISOString(),
  };

  const { data: order, error } = await admin
    .from('orders')
    .update(payload)
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    const message = String(error.message || '');
    const status = message.includes('Order version mismatch') ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  if (
    prev.status !== 'pago' &&
    order.status === 'pago' &&
    order.referral_id &&
    Number(order.commission_value) > 0
  ) {
    const { count, error: countError } = await admin
      .from('commissions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace', workspace)
      .eq('order_id', params.id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (!count || count === 0) {
      await generateCommission(admin, order, Number(order.commission_value));

      await auditLog(
        '[COMISSÃO] Gerada automaticamente',
        { order_id: params.id, amount: order.commission_value, workspace },
        userId
      );
    }
  }

  await auditLog(
    '[VENDA] Pedido atualizado',
    { order_id: params.id, status: order.status, workspace, version: order.version },
    userId
  );

  return NextResponse.json({ order });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { workspace, userId } = getRequestContext(req);

  const { error } = await getAdmin()
    .from('orders')
    .update({
      status: 'cancelado',
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog(
    '[VENDA] Pedido removido',
    { order_id: params.id, workspace },
    userId
  );

  return NextResponse.json({ ok: true });
}
