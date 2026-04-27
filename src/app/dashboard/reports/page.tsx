'use client';
/**
 * src/app/dashboard/reports/page.tsx — L036-B / L036-C
 *
 * Central de Relatórios.
 * Entrada única para relatório de comissões e vendas por representante.
 *
 * Regras de acesso (L036-A preservadas):
 *   - representative: vê apenas relatórios próprios
 *   - admin / manager: vê individuais e consolidados, com filtro por representante
 *
 * L036-C: botões Baixar PDF e Copiar WhatsApp integrados.
 */

import { useCallback, useEffect, useState } from 'react';
import DashboardShell  from '@/components/layout/DashboardShell';
import { useAuthStore } from '@/store/authStore';
import { apiFetch }     from '@/lib/apiFetch';
import {
  BarChart2,
  TrendingUp,
  ShoppingCart,
  Filter,
  RefreshCw,
  ChevronDown,
  Download,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';

// ── tipos locais ──────────────────────────────────────────────────────────────

interface RepCommissionItem {
  id:                  string;
  rep_name:            string | null;
  client_name:         string | null;
  product_name:        string | null;
  order_date:          string | null;
  qty:                 number | null;
  rep_commission_pct:  number | null;
  amount:              number;
  status:              'pendente' | 'paga' | 'cancelada';
}

interface RepCommissionReport {
  generated_at: string;
  summary: {
    total_items:     number;
    total_amount:    number;
    total_pendente:  number;
    total_paga:      number;
    total_cancelada: number;
  };
  items: RepCommissionItem[];
}

interface SalesItem {
  id:           string;
  order_number: number | null;
  date:         string | null;
  status:       string;
  total:        number;
  rep_name:     string | null;
  clients:      { name: string } | null;
}

interface ByRepresentative {
  rep_id:       string;
  rep_name:     string;
  total_orders: number;
  total_revenue:number;
  total_pago:   number;
}

interface SalesReport {
  generated_at: string;
  summary: {
    total_orders:    number;
    total_revenue:   number;
    total_pago:      number;
    total_pendente:  number;
    total_cancelado: number;
  };
  by_representative: ByRepresentative[] | null;
  items: SalesItem[];
}

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function fmtDate(v: string | null | undefined): string {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('pt-BR');
}

type ReportTab = 'commissions' | 'sales';

// ── componentes internos ──────────────────────────────────────────────────────

function SummaryCard({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl p-4">
      <p className="text-xs text-dark-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ── página principal ──────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user } = useAuthStore();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // ── tab ativa
  const [tab, setTab] = useState<ReportTab>('commissions');

  // ── filtros compartilhados
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  // ── filtros específicos
  const [commStatus,  setCommStatus]  = useState('');
  const [salesStatus, setSalesStatus] = useState('');
  const [repId,       setRepId]       = useState('');

  // ── dados
  const [commReport,  setCommReport]  = useState<RepCommissionReport | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  // ── ações de exportação
  const [pdfLoading,    setPdfLoading]    = useState(false);
  const [waCopied,      setWaCopied]      = useState(false);
  const [waLoading,     setWaLoading]     = useState(false);

  // ── lista de representantes (admin/manager)
  const [repList, setRepList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!isAdminOrManager) return;
    apiFetch('/api/representatives')
      .then((r) => r.json())
      .then((d) => {
        const reps = (d.representatives ?? []) as { id: string; name?: string | null; username: string }[];
        setRepList(reps.map((r) => ({ id: r.id, name: r.name || r.username })));
      })
      .catch(() => {});
  }, [isAdminOrManager]);

  // ── helper para construir query string (reutilizado em JSON + PDF + WA)
  const buildQs = useCallback((extraStatus?: string) => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo)   params.set('date_to',   dateTo);
    const st = extraStatus ?? (tab === 'commissions' ? commStatus : salesStatus);
    if (st)   params.set('status', st);
    if (repId && isAdminOrManager) params.set('rep_id', repId);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [dateFrom, dateTo, commStatus, salesStatus, repId, isAdminOrManager, tab]);

  // ── baixar PDF
  const handleDownloadPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const base = tab === 'commissions'
        ? '/api/reports/rep-commissions/pdf'
        : '/api/reports/sales-by-representative/pdf';
      const res = await apiFetch(`${base}${buildQs()}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as any)?.error || 'Erro ao gerar PDF.');
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = tab === 'commissions' ? 'comissoes.pdf' : 'vendas.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPdfLoading(false);
    }
  }, [tab, buildQs]);

  // ── copiar resumo WhatsApp — rota depende da tab ativa
  const handleCopyWhatsApp = useCallback(async () => {
    setWaLoading(true);
    try {
      const base = tab === 'commissions'
        ? '/api/reports/rep-commissions/whatsapp'
        : '/api/reports/sales-by-representative/whatsapp';
      const res = await apiFetch(`${base}${buildQs()}`);
      const d   = await res.json().catch(() => ({}));
      if (!res.ok) { setError((d as any)?.error || 'Erro ao gerar resumo.'); return; }
      await navigator.clipboard.writeText((d as any).text ?? '');
      setWaCopied(true);
      setTimeout(() => setWaCopied(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setWaLoading(false);
    }
  }, [tab, buildQs]);

  // ── busca relatório de comissões
  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (dateFrom)   params.set('date_from', dateFrom);
      if (dateTo)     params.set('date_to',   dateTo);
      if (commStatus) params.set('status',    commStatus);
      if (repId && isAdminOrManager) params.set('rep_id', repId);

      const qs  = params.toString();
      const res = await apiFetch(`/api/reports/rep-commissions${qs ? `?${qs}` : ''}`);
      const d   = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || 'Erro ao carregar relatório.');
      setCommReport(d.report);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, commStatus, repId, isAdminOrManager]);

  // ── busca relatório de vendas
  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (dateFrom)    params.set('date_from', dateFrom);
      if (dateTo)      params.set('date_to',   dateTo);
      if (salesStatus) params.set('status',    salesStatus);
      if (repId && isAdminOrManager) params.set('rep_id', repId);

      const qs  = params.toString();
      const res = await apiFetch(`/api/reports/sales-by-representative${qs ? `?${qs}` : ''}`);
      const d   = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error || 'Erro ao carregar relatório.');
      setSalesReport(d.report);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, salesStatus, repId, isAdminOrManager]);

  // ── busca inicial ao trocar de tab
  useEffect(() => {
    if (tab === 'commissions') fetchCommissions();
    else                        fetchSales();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleApply = () => {
    if (tab === 'commissions') fetchCommissions();
    else                        fetchSales();
  };

  // ── status badges de comissão
  const COMM_STATUS_COLORS: Record<string, string> = {
    pendente:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    paga:      'bg-green-500/15 text-green-300 border-green-500/30',
    cancelada: 'bg-red-500/15 text-red-300 border-red-500/30',
  };

  const SALES_STATUS_COLORS: Record<string, string> = {
    pendente:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    aprovado:  'bg-blue-500/15 text-blue-300 border-blue-500/30',
    pago:      'bg-green-500/15 text-green-300 border-green-500/30',
    cancelado: 'bg-red-500/15 text-red-300 border-red-500/30',
    faturado:  'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  return (
    <DashboardShell>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary-400" />
            Central de Relatórios
          </h1>
          <p className="text-sm text-dark-400">
            {isAdminOrManager
              ? 'Relatórios consolidados e individuais por representante.'
              : 'Seus relatórios de comissões e vendas.'}
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 border-b border-dark-800 pb-0">
          <button
            onClick={() => setTab('commissions')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === 'commissions'
                ? 'bg-dark-800 text-primary-300 border border-dark-700 border-b-transparent -mb-px'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Comissões
          </button>
          <button
            onClick={() => setTab('sales')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === 'sales'
                ? 'bg-dark-800 text-primary-300 border border-dark-700 border-b-transparent -mb-px'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Vendas
          </button>
        </div>

        {/* ── Filtros ── */}
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4 text-sm text-dark-300 font-medium">
            <Filter className="w-4 h-4" />
            Filtros
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

            {/* Período de */}
            <div>
              <label className="block text-xs text-dark-400 mb-1">Data de</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 text-white text-sm rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Período até */}
            <div>
              <label className="block text-xs text-dark-400 mb-1">Data até</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 text-white text-sm rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Status — varia por tab */}
            <div className="relative">
              <label className="block text-xs text-dark-400 mb-1">Status</label>
              {tab === 'commissions' ? (
                <>
                  <select
                    value={commStatus}
                    onChange={(e) => setCommStatus(e.target.value)}
                    className="appearance-none w-full bg-dark-800 border border-dark-700 text-white text-sm rounded-lg py-2 pl-3 pr-8 outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Todos</option>
                    <option value="pendente">Pendente</option>
                    <option value="paga">Paga</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-dark-400 absolute right-2 top-8 pointer-events-none" />
                </>
              ) : (
                <>
                  <select
                    value={salesStatus}
                    onChange={(e) => setSalesStatus(e.target.value)}
                    className="appearance-none w-full bg-dark-800 border border-dark-700 text-white text-sm rounded-lg py-2 pl-3 pr-8 outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Todos</option>
                    <option value="pendente">Pendente</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="pago">Pago</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="faturado">Faturado</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-dark-400 absolute right-2 top-8 pointer-events-none" />
                </>
              )}
            </div>

            {/* Representante (admin/manager) */}
            {isAdminOrManager && (
              <div className="relative">
                <label className="block text-xs text-dark-400 mb-1">Representante</label>
                <select
                  value={repId}
                  onChange={(e) => setRepId(e.target.value)}
                  className="appearance-none w-full bg-dark-800 border border-dark-700 text-white text-sm rounded-lg py-2 pl-3 pr-8 outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos</option>
                  {repList.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-dark-400 absolute right-2 top-8 pointer-events-none" />
              </div>
            )}

            {/* Aplicar */}
            <div className="flex items-end">
              <button
                onClick={handleApply}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Buscando...' : 'Aplicar'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Erro ── */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ── Ações de exportação ── */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading || loading}
            className="flex items-center gap-2 min-h-[44px] px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-primary-500/50 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {pdfLoading
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4 text-primary-400" />}
            {pdfLoading ? 'Gerando PDF...' : 'Baixar PDF'}
          </button>

          <button
              onClick={handleCopyWhatsApp}
              disabled={waLoading || loading}
              className="flex items-center gap-2 min-h-[44px] px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-green-500/50 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {waLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : waCopied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <MessageSquare className="w-4 h-4 text-green-400" />
              )}
              {waLoading ? 'Gerando...' : waCopied ? 'Copiado!' : 'Copiar resumo WhatsApp'}
            </button>
        </div>

        {/* ── Conteúdo: Relatório de Comissões ── */}
        {tab === 'commissions' && (
          <>
            {/* Summary cards */}
            {commReport && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <SummaryCard label="Total registros"  value={String(commReport.summary.total_items)} />
                <SummaryCard label="Total geral"      value={fmtBRL(commReport.summary.total_amount)}    color="text-white" />
                <SummaryCard label="Pendente"         value={fmtBRL(commReport.summary.total_pendente)}  color="text-yellow-300" />
                <SummaryCard label="Paga"             value={fmtBRL(commReport.summary.total_paga)}      color="text-green-300" />
                <SummaryCard label="Cancelada"        value={fmtBRL(commReport.summary.total_cancelada)} color="text-red-300" />
              </div>
            )}

            {/* Tabela */}
            {loading ? (
              <div className="text-center py-12 text-dark-400 text-sm">Carregando...</div>
            ) : !commReport || commReport.items.length === 0 ? (
              <div className="text-center py-12 text-dark-400 text-sm">
                Nenhuma comissão encontrada para os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-dark-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-800 text-dark-400 text-xs uppercase">
                      {isAdminOrManager && <th className="px-4 py-3 text-left">Representante</th>}
                      <th className="px-4 py-3 text-left">Produto</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-right">Qtd</th>
                      <th className="px-4 py-3 text-right">% Com.</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                      <th className="px-4 py-3 text-left">Data</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commReport.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-dark-800/50 hover:bg-dark-800/40 transition-colors"
                      >
                        {isAdminOrManager && (
                          <td className="px-4 py-3 text-white">{item.rep_name || '—'}</td>
                        )}
                        <td className="px-4 py-3 text-white">{item.product_name || '—'}</td>
                        <td className="px-4 py-3 text-dark-300">{item.client_name || '—'}</td>
                        <td className="px-4 py-3 text-right text-dark-300">{item.qty ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-dark-300">
                          {item.rep_commission_pct ? `${item.rep_commission_pct}%` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-white">
                          {fmtBRL(item.amount)}
                        </td>
                        <td className="px-4 py-3 text-dark-300">{fmtDate(item.order_date)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${COMM_STATUS_COLORS[item.status] ?? ''}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Conteúdo: Relatório de Vendas ── */}
        {tab === 'sales' && (
          <>
            {/* Summary cards */}
            {salesReport && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <SummaryCard label="Total pedidos"   value={String(salesReport.summary.total_orders)} />
                <SummaryCard label="Receita total"   value={fmtBRL(salesReport.summary.total_revenue)}   color="text-white" />
                <SummaryCard label="Pago"            value={fmtBRL(salesReport.summary.total_pago)}       color="text-green-300" />
                <SummaryCard label="Pendente"        value={fmtBRL(salesReport.summary.total_pendente)}   color="text-yellow-300" />
                <SummaryCard label="Cancelado"       value={fmtBRL(salesReport.summary.total_cancelado)}  color="text-red-300" />
              </div>
            )}

            {/* Tabela consolidada por representante (admin/manager) */}
            {isAdminOrManager && salesReport?.by_representative && salesReport.by_representative.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-dark-300 mb-2">Por representante</h2>
                <div className="overflow-x-auto rounded-xl border border-dark-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-800 text-dark-400 text-xs uppercase">
                        <th className="px-4 py-3 text-left">Representante</th>
                        <th className="px-4 py-3 text-right">Pedidos</th>
                        <th className="px-4 py-3 text-right">Receita total</th>
                        <th className="px-4 py-3 text-right">Total pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesReport.by_representative.map((r) => (
                        <tr key={r.rep_id} className="border-b border-dark-800/50 hover:bg-dark-800/40 transition-colors">
                          <td className="px-4 py-3 text-white font-medium">{r.rep_name}</td>
                          <td className="px-4 py-3 text-right text-dark-300">{r.total_orders}</td>
                          <td className="px-4 py-3 text-right text-white">{fmtBRL(r.total_revenue)}</td>
                          <td className="px-4 py-3 text-right text-green-300">{fmtBRL(r.total_pago)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tabela de pedidos individuais */}
            {loading ? (
              <div className="text-center py-12 text-dark-400 text-sm">Carregando...</div>
            ) : !salesReport || salesReport.items.length === 0 ? (
              <div className="text-center py-12 text-dark-400 text-sm">
                Nenhum pedido encontrado para os filtros selecionados.
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-semibold text-dark-300 mb-2">Pedidos</h2>
                <div className="overflow-x-auto rounded-xl border border-dark-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-800 text-dark-400 text-xs uppercase">
                        <th className="px-4 py-3 text-left">Nº</th>
                        <th className="px-4 py-3 text-left">Data</th>
                        {isAdminOrManager && <th className="px-4 py-3 text-left">Representante</th>}
                        <th className="px-4 py-3 text-left">Cliente</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesReport.items.map((o) => (
                        <tr
                          key={o.id}
                          className="border-b border-dark-800/50 hover:bg-dark-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 text-dark-300 font-mono">
                            {o.order_number ? `#${o.order_number}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-dark-300">{fmtDate(o.date)}</td>
                          {isAdminOrManager && (
                            <td className="px-4 py-3 text-white">{o.rep_name || '—'}</td>
                          )}
                          <td className="px-4 py-3 text-white">{o.clients?.name || '—'}</td>
                          <td className="px-4 py-3 text-right font-medium text-white">
                            {fmtBRL(o.total)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${SALES_STATUS_COLORS[o.status] ?? ''}`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Rodapé com data de geração ── */}
        {(commReport || salesReport) && !loading && (
          <p className="text-xs text-dark-500 text-right">
            Gerado em:{' '}
            {fmtDate(
              tab === 'commissions'
                ? commReport?.generated_at
                : salesReport?.generated_at
            )}
          </p>
        )}

      </div>
    </DashboardShell>
  );
}
