import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { generateCommission } from '@/lib/commissionHelper';
import { getRequestContext } from '@/lib/requestContext';

export async function GET(req: NextRequest) {
  const { workspace } = getRequestContext(req);

  const { data, error } = await getAdmin()
    .from('orders')
    .select(`
      id,
      order_number,
      date,
      status,
      total,
      discount,
      commission_type,
      commission_pct,
      commission_value,
      version,
      obs,
      client_id,
      referral_id,
      user_id,
      workspace,
      deleted_at,
      created_at,
      clients(name),
      referrals(name)
    `)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const admin = getAdmin();

    const { workspace, role, userId } = getRequestContext(req);

    if (!body.client_id) {
      return NextResponse.json({ error: 'Cliente obrigatório' }, { status: 400 });
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const orderItems = rawItems.filter(
      (item: any) => item.product_id && Number(item.quantity) > 0
    );

    if (rawItems.length !== orderItems.length) {
      return NextResponse.json(
        { error: 'Há itens sem produto selecionado ou com quantidade inválida.' },
        { status: 400 }
      );
    }

    if (!orderItems.length) {
      return NextResponse.json(
        { error: 'O pedido precisa ter ao menos um item válido.' },
        { status: 400 }
      );
    }

    // Indicador é OPCIONAL
    const normalizedReferralId =
      body.referral_id && String(body.referral_id).trim() !== ''
        ? String(body.referral_id).trim()
        : null;

    // Representante é OBRIGATÓRIO
    let orderUserId: string | null = null;

    if (role === 'representative') {
      orderUserId = userId || null;
    } else if (role === 'admin' || role === 'manager') {
      orderUserId =
        body.user_id && String(body.user_id).trim() !== ''
          ? String(body.user_id).trim()
          : null;
    } else {
      orderUserId = userId || null;
    }

    if (!orderUserId) {
      return NextResponse.json(
        { error: 'Representante é obrigatório para a venda.' },
        { status: 400 }
      );
    }

    // Validar representante
    const { data: rep, error: repError } = await admin
      .from('users')
      .select('id, role, workspace, active')
      .eq('id', orderUserId)
      .eq('workspace', workspace)
      .maybeSingle();

    if (repError) {
      return NextResponse.json({ error: repError.message }, { status: 500 });
    }

    if (!rep || !rep.active) {
      return NextResponse.json(
        { error: 'Representante inválido ou inativo.' },
        { status: 400 }
      );
    }

    // Você pode endurecer aqui se quiser exigir representante de verdade:
    // if (rep.role !== 'representative' && rep.role !== 'admin' && rep.role !== 'manager') {
    //   return NextResponse.json(
    //     { error: 'Usuário selecionado não pode ser responsável pela venda.' },
    //     { status: 400 }
    //   );
    // }

    // Validar indicador somente se informado
    let commissionValue = 0;
    const total = Number(body.total ?? 0);

    if (normalizedReferralId) {
      const { data: ref, error: refError } = await admin
        .from('referrals')
        .select('id, commission_type, commission_pct, commission, workspace, deleted_at')
        .eq('id', normalizedReferralId)
        .eq('workspace', workspace)
        .is('deleted_at', null)
        .maybeSingle();

      if (refError) {
        return NextResponse.json({ error: refError.message }, { status: 500 });
      }

      if (!ref) {
        return NextResponse.json(
          { error: 'Indicador inválido para este workspace.' },
          { status: 400 }
        );
      }

      commissionValue =
        ref.commission_type === 'percent'
          ? (total * Number(ref.commission_pct ?? 0)) / 100
          : Number(ref.commission ?? 0);
    }

    const orderId = crypto.randomUUID();

    const {
      items: _items,
      payment_type: _paymentType,
      user_id: _bodyUserId,
      referral_id: _bodyReferralId,
      ...orderData
    } = body;

    const now = new Date().toISOString();

    const { data: order, error } = await admin
      .from('orders')
      .insert([
        {
          ...orderData,
          id: orderId,
          workspace,
          user_id: orderUserId,
          referral_id: normalizedReferralId,
          commission_value: commissionValue,
          commission_type: orderData.commission_type || 'percent',
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const itemsPayload = orderItems.map((item: any) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product_name || '',
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      total: (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
      rep_commission_pct: Number(item.rep_commission_pct) || 0,
      created_at: now,
    }));

    const { error: itemsError } = await admin.from('order_items').insert(itemsPayload);

    if (itemsError) {
      // idealmente aqui depois você pode fazer rollback do pedido
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Comissão de indicador só se houver indicador válido e pedido pago
    if (body.status === 'pago' && normalizedReferralId && commissionValue > 0) {
      await generateCommission(admin, order, commissionValue);
    }

    await auditLog(
      '[VENDA] Pedido criado',
      {
        order_id: orderId,
        total,
        workspace,
        user_id: orderUserId,
        referral_id: normalizedReferralId,
      },
      userId
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}