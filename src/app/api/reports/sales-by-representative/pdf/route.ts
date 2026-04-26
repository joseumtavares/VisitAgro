/**
 * GET /api/reports/sales-by-representative/pdf
 *
 * Gera e retorna PDF real do relatório de vendas por representante usando pdf-lib.
 * Responde com Content-Type: application/pdf para download direto.
 *
 * Controle de acesso (L036-A preservado):
 *   - representative → apenas próprios pedidos (user_id = userId)
 *   - admin / manager → todos; aceita ?rep_id= para filtrar
 *
 * Filtros: date_from, date_to, status, rep_id (admin/manager)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdmin }          from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';
import {
  fetchCompanyInfo,
  fmtBRL,
  fmtDate,
  buildPeriodLabel,
} from '@/lib/reports/helpers';
import { buildPdf } from '@/lib/reports/pdfBuilder';

export async function GET(req: NextRequest) {
  const { workspace, role, userId } = getRequestContext(req);
  const { searchParams }            = new URL(req.url);

  const dateFrom = searchParams.get('date_from');
  const dateTo   = searchParams.get('date_to');
  const status   = searchParams.get('status');
  const repId    = searchParams.get('rep_id');

  const isAdminOrManager = role === 'admin' || role === 'manager';

  // ── Query — idêntica ao endpoint JSON irmão ──────────────────────────
  let query = getAdmin()
    .from('orders')
    .select(
      'id,order_number,date,status,total,user_id,' +
      'clients(name)'
    )
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .order('date', { ascending: false });

  if (!isAdminOrManager) {
    query = query.eq('user_id', userId);
  } else if (repId) {
    query = query.eq('user_id', repId);
  }

  if (status)   query = query.eq('status', status);
  if (dateFrom) query = query.gte('date', dateFrom);
  if (dateTo)   query = query.lte('date', dateTo);

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (orders ?? []) as unknown as Array<{
    id:           string;
    order_number: number | null;
    date:         string | null;
    status:       string;
    total:        number;
    user_id:      string | null;
    clients:      { name: string } | null;
  }>;

  // ── Resolver nomes dos representantes ────────────────────────────────
  const repIds = [...new Set(items.map((o) => o.user_id).filter(Boolean))];
  let repNameMap: Record<string, string> = {};

  if (isAdminOrManager && repIds.length > 0) {
    const { data: reps } = await getAdmin()
      .from('users').select('id,name,username').in('id', repIds as string[]);
    if (reps) {
      repNameMap = Object.fromEntries(
        (reps as any[]).map((r) => [r.id, r.name || r.username || r.id])
      );
    }
  }

  // ── Label do representante para o cabeçalho ──────────────────────────
  let repLabel = 'Consolidado';
  if (!isAdminOrManager) {
    const { data: u } = await getAdmin()
      .from('users').select('name,username').eq('id', userId).maybeSingle();
    repLabel = (u as any)?.name || (u as any)?.username || 'Representante';
  } else if (repId) {
    repLabel = repNameMap[repId] || repId;
  }

  // ── Totalizadores ────────────────────────────────────────────────────
  const totalRevenue   = items.reduce((a, o) => a + Number(o.total), 0);
  const totalPago      = items.filter((o) => o.status === 'pago').reduce((a, o) => a + Number(o.total), 0);
  const totalPendente  = items.filter((o) => o.status === 'pendente').reduce((a, o) => a + Number(o.total), 0);
  const totalCancelado = items.filter((o) => o.status === 'cancelado').reduce((a, o) => a + Number(o.total), 0);

  // ── Empresa ──────────────────────────────────────────────────────────
  const company = await fetchCompanyInfo(workspace);

  // ── Summary cards ────────────────────────────────────────────────────
  const summary = [
    { label: 'Pedidos',     value: String(items.length) },
    { label: 'Receita',     value: fmtBRL(totalRevenue),   accent: true },
    { label: 'Pago',        value: fmtBRL(totalPago),      accent: true },
    { label: 'Pendente',    value: fmtBRL(totalPendente) },
    { label: 'Cancelado',   value: fmtBRL(totalCancelado) },
  ];

  // ── Tabela por representante (admin consolidado) ──────────────────────
  // Inserir bloco de consolidação antes da lista de pedidos
  const byRepRows: Record<string, string>[] = [];
  const byRepCols = [
    { header: 'Representante', key: 'rep_name',     width: 150 },
    { header: 'Pedidos',       key: 'total_orders', width: 55, align: 'right' as const },
    { header: 'Receita',       key: 'total_revenue',width: 85, align: 'right' as const },
    { header: 'Total Pago',    key: 'total_pago',   width: 85, align: 'right' as const },
  ];

  if (isAdminOrManager && !repId) {
    const byRep: Record<string, { orders: number; revenue: number; pago: number }> = {};
    for (const o of items) {
      const rid = o.user_id ?? '__sem_rep__';
      if (!byRep[rid]) byRep[rid] = { orders: 0, revenue: 0, pago: 0 };
      byRep[rid].orders  += 1;
      byRep[rid].revenue += Number(o.total);
      if (o.status === 'pago') byRep[rid].pago += Number(o.total);
    }
    for (const [rid, v] of Object.entries(byRep)) {
      byRepRows.push({
        rep_name:      repNameMap[rid] || rid,
        total_orders:  String(v.orders),
        total_revenue: fmtBRL(v.revenue),
        total_pago:    fmtBRL(v.pago),
      });
    }
  }

  // ── Colunas da tabela de pedidos ─────────────────────────────────────
  const showRepCol = isAdminOrManager && !repId;
  const orderColumns = [
    { header: 'Nº',           key: 'order_number', width: 40 },
    { header: 'Data',         key: 'date',         width: 55 },
    ...(showRepCol ? [{ header: 'Representante', key: 'rep_name', width: 90 }] : []),
    { header: 'Cliente',      key: 'client_name',  width: 120 },
    { header: 'Total',        key: 'total',        width: 70, align: 'right' as const },
    { header: 'Status',       key: 'status',       width: 55 },
  ];

  const orderRows = items.map((o) => ({
    order_number: o.order_number ? `#${o.order_number}` : '—',
    date:         fmtDate(o.date),
    rep_name:     isAdminOrManager ? (repNameMap[o.user_id ?? ''] || '—') : '—',
    client_name:  o.clients?.name ?? '—',
    total:        fmtBRL(o.total),
    status:       o.status,
  }));

  // ── Gerar PDF ────────────────────────────────────────────────────────
  // Se consolidado (admin sem filtro de rep): inclui tabela por rep + pedidos
  // Caso contrário: apenas pedidos
  const columns = byRepRows.length > 0 ? byRepCols : orderColumns;
  const rows    = byRepRows.length > 0 ? byRepRows : orderRows;

  const pdfBytes = await buildPdf(
    {
      company,
      title:          byRepRows.length > 0
        ? 'Vendas por Representante — Consolidado'
        : 'Relatório de Vendas',
      period:         buildPeriodLabel(dateFrom, dateTo),
      representative: repLabel,
      generatedAt:    new Date().toISOString(),
    },
    summary,
    columns,
    rows,
  );

  const companySlug = (company.trade_name || company.name)
    .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const filename = `vendas-${companySlug}-${new Date().toISOString().slice(0,10)}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  });
}
