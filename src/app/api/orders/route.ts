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
    const body  = await req.json();
    const admin = getAdmin();

    // ── Contexto do usuário autenticado ──────────────────────
    const { workspace, role, userId } = getRequestContext(req);

    if (!body.client_id) {
      return NextResponse.json({ error: 'Cliente obrigatório' }, { status: 400 });
    }

    const rawItems   = Array.isArray(body.items) ? body.items : [];
    const orderItems = rawItems.filter(
      (item: any) => item.product_id && Number(item.quantity) > 0
    );

    if (rawItems.length !== orderItems.length) {
      return NextResponse.json(
        { error: 'Há itens sem produto selecionado ou com quantidade inválida.' },
        { status: 400 }
      );
    }

    // ── Determinar user_id do pedido ─────────────────────────
    // REGRA CRÍTICA: orders.user_id NUNCA deve ser null.
    //   - representative → sempre usa o próprio userId (do JWT)
    //   - admin/manager  → usa body.user_id se fornecido (seleção de rep
    //                       no formulário), senão usa o próprio userId
    let orderUserId: string | null = null;

    if (role === 'representative') {
      // Representante só pode criar pedidos para si mesmo
      orderUserId = userId || null;
    } else {
      // Admin/manager: aceita seleção de representante via body
      orderUserId = body.user_id || userId || null;
    }

    const orderId = crypto.randomUUID();
    let commissionValue = 0;
    const total = Number(body.total ?? 0);

    if (body.referral_id) {
      const { data: ref } = await admin
        .from('referrals')
        .select('commission_type,commission_pct,commission,workspace,deleted_at')
        .eq('id', body.referral_id)
        .eq('workspace', workspace)
        .is('deleted_at', null)
        .maybeSingle();

      if (ref) {
        commissionValue =
          ref.commission_type === 'percent'
            ? (total * Number(ref.commission_pct ?? 0)) / 100
            : Number(ref.commission ?? 0);
      }
    }

    const {
      items: _items,
      payment_type: _paymentType,
      user_id: _userId,  // remover do spread — usaremos orderUserId
      ...orderData
    } = body;

    const now = new Date().toISOString();

    const { data: order, error } = await admin
      .from('orders')
      .insert([
        {
          ...orderData,
          id:               orderId,
          workspace,
          user_id:          orderUserId,   // ← SEMPRE preenchido
          commission_value: commissionValue,
          commission_type:  orderData.commission_type || 'percent',
          created_at:       now,
          updated_at:       now,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (orderItems.length) {
      const itemsPayload = orderItems.map((item: any) => ({
        id:                 crypto.randomUUID(),
        order_id:           orderId,
        product_id:         item.product_id,
        product_name:       item.product_name || '',
        quantity:           Number(item.quantity) || 1,
        unit_price:         Number(item.unit_price) || 0,
        total:              (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
        rep_commission_pct: Number(item.rep_commission_pct) || 0,
        created_at:         now,
      }));

      const { error: itemsError } = await admin
        .from('order_items')
        .insert(itemsPayload);

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    if (body.status === 'pago' && body.referral_id && commissionValue > 0) {
      await generateCommission(admin, order, commissionValue);
    }

    await auditLog(
      '[VENDA] Pedido criado',
      { order_id: orderId, total, workspace, user_id: orderUserId },
      userId
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
