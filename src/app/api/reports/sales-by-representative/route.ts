/**
 * GET /api/reports/sales-by-representative
 *
 * Relatório JSON de vendas por representante.
 *
 * Controle de acesso (L036-A preservado):
 *   - representative → vê apenas os próprios pedidos (user_id = userId)
 *   - admin / manager → vê todos; pode filtrar por rep_id via query param
 *
 * Filtros suportados via query string:
 *   - date_from  : YYYY-MM-DD (campo date do pedido, inclusivo)
 *   - date_to    : YYYY-MM-DD (campo date do pedido, inclusivo)
 *   - status     : pendente | aprovado | pago | cancelado | faturado
 *   - rep_id     : uuid (admin/manager apenas — filtra orders.user_id)
 *
 * Resposta:
 *   { report: { generated_at, filters, summary, by_representative, items } }
 *
 * Agrupamento by_representative é calculado no servidor para evitar
 * transferência desnecessária de dados ao frontend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdmin }                  from '@/lib/supabaseAdmin';
import { getRequestContext }         from '@/lib/requestContext';

export async function GET(req: NextRequest) {
  const { workspace, role, userId } = getRequestContext(req);
  const { searchParams }            = new URL(req.url);

  const dateFrom = searchParams.get('date_from');
  const dateTo   = searchParams.get('date_to');
  const status   = searchParams.get('status');
  const repId    = searchParams.get('rep_id'); // filtra orders.user_id

  const isAdminOrManager = role === 'admin' || role === 'manager';

  let query = getAdmin()
    .from('orders')
    .select(
      'id,order_number,date,status,total,discount,commission_value,' +
      'user_id,client_id,workspace,deleted_at,created_at,' +
      'clients(name)'
    )
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .order('date', { ascending: false });

  // ── Controle de acesso ───────────────────────────────────────────────────
  // Espelha o mesmo guard de GET /api/orders (L036-A preservado)
  if (!isAdminOrManager) {
    // representative vê apenas seus próprios pedidos
    query = query.eq('user_id', userId);
  } else if (repId) {
    // admin/manager pode filtrar por representante
    query = query.eq('user_id', repId);
  }

  // ── Filtros opcionais ────────────────────────────────────────────────────
  if (status) {
    query = query.eq('status', status);
  }
  if (dateFrom) {
    query = query.gte('date', dateFrom);
  }
  if (dateTo) {
    query = query.lte('date', dateTo);
  }

  const { data: orders, error: ordersError } = await query;

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  // Supabase SDK não infere colunas de select-string; tipamos explicitamente
  const items = (orders ?? []) as unknown as Array<{
    id:               string;
    order_number:     number | null;
    date:             string | null;
    status:           string;
    total:            number;
    discount:         number | null;
    commission_value: number | null;
    user_id:          string | null;
    client_id:        string | null;
    workspace:        string;
    deleted_at:       string | null;
    created_at:       string;
    clients:          { name: string } | null;
  }>;

  // ── Buscar nomes dos representantes (user_id → users) ────────────────────
  // Apenas quando admin/manager para enriquecer o relatório consolidado
  const repIds = [...new Set(items.map((o) => o.user_id).filter(Boolean))];
  let repNameMap: Record<string, string> = {};

  if (isAdminOrManager && repIds.length > 0) {
    const { data: reps } = await getAdmin()
      .from('users')
      .select('id,name,username')
      .in('id', repIds as string[]);

    if (reps) {
      repNameMap = Object.fromEntries(
        reps.map((r) => [r.id, r.name || r.username || r.id])
      );
    }
  }

  // ── Enriquecer items com rep_name ─────────────────────────────────────────
  const enrichedItems = items.map((o) => ({
    ...o,
    rep_name: isAdminOrManager
      ? (repNameMap[o.user_id ?? ''] ?? o.user_id ?? '—')
      : null, // representative não precisa do próprio nome no item
  }));

  // ── Totalizadores gerais ──────────────────────────────────────────────────
  const summary = {
    total_orders:    items.length,
    total_revenue:   items.reduce((acc, o) => acc + Number(o.total), 0),
    total_pago:      items.filter((o) => o.status === 'pago').reduce((acc, o) => acc + Number(o.total), 0),
    total_pendente:  items.filter((o) => o.status === 'pendente').reduce((acc, o) => acc + Number(o.total), 0),
    total_cancelado: items.filter((o) => o.status === 'cancelado').reduce((acc, o) => acc + Number(o.total), 0),
  };

  // ── Agrupamento por representante (admin/manager) ─────────────────────────
  const byRepresentative: Record<string, {
    rep_id:       string;
    rep_name:     string;
    total_orders: number;
    total_revenue:number;
    total_pago:   number;
  }> = {};

  if (isAdminOrManager) {
    for (const o of items) {
      const rid  = o.user_id ?? '__sem_rep__';
      const name = repNameMap[rid] ?? rid;

      if (!byRepresentative[rid]) {
        byRepresentative[rid] = {
          rep_id:       rid,
          rep_name:     name,
          total_orders: 0,
          total_revenue:0,
          total_pago:   0,
        };
      }

      byRepresentative[rid].total_orders  += 1;
      byRepresentative[rid].total_revenue += Number(o.total);
      if (o.status === 'pago') {
        byRepresentative[rid].total_pago += Number(o.total);
      }
    }
  }

  return NextResponse.json({
    report: {
      generated_at:     new Date().toISOString(),
      filters: {
        date_from: dateFrom,
        date_to:   dateTo,
        status,
        rep_id:    isAdminOrManager ? (repId ?? null) : userId,
      },
      summary,
      by_representative: isAdminOrManager ? Object.values(byRepresentative) : null,
      items: enrichedItems,
    },
  });
}
