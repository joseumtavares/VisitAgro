import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { generateCommission } from '@/lib/commissionHelper';
import { generateRepCommissions } from '@/lib/repCommissionHelper';
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
    .select(
      'id,status,referral_id,commission_value,total,client_id,date,' +
      'commission_type,workspace,version,deleted_at,user_id'
    )
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

  // ── Se o pedido não tem user_id mas o usuário logado é conhecido,
  //    grava o user_id agora para habilitar comissões de representante.
  //    Isso corrige pedidos criados antes do fix do POST.
  const resolvedUserId: string | null =
    prev.user_id ||
    (userId && userId.trim() !== '' ? userId.trim() : null);

  const payload: Record<string, unknown> = {
    ...updateData,
    version:    body.version,
    updated_at: new Date().toISOString(),
  };

  // Persistir user_id se estava nulo e agora sabemos quem fez a mudança
  if (!prev.user_id && resolvedUserId) {
    payload.user_id = resolvedUserId;
  }

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
    const status  = message.includes('Order version mismatch') ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  const transitionToPago = prev.status !== 'pago' && order.status === 'pago';

  // ── Comissão de indicador ─────────────────────────────────────────────
  if (transitionToPago && order.referral_id && Number(order.commission_value) > 0) {
    const { count } = await admin
      .from('commissions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace', workspace)
      .eq('order_id', params.id);

    if (!count || count === 0) {
      await generateCommission(admin, order, Number(order.commission_value));
      await auditLog(
        '[COMISSÃO] Gerada automaticamente',
        { order_id: params.id, amount: order.commission_value, workspace },
        userId
      );
    }
  }

  // ── Comissões de representante ─────────────────────────────────────────
  // Usar resolvedUserId (pode ser o user_id existente OU o userId do request)
  if (transitionToPago && resolvedUserId) {
    const { data: items } = await admin
      .from('order_items')
      .select('id,product_id,product_name,quantity,unit_price,total,rep_commission_pct')
      .eq('order_id', params.id);

    if (items && items.length > 0) {
      // Passar order com o user_id resolvido (pode ter sido preenchido agora)
      const orderForRep = { ...order, user_id: resolvedUserId };
      const repResult   = await generateRepCommissions(admin, orderForRep, items);

      if (repResult.created > 0) {
        await auditLog(
          '[COMISSÃO REP] Geradas automaticamente (PUT)',
          {
            order_id: params.id,
            workspace,
            ...repResult,
          },
          userId
        );
      } else {
        await auditLog(
          '[COMISSÃO REP] PUT processado — sem novas comissões',
          {
            order_id: params.id,
            workspace,
            ...repResult,
          },
          userId
        );
      }
    }
  } else if (transitionToPago && !resolvedUserId) {
    await auditLog(
      '[COMISSÃO REP] Ignorado no PUT — user_id não disponível',
      { order_id: params.id, workspace }
    );
  }

  await auditLog(
    '[VENDA] Pedido atualizado',
    {
      order_id:          params.id,
      status:            order.status,
      workspace,
      version:           order.version,
      user_id_resolved:  resolvedUserId,
    },
    userId
  );

  return NextResponse.json({ order });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { workspace, userId } = getRequestContext(req);

  const { error } = await getAdmin()
    .from('orders')
    .update({
      status:     'cancelado',
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
