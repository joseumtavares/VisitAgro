'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { apiFetch } from '@/lib/apiFetch';
import { useAuthStore } from '@/store/authStore';
import { TrendingUp, CheckCircle, Clock, XCircle, ChevronDown } from 'lucide-react';

type RepCommissionStatus = 'pendente' | 'paga' | 'cancelada';

interface RepCommission {
  id: string;
  workspace: string;
  rep_id: string | null;
  rep_name: string | null;
  order_id: string | null;
  order_item_id: string | null;
  order_date: string | null;
  client_id: string | null;
  client_name: string | null;
  product_id: string | null;
  product_name: string | null;
  qty: number | null;
  unit_price: number | null;
  rep_commission_pct: number | null;
  amount: number;
  order_total: number | null;
  status: RepCommissionStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<RepCommissionStatus, string> = {
  pendente:  'Pendente',
  paga:      'Paga',
  cancelada: 'Cancelada',
};

const STATUS_COLORS: Record<RepCommissionStatus, string> = {
  pendente:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  paga:      'bg-green-500/15 text-green-300 border-green-500/30',
  cancelada: 'bg-red-500/15 text-red-300 border-red-500/30',
};

function fmtBRL(value: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(value ?? 0);
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

export default function RepCommissionsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const [items, setItems]           = useState<RepCommission[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filterStatus, setFilter]   = useState<RepCommissionStatus | ''>('');
  const [saving, setSaving]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res  = await apiFetch(`/api/rep-commissions${params}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar comissões.');
      setItems(data.rep_commissions ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id: string, status: RepCommissionStatus) => {
    setSaving(id);
    setError('');
    try {
      const res  = await apiFetch(`/api/rep-commissions/${id}`, {
        method: 'PUT',
        body:   JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || 'Erro ao atualizar status.');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  };

  // Totalizadores
  const totalPendente = items
    .filter((i) => i.status === 'pendente')
    .reduce((acc, i) => acc + Number(i.amount), 0);

  const totalPaga = items
    .filter((i) => i.status === 'paga')
    .reduce((acc, i) => acc + Number(i.amount), 0);

  const totalGeral = items.reduce((acc, i) => acc + Number(i.amount), 0);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-400" />
            Comissões de Representantes
          </h1>
          <p className="text-sm text-dark-400">
            {isAdmin
              ? 'Visão geral das comissões geradas por pedido e produto.'
              : 'Suas comissões por produto vendido.'}
          </p>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Total Geral"      value={fmtBRL(totalGeral)}    color="text-white" />
          <SummaryCard label="Pendente"          value={fmtBRL(totalPendente)} color="text-yellow-300" />
          <SummaryCard label="Paga"              value={fmtBRL(totalPaga)}     color="text-green-300" />
        </div>

        {/* Filtro */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-dark-400">Filtrar por status:</label>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilter(e.target.value as RepCommissionStatus | '')}
              className="appearance-none bg-dark-800 border border-dark-700 text-white text-sm rounded-lg py-2 pl-3 pr-8 outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="paga">Paga</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <ChevronDown className="w-4 h-4 text-dark-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-12 text-dark-400 text-sm">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-dark-400 text-sm">
            Nenhuma comissão encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-dark-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-800 text-dark-400 text-xs uppercase">
                  {isAdmin && <th className="px-4 py-3 text-left">Representante</th>}
                  <th className="px-4 py-3 text-left">Produto</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-right">Qtd</th>
                  <th className="px-4 py-3 text-right">% Comissão</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  {isAdmin && <th className="px-4 py-3 text-left">Ação</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-dark-800/50 hover:bg-dark-800/40 transition-colors"
                  >
                    {isAdmin && (
                      <td className="px-4 py-3 text-white">
                        {item.rep_name || '—'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-white">
                      {item.product_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-dark-300">
                      {item.client_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-dark-300">
                      {item.qty ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-dark-300">
                      {item.rep_commission_pct
                        ? `${item.rep_commission_pct}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      {fmtBRL(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-dark-300">
                      {fmtDate(item.order_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[item.status]}`}
                      >
                        {item.status === 'paga'      && <CheckCircle className="w-3 h-3" />}
                        {item.status === 'pendente'  && <Clock        className="w-3 h-3" />}
                        {item.status === 'cancelada' && <XCircle      className="w-3 h-3" />}
                        {STATUS_LABELS[item.status]}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        {item.status === 'pendente' && (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={saving === item.id}
                              onClick={() => changeStatus(item.id, 'paga')}
                              className="text-xs px-3 py-1 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-300 border border-green-500/30 disabled:opacity-40 transition-colors"
                            >
                              {saving === item.id ? '...' : 'Marcar paga'}
                            </button>
                            <button
                              disabled={saving === item.id}
                              onClick={() => changeStatus(item.id, 'cancelada')}
                              className="text-xs px-3 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 disabled:opacity-40 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                        {item.status === 'paga' && (
                          <button
                            disabled={saving === item.id}
                            onClick={() => changeStatus(item.id, 'pendente')}
                            className="text-xs px-3 py-1 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-300 border border-yellow-500/30 disabled:opacity-40 transition-colors"
                          >
                            Reverter
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl p-4">
      <p className="text-xs text-dark-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
