/**
 * GET /api/reports/rep-commissions/pdf
 *
 * Gera e retorna PDF real do relatório de comissões usando pdf-lib.
 * Responde com Content-Type: application/pdf para download direto.
 *
 * Controle de acesso (L036-A preservado):
 *   - representative → apenas próprias comissões (rep_id = userId)
 *   - admin / manager → todas; aceita ?rep_id= para filtrar
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
    .from('rep_commissions')
    .select(
      'id,rep_id,rep_name,order_date,' +
      'client_name,product_name,' +
      'qty,rep_commission_pct,amount,status'
    )
    .eq('workspace', workspace)
    .order('order_date', { ascending: false });

  if (!isAdminOrManager) {
    query = query.eq('rep_id', userId);
  } else if (repId) {
    query = query.eq('rep_id', repId);
  }

  if (status)   query = query.eq('status', status);
  if (dateFrom) query = query.gte('order_date', dateFrom);
  if (dateTo)   query = query.lte('order_date', dateTo);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []) as unknown as Array<{
    id:                 string;
    rep_id:             string | null;
    rep_name:           string | null;
    order_date:         string | null;
    client_name:        string | null;
    product_name:       string | null;
    qty:                number | null;
    rep_commission_pct: number | null;
    amount:             number;
    status:             'pendente' | 'paga' | 'cancelada';
  }>;

  // ── Resolver nome do representante ───────────────────────────────────
  let repLabel = 'Consolidado';
  if (!isAdminOrManager) {
    const { data: u } = await getAdmin()
      .from('users').select('name,username').eq('id', userId).maybeSingle();
    repLabel = (u as any)?.name || (u as any)?.username || 'Representante';
  } else if (repId) {
    const { data: u } = await getAdmin()
      .from('users').select('name,username').eq('id', repId).maybeSingle();
    repLabel = (u as any)?.name || (u as any)?.username || repId;
  }

  // ── Totalizadores ────────────────────────────────────────────────────
  const totalAmount    = items.reduce((a, i) => a + Number(i.amount), 0);
  const totalPendente  = items.filter((i) => i.status === 'pendente').reduce((a, i) => a + Number(i.amount), 0);
  const totalPaga      = items.filter((i) => i.status === 'paga').reduce((a, i) => a + Number(i.amount), 0);
  const totalCancelada = items.filter((i) => i.status === 'cancelada').reduce((a, i) => a + Number(i.amount), 0);

  // ── Empresa ──────────────────────────────────────────────────────────
  const company = await fetchCompanyInfo(workspace);

  // ── Summary cards ────────────────────────────────────────────────────
  const summary = [
    { label: 'Registros',     value: String(items.length) },
    { label: 'Total Geral',   value: fmtBRL(totalAmount),    accent: true },
    { label: 'Pendente',      value: fmtBRL(totalPendente) },
    { label: 'Paga',          value: fmtBRL(totalPaga),      accent: true },
    { label: 'Cancelada',     value: fmtBRL(totalCancelada) },
  ];

  // ── Colunas ──────────────────────────────────────────────────────────
  const showRepCol = isAdminOrManager && !repId;
  const columns = [
    ...(showRepCol ? [{ header: 'Representante', key: 'rep_name',  width: 90 }] : []),
    { header: 'Produto',   key: 'product_name', width: 100 },
    { header: 'Cliente',   key: 'client_name',  width: 90  },
    { header: 'Data',      key: 'order_date',   width: 55  },
    { header: 'Qtd',       key: 'qty',          width: 30, align: 'right' as const },
    { header: '% Com.',    key: 'pct',          width: 38, align: 'right' as const },
    { header: 'Valor',     key: 'amount',       width: 65, align: 'right' as const },
    { header: 'Status',    key: 'status',       width: 52  },
  ];

  // ── Linhas ───────────────────────────────────────────────────────────
  const rows = items.map((i) => ({
    rep_name:     i.rep_name    ?? '—',
    product_name: i.product_name ?? '—',
    client_name:  i.client_name  ?? '—',
    order_date:   fmtDate(i.order_date),
    qty:          i.qty != null  ? String(i.qty) : '—',
    pct:          i.rep_commission_pct != null ? `${i.rep_commission_pct}%` : '—',
    amount:       fmtBRL(i.amount),
    status:       i.status,
  }));

  // ── Gerar PDF ────────────────────────────────────────────────────────
  const pdfBytes = await buildPdf(
    {
      company,
      title:          'Relatório de Comissões',
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
  const filename = `comissoes-${companySlug}-${new Date().toISOString().slice(0,10)}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  });
}
