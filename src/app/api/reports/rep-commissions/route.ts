/**
 * GET /api/reports/rep-commissions
 *
 * Relatório JSON de comissões de representantes.
 *
 * Controle de acesso (L036-A preservado):
 *   - representative → vê apenas as próprias comissões (rep_id = userId)
 *   - admin / manager → vê todas; pode filtrar por rep_id via query param
 *
 * Filtros suportados via query string:
 *   - date_from  : YYYY-MM-DD (inclusivo)
 *   - date_to    : YYYY-MM-DD (inclusivo)
 *   - status     : pendente | paga | cancelada
 *   - rep_id     : uuid (admin/manager apenas)
 *
 * Resposta:
 *   { report: { generated_at, filters, summary, items } }
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
  const repId    = searchParams.get('rep_id');

  const isAdminOrManager = role === 'admin' || role === 'manager';

  let query = getAdmin()
    .from('rep_commissions')
    .select(
      'id,workspace,rep_id,rep_name,order_id,order_date,' +
      'client_id,client_name,product_id,product_name,' +
      'qty,unit_price,rep_commission_pct,amount,order_total,' +
      'status,paid_at,created_at,updated_at'
    )
    .eq('workspace', workspace)
    .order('order_date', { ascending: false });

  // ── Controle de acesso ───────────────────────────────────────────────────
  // Espelha o mesmo guard de GET /api/rep-commissions (L036-A preservado)
  if (!isAdminOrManager) {
    // representative vê apenas as próprias
    query = query.eq('rep_id', userId);
  } else if (repId) {
    // admin/manager pode filtrar por rep_id
    query = query.eq('rep_id', repId);
  }

  // ── Filtros opcionais ────────────────────────────────────────────────────
  if (status) {
    query = query.eq('status', status);
  }
  if (dateFrom) {
    query = query.gte('order_date', dateFrom);
  }
  if (dateTo) {
    query = query.lte('order_date', dateTo);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Supabase SDK não infere colunas de select-string; tipamos explicitamente
  const items = (data ?? []) as unknown as Array<{
    id:                 string;
    workspace:          string;
    rep_id:             string | null;
    rep_name:           string | null;
    order_id:           string | null;
    order_date:         string | null;
    client_id:          string | null;
    client_name:        string | null;
    product_id:         string | null;
    product_name:       string | null;
    qty:                number | null;
    unit_price:         number | null;
    rep_commission_pct: number | null;
    amount:             number;
    order_total:        number | null;
    status:             'pendente' | 'paga' | 'cancelada';
    paid_at:            string | null;
    created_at:         string;
    updated_at:         string;
  }>;

  // ── Totalizadores ────────────────────────────────────────────────────────
  const summary = {
    total_items:    items.length,
    total_amount:   items.reduce((acc, i) => acc + Number(i.amount), 0),
    total_pendente: items.filter((i) => i.status === 'pendente').reduce((acc, i) => acc + Number(i.amount), 0),
    total_paga:     items.filter((i) => i.status === 'paga').reduce((acc, i) => acc + Number(i.amount), 0),
    total_cancelada:items.filter((i) => i.status === 'cancelada').reduce((acc, i) => acc + Number(i.amount), 0),
  };

  return NextResponse.json({
    report: {
      generated_at: new Date().toISOString(),
      filters: {
        date_from: dateFrom,
        date_to:   dateTo,
        status,
        rep_id:    isAdminOrManager ? (repId ?? null) : userId,
      },
      summary,
      items,
    },
  });
}
