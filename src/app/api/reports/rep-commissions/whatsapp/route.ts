/**
 * GET /api/reports/rep-commissions/whatsapp
 *
 * Retorna JSON com texto formatado pronto para copiar e enviar via WhatsApp.
 * Sem integração com API externa — apenas texto plain.
 *
 * Controle de acesso (L036-A preservado):
 *   - representative → apenas próprias comissões
 *   - admin / manager → todas; aceita ?rep_id=
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
    .from('rep_commissions')
    .select(
      'rep_name,client_name,product_name,qty,rep_commission_pct,' +
      'amount,order_date,status'
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
    rep_name:           string | null;
    client_name:        string | null;
    product_name:       string | null;
    qty:                number | null;
    rep_commission_pct: number | null;
    amount:             number;
    order_date:         string | null;
    status:             string;
  }>;

  // ── Empresa e rep ────────────────────────────────────────────────────────
  const company = await fetchCompanyInfo(workspace);
  const companyDisplay = company.trade_name || company.name;

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

  // ── Totalizadores ────────────────────────────────────────────────────────
  const totalAmount   = items.reduce((a, i) => a + Number(i.amount), 0);
  const totalPendente = items.filter((i) => i.status === 'pendente').reduce((a, i) => a + Number(i.amount), 0);
  const totalPaga     = items.filter((i) => i.status === 'paga').reduce((a, i) => a + Number(i.amount), 0);

  const period = buildPeriodLabel(dateFrom, dateTo);
  const now    = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  // ── Montar texto WhatsApp ────────────────────────────────────────────────
  const lines: string[] = [];

  lines.push(`🌾 *${companyDisplay}*`);
  lines.push(`📊 *Relatório de Comissões*`);
  lines.push(`📅 Período: ${period}`);
  lines.push(`👤 Representante: ${repLabel}`);
  lines.push(`🗓 Gerado em: ${now}`);
  lines.push('');
  lines.push('*─ Resumo ─*');
  lines.push(`📦 Registros: ${items.length}`);
  lines.push(`💰 Total geral: *${fmtBRL(totalAmount)}*`);
  lines.push(`🟡 Pendente: ${fmtBRL(totalPendente)}`);
  lines.push(`🟢 Pago: ${fmtBRL(totalPaga)}`);

  // Detalhe (máximo 15 itens para não lotar a mensagem)
  if (items.length > 0) {
    lines.push('');
    lines.push('*─ Detalhes ─*');
    const shown = items.slice(0, 15);
    for (const i of shown) {
      const statusIcon = i.status === 'paga' ? '✅' : i.status === 'cancelada' ? '❌' : '⏳';
      lines.push(
        `${statusIcon} ${i.product_name || '—'} | ${i.client_name || '—'} | ${fmtBRL(i.amount)} | ${fmtDate(i.order_date)}`
      );
    }
    if (items.length > 15) {
      lines.push(`_... e mais ${items.length - 15} registros. Veja o PDF completo._`);
    }
  }

  lines.push('');
  lines.push(`_Relatório gerado pelo sistema ${companyDisplay}_`);

  return NextResponse.json({ text: lines.join('\n') });
}
