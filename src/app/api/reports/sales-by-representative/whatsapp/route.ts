/**
 * GET /api/reports/sales-by-representative/whatsapp
 *
 * Retorna JSON com texto formatado pronto para copiar e enviar via WhatsApp.
 * Sem integração com API externa — apenas texto plain.
 *
 * Controle de acesso (L036-A preservado):
 *   - representative → apenas próprios pedidos (user_id = userId)
 *   - admin / manager → todos; aceita ?rep_id= para filtrar
 *
 * Filtros: date_from, date_to, status, rep_id (admin/manager)
 *
 * Resposta: { text: string }
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

export async function GET(req: NextRequest) {
  const { workspace, role, userId } = getRequestContext(req);
  const { searchParams }            = new URL(req.url);

  const dateFrom = searchParams.get('date_from');
  const dateTo   = searchParams.get('date_to');
  const status   = searchParams.get('status');
  const repId    = searchParams.get('rep_id');

  const isAdminOrManager = role === 'admin' || role === 'manager';

  // ── Query — idêntica ao endpoint JSON irmão ──────────────────────────────
  let query = getAdmin()
    .from('orders')
    .select('order_number,date,status,total,user_id,clients(name)')
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

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []) as unknown as Array<{
    order_number: number | null;
    date:         string | null;
    status:       string;
    total:        number;
    user_id:      string | null;
    clients:      { name: string } | null;
  }>;

  // ── Resolver nomes dos representantes (admin/manager) ────────────────────
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

  // ── Label do representante ────────────────────────────────────────────────
  let repLabel = 'Consolidado';
  if (!isAdminOrManager) {
    const { data: u } = await getAdmin()
      .from('users').select('name,username').eq('id', userId).maybeSingle();
    repLabel = (u as any)?.name || (u as any)?.username || 'Representante';
  } else if (repId) {
    repLabel = repNameMap[repId] || repId;
  }

  // ── Totalizadores ────────────────────────────────────────────────────────
  const totalRevenue   = items.reduce((a, o) => a + Number(o.total), 0);
  const totalPago      = items.filter((o) => o.status === 'pago').reduce((a, o) => a + Number(o.total), 0);
  const totalPendente  = items.filter((o) => o.status === 'pendente').reduce((a, o) => a + Number(o.total), 0);
  const totalCancelado = items.filter((o) => o.status === 'cancelado').reduce((a, o) => a + Number(o.total), 0);

  // ── Agrupamento por representante (admin consolidado) ────────────────────
  const byRep: Record<string, { name: string; orders: number; total: number }> = {};
  if (isAdminOrManager && !repId) {
    for (const o of items) {
      const rid = o.user_id ?? '__sem_rep__';
      if (!byRep[rid]) byRep[rid] = { name: repNameMap[rid] || rid, orders: 0, total: 0 };
      byRep[rid].orders += 1;
      byRep[rid].total  += Number(o.total);
    }
  }

  // ── Empresa ──────────────────────────────────────────────────────────────
  const company        = await fetchCompanyInfo(workspace);
  const companyDisplay = company.trade_name || company.name;
  const period         = buildPeriodLabel(dateFrom, dateTo);
  const now            = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  // ── Montar texto WhatsApp ────────────────────────────────────────────────
  const lines: string[] = [];

  lines.push(`🌾 *${companyDisplay}*`);
  lines.push(`🛒 *Relatório de Vendas*`);
  lines.push(`📅 Período: ${period}`);
  lines.push(`👤 ${repLabel}`);
  lines.push(`🗓 Gerado em: ${now}`);
  lines.push('');
  lines.push('*─ Resumo ─*');
  lines.push(`📦 Pedidos: ${items.length}`);
  lines.push(`💰 Receita total: *${fmtBRL(totalRevenue)}*`);
  lines.push(`🟢 Pago: *${fmtBRL(totalPago)}*`);
  lines.push(`🟡 Pendente: ${fmtBRL(totalPendente)}`);
  lines.push(`🔴 Cancelado: ${fmtBRL(totalCancelado)}`);

  // Consolidado por representante (admin sem filtro de rep)
  const byRepEntries = Object.values(byRep);
  if (byRepEntries.length > 1) {
    lines.push('');
    lines.push('*─ Por Representante ─*');
    const sorted = byRepEntries.sort((a, b) => b.total - a.total);
    const shown  = sorted.slice(0, 10);
    for (const r of shown) {
      lines.push(`👤 ${r.name}: ${r.orders} pedido(s) — *${fmtBRL(r.total)}*`);
    }
    if (sorted.length > 10) {
      lines.push(`_... e mais ${sorted.length - 10} representante(s)._`);
    }
  }

  // Detalhe dos pedidos (máximo 15)
  if (items.length > 0) {
    lines.push('');
    lines.push('*─ Pedidos ─*');
    const shown = items.slice(0, 15);
    for (const o of shown) {
      const statusIcon =
        o.status === 'pago'      ? '✅' :
        o.status === 'cancelado' ? '❌' :
        o.status === 'aprovado'  ? '🔵' :
        o.status === 'faturado'  ? '🟣' : '⏳';
      const num    = o.order_number ? `#${o.order_number}` : '—';
      const client = o.clients?.name || '—';
      lines.push(
        `${statusIcon} ${num} | ${fmtDate(o.date)} | ${client} | *${fmtBRL(o.total)}*`
      );
    }
    if (items.length > 15) {
      lines.push(`_... e mais ${items.length - 15} pedido(s). Veja o PDF completo._`);
    }
  }

  lines.push('');
  lines.push(`_Relatório gerado pelo sistema ${companyDisplay}_`);

  return NextResponse.json({ text: lines.join('\n') });
}
