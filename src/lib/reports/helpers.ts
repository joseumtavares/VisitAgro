/**
 * src/lib/reports/helpers.ts — L036-C
 *
 * Helpers compartilhados pelos endpoints de relatório:
 *  - fetchCompanyInfo: busca nome/logotipo da empresa no workspace
 *  - fmtBRL: formata valor em BRL (pt-BR)
 *  - fmtDate: formata data ISO em dd/MM/yyyy
 *  - buildPeriodLabel: texto legível de período
 */

import { getAdmin } from '@/lib/supabaseAdmin';

// ── Dados da empresa ──────────────────────────────────────────────────────────

export interface CompanyInfo {
  name:      string;
  trade_name:string | null;
  logo_url:  string | null;
  document:  string | null;
  city:      string | null;
  state:     string | null;
  phone:     string | null;
  email:     string | null;
}

/**
 * Busca dados da empresa via settings → companies JOIN.
 * Retorna fallback seguro se não encontrado.
 */
export async function fetchCompanyInfo(workspace: string): Promise<CompanyInfo> {
  const fallback: CompanyInfo = {
    name:       'VisitAgro',
    trade_name: null,
    logo_url:   null,
    document:   null,
    city:       null,
    state:      null,
    phone:      null,
    email:      null,
  };

  try {
    const { data } = await getAdmin()
      .from('settings')
      .select('companies(name,trade_name,logo_url,document,city,state,phone,email)')
      .eq('workspace', workspace)
      .maybeSingle();

    const co = (data as any)?.companies;
    if (!co) return fallback;

    return {
      name:       co.name       ?? fallback.name,
      trade_name: co.trade_name ?? null,
      logo_url:   co.logo_url   ?? null,
      document:   co.document   ?? null,
      city:       co.city       ?? null,
      state:      co.state      ?? null,
      phone:      co.phone      ?? null,
      email:      co.email      ?? null,
    };
  } catch {
    return fallback;
  }
}

// ── Formatação ────────────────────────────────────────────────────────────────

/** Formata número como moeda BRL: R$ 1.234,56 */
export function fmtBRL(v: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(v ?? 0);
}

/** Formata string ISO ou YYYY-MM-DD como dd/MM/yyyy */
export function fmtDate(v: string | null | undefined): string {
  if (!v) return '—';
  // Supabase retorna datas como YYYY-MM-DD ou ISO completo
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/** Formata datetime ISO como dd/MM/yyyy HH:mm */
export function fmtDatetime(v: string | null | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString('pt-BR', {
    timeZone:    'America/Sao_Paulo',
    day:         '2-digit',
    month:       '2-digit',
    year:        'numeric',
    hour:        '2-digit',
    minute:      '2-digit',
  });
}

/** Gera label de período para cabeçalho: "01/01/2026 a 30/04/2026" ou "Todos os períodos" */
export function buildPeriodLabel(
  dateFrom: string | null,
  dateTo:   string | null,
): string {
  if (!dateFrom && !dateTo) return 'Todos os períodos';
  if (dateFrom && dateTo)   return `${fmtDate(dateFrom)} a ${fmtDate(dateTo)}`;
  if (dateFrom)             return `A partir de ${fmtDate(dateFrom)}`;
  return `Até ${fmtDate(dateTo!)}`;
}
