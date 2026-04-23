/**
 * src/app/api/orders/route.ts — Lote L036-A
 *
 * MUDANÇA: GET agora filtra por perfil.
 *   - representative → vê apenas orders.user_id = userId
 *   - admin / manager / outros → vê todos do workspace (comportamento anterior)
 *
 * POST: sem alteração (representante cria pedido vinculado ao próprio user_id
 * automaticamente via middleware → x-user-id).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog }         from '@/lib/supabaseAdmin';
import { generateCommission }          from '@/lib/commissionHelper';
import { generateRepCommissions }      from '@/lib/repCommissionHelper';
import { getRequestContext }           from '@/lib/requestContext';

export async function GET(req: NextRequest) {
  // ── usar getRequestContext para obter role e userId de forma consistente ──
  const { workspace, role, userId } = getRequestContext(req);

  let query = getAdmin()
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

  // ── Controle de acesso por perfil ─────────────────────────────────────────
  // representative vê apenas seus próprios pedidos
  if (role === 'representative') {
    query = query.eq('user_id', userId);
  }
  // admin, manager e demais roles veem todos do workspace (comportamento original)

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json();
    const admin     = getAdmin();
    const workspace = req.headers.get('x-workspace') || 'principal';

    // ── userId: lido do header injetado pelo middleware (JWT → x-user-id) ──
    // Nunca depende do body — garante rastreabilidade do representante.
    const rawUserId = req.headers.get('x-user-id');
    const userId    = rawUserId && rawUserId.trim() !== '' ? rawUserId.trim() : null;

    if (!body.client_id) {
      return NextResponse.json({ error: 'Cliente obrigatório' }, { status: 400 });
    }

    // ── Itens ────────────────────────────────────────────────────────────
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

    // ── Indicador / comissão ─────────────────────────────────────────────
    const referralId =
      body.referral_id && String(body.referral_id).trim() !== ''
        ? String(body.referral_id).trim()
        : null;

    let commissionValue = 0;

    if (referralId) {
      const { data: ref } = await admin
        .from('referrals')
        .select('id,commission_type,commission_pct,commission')
        .eq('id', referralId)
        .eq('workspace', workspace)
        .is('deleted_at', null)
        .maybeSingle();

      if (ref) {
        const total = Number(body.total ?? 0);
        commissionValue =
          ref.commission_type === 'percent'
            ? (total * Number(ref.commission_pct ?? 0)) / 100
            : Number(ref.commission ?? 0);
      }
    }

    // ── Construir payload do pedido ───────────────────────────────────────
    const orderId = crypto.randomUUID();
    const { items: _items, payment_type: _pt, ...orderData } = body;
    const now = new Date().toISOString();

    const insertPayload = {
      ...orderData,
      id:               orderId,
      workspace,
      referral_id:      referralId,
      user_id:          userId,              // explícito — nunca vem do body
      commission_value: commissionValue,
      commission_type:  orderData.commission_type || 'percent',
      created_at:       now,
      updated_at:       now,
    };

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert([insertPayload])
      .select()
      .single();

    if (orderError) {
      console.error('[orders POST] Erro ao inserir pedido:', orderError.message);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // ── Inserir itens ────────────────────────────────────────────────────
    let itemsPayload: any[] = [];

    if (orderItems.length > 0) {
      itemsPayload = orderItems.map((item: any) => ({
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
        console.error('[orders POST] Erro ao inserir itens:', itemsError.message);
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    // ── Comissão de indicador (referral) ─────────────────────────────────
    if (body.status === 'pago' && referralId && commissionValue > 0) {
      await generateCommission(admin, order, commissionValue);
    }

    // ── Comissões de representante ─────────────────────────────────────
    if (body.status === 'pago' && userId && itemsPayload.length > 0) {
      const repResult = await generateRepCommissions(admin, order, itemsPayload);

      await auditLog(
        '[VENDA] rep_commissions tentativa via POST',
        {
          order_id:   orderId,
          user_id:    userId,
          workspace,
          items:      itemsPayload.length,
          ...repResult,
        },
        userId ?? undefined
      );
    } else if (body.status === 'pago') {
      await auditLog(
        '[VENDA] rep_commissions ignorado — razão registrada',
        {
          order_id:        orderId,
          workspace,
          user_id_present: !!userId,
          items_count:     itemsPayload.length,
          status:          body.status,
        }
      );
    }

    await auditLog(
      '[VENDA] Pedido criado',
      {
        order_id: orderId,
        total:    Number(body.total ?? 0),
        status:   body.status,
        user_id:  userId,
        workspace,
      },
      userId ?? undefined
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (e: any) {
    console.error('[orders POST] Exceção:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
