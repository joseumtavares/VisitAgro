import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { generateCommission } from '@/lib/commissionHelper';
import { generateRepCommissions } from '@/lib/repCommissionHelper';

export async function GET(req: NextRequest) {
  const workspace = req.headers.get('x-workspace') || 'principal';

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
    const workspace = req.headers.get('x-workspace') || 'principal';
    const userId = req.headers.get('x-user-id') || undefined;

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

    const referralId =
      body.referral_id && String(body.referral_id).trim() !== ''
        ? String(body.referral_id)
        : null;

    let commissionValue = 0;
    if (referralId) {
      const { data: ref } = await admin
        .from('referrals')
        .select('id,commission_type,commission_pct,commission,workspace,deleted_at')
        .eq('id', referralId)
        .eq('workspace', workspace)
        .is('deleted_at', null)
        .maybeSingle();

      if (!ref) {
        return NextResponse.json(
          { error: 'Indicador inválido ou inexistente.' },
          { status: 400 }
        );
      }

      const total = Number(body.total ?? 0);
      commissionValue =
        ref.commission_type === 'percent'
          ? (total * Number(ref.commission_pct ?? 0)) / 100
          : Number(ref.commission ?? 0);
    }

    const orderId = crypto.randomUUID();
    const { items: _items, payment_type: _paymentType, ...orderData } = body;
    const now = new Date().toISOString();

    const { data: order, error } = await admin
      .from('orders')
      .insert([
        {
          ...orderData,
          referral_id: referralId,
          id: orderId,
          workspace,
          user_id: userId ?? null,
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

    let itemsPayload: any[] = [];

    if (orderItems.length) {
      itemsPayload = orderItems.map((item: any) => ({
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
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    if (body.status === 'pago' && referralId && commissionValue > 0) {
      await generateCommission(admin, order, commissionValue);
    }

    if (body.status === 'pago' && userId && itemsPayload.length > 0) {
      const { created, skipped } = await generateRepCommissions(admin, order, itemsPayload);
      if (created > 0) {
        await auditLog(
          '[COMISSÃO REP] Geradas automaticamente (POST)',
          { order_id: orderId, created, skipped, workspace },
          userId
        );
      }
    }

    await auditLog(
      '[VENDA] Pedido criado',
      { order_id: orderId, total: Number(body.total ?? 0), workspace },
      userId
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
