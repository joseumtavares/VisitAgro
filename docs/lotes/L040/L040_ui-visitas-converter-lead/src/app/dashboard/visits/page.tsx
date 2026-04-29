'use client';
/**
 * src/app/dashboard/visits/page.tsx — L040
 *
 * Página de Histórico de Visitas.
 * Consome GET /api/visits e GET /api/clients para exibir nome do cliente.
 *
 * Funcionalidades:
 * - listagem somente leitura de visitas (check-ins e agendamentos);
 * - filtros: status + activity_type;
 * - busca por texto (cliente, observação);
 * - cards mobile + tabela desktop (mobile-first conforme docs/ui/responsividade.md);
 * - hydration guard (padrão Zustand persist do projeto).
 *
 * PRESERVADO: zero alteração de schema, zero alteração de rotas.
 * AI-CONTEXT: lote L040 — UI-only, sem backend novo.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  Search,
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  UserX,
  Calendar,
  MapPin,
  FileText,
} from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import type { Visit } from '@/types';

// ── Tipos locais ──────────────────────────────────────────────────────────────

/** Subconjunto de Client necessário apenas para lookup de nome. */
interface ClientSummary {
  id: string;
  name: string;
}

// ── Constantes de configuração ────────────────────────────────────────────────

/**
 * Rótulos e estilos por status da visita.
 * Alinhados com o CHECK constraint da tabela visits no banco.
 */
const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  agendado: {
    label: 'Agendado',
    cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  realizado: {
    label: 'Realizado',
    cls: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  cancelado: {
    label: 'Cancelado',
    cls: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  nao_compareceu: {
    label: 'Não compareceu',
    cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: <UserX className="w-3.5 h-3.5" />,
  },
};

/**
 * Tipos de atividade válidos — mesmos do banco e do InteractiveMap.
 * AI-RULE: não alterar; deve manter sincronia com visits.activity_type CHECK.
 */
const ACTIVITY_TYPES = ['Visita', 'Ligação', 'WhatsApp', 'Email', 'Reunião'] as const;

/** Ícones decorativos por tipo de atividade. */
const ACTIVITY_ICON: Record<string, string> = {
  Visita: '🚗',
  Ligação: '📞',
  WhatsApp: '💬',
  Email: '✉️',
  Reunião: '🤝',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formata uma data ISO para exibição localizada (pt-BR).
 * Retorna '—' se a data for nula ou inválida.
 */
function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Retorna a configuração de status ou um fallback genérico.
 * Evita crash quando banco retornar status inesperado.
 */
function getStatusCfg(status?: string | null) {
  return (
    STATUS_CFG[status ?? ''] ?? {
      label: status ?? '—',
      cls: 'bg-dark-700 text-dark-300 border-dark-600',
      icon: null,
    }
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

/**
 * VisitsPage — Histórico de Visitas.
 *
 * Carrega visitas via GET /api/visits e clientes via GET /api/clients
 * para exibir o nome do cliente no lugar do client_id.
 *
 * Somente leitura — a criação de visitas ocorre via check-in no mapa
 * (InteractiveMap.tsx) usando POST /api/visits.
 */
export default function VisitsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // ── Hydration guard ──────────────────────────────────────────────────────
  // Necessário porque Zustand persist rehidrata de forma assíncrona,
  // evitando redirecionamento falso para /auth/login no primeiro render.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) router.push('/auth/login');
  }, [hydrated, isAuthenticated, router]);

  // ── Estado ───────────────────────────────────────────────────────────────
  const [visits, setVisits] = useState<Visit[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterActivity, setFilterActivity] = useState<string>('todos');

  // ── Carregamento de dados ─────────────────────────────────────────────────

  /**
   * Carrega visitas e clientes em paralelo.
   * Clientes são necessários apenas para lookup de nome (join client-side).
   * AI-CONTEXT: a API de visitas retorna client_id, não o nome do cliente.
   */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rv, rc] = await Promise.all([
        apiFetch('/api/visits').then(r => r.json()),
        apiFetch('/api/clients').then(r => r.json()),
      ]);
      setVisits(rv.visits ?? []);
      setClients(rc.clients ?? []);
    } catch {
      // Erros de rede são silenciosos aqui; a UI exibirá lista vazia
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Lookup de nome do cliente ─────────────────────────────────────────────

  /**
   * Retorna o nome do cliente pelo client_id.
   * Fallback '—' quando o cliente não for encontrado (ex: soft-deleted).
   */
  const clientName = (id?: string | null): string =>
    clients.find(c => c.id === id)?.name ?? '—';

  // ── Filtragem ─────────────────────────────────────────────────────────────

  const filtered = visits.filter(v => {
    const q = search.toLowerCase();
    const nameMatch = clientName(v.client_id).toLowerCase().includes(q);
    const obsMatch  = (v.obs ?? '').toLowerCase().includes(q);
    const textMatch = nameMatch || obsMatch;
    const statusMatch   = filterStatus === 'todos'   || v.status        === filterStatus;
    const activityMatch = filterActivity === 'todos' || v.activity_type === filterActivity;
    return textMatch && statusMatch && activityMatch;
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardShell>
      <div className="space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Histórico de Visitas</h1>
            <p className="text-dark-400 text-sm mt-1">
              {loading ? 'Carregando...' : `${visits.length} registro${visits.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {/* Link para acesso rápido ao mapa (check-in ocorre lá) */}
          <a
            href="/dashboard/map"
            className="
              inline-flex items-center gap-2
              bg-dark-700 hover:bg-dark-600
              text-dark-300 hover:text-white
              px-4 py-2 rounded-lg text-sm font-medium
              transition-colors border border-dark-600
              min-h-[44px]
            "
          >
            <MapPin className="w-4 h-4" />
            Ir para o Mapa
          </a>
        </div>

        {/* ── Filtros ──────────────────────────────────────────────────────── */}
        {/*
          Mobile-first: coluna única, depois flex-row no sm.
          Selects com w-full no mobile para não gerar overflow horizontal.
        */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Busca por texto */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-dark-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por cliente ou observação..."
              className="
                w-full bg-dark-800 border border-dark-700 rounded-lg
                py-2 pl-9 pr-4 text-white text-sm outline-none
                focus:ring-2 focus:ring-primary-500
              "
            />
          </div>

          {/* Filtro de status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="
              w-full sm:w-auto bg-dark-800 border border-dark-700
              rounded-lg px-3 py-2 text-white text-sm outline-none
              focus:ring-2 focus:ring-primary-500
            "
          >
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {/* Filtro de tipo de atividade */}
          <select
            value={filterActivity}
            onChange={e => setFilterActivity(e.target.value)}
            className="
              w-full sm:w-auto bg-dark-800 border border-dark-700
              rounded-lg px-3 py-2 text-white text-sm outline-none
              focus:ring-2 focus:ring-primary-500
            "
          >
            <option value="todos">Todas as atividades</option>
            {ACTIVITY_TYPES.map(a => (
              <option key={a} value={a}>
                {ACTIVITY_ICON[a]} {a}
              </option>
            ))}
          </select>
        </div>

        {/* ── Lista ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="text-center py-12 text-dark-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma visita encontrada</p>
            <p className="text-xs mt-2 text-dark-500">
              Use o check-in no mapa para registrar visitas.
            </p>
          </div>
        ) : (
          <>
            {/*
              ── Cards mobile (< sm) ──────────────────────────────────────────
              Obrigatório para 5+ colunas na tabela (docs/ui/responsividade.md).
              Visíveis apenas em telas menores que 640px.
            */}
            <div className="sm:hidden space-y-3">
              {filtered.map(visit => {
                const cfg  = getStatusCfg(visit.status);
                const icon = ACTIVITY_ICON[visit.activity_type ?? ''] ?? '📋';
                return (
                  <div
                    key={visit.id}
                    className="bg-dark-800 rounded-xl border border-dark-700 p-4 space-y-3"
                  >
                    {/* Linha 1: nome do cliente + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-white text-sm leading-tight">
                        {clientName(visit.client_id)}
                      </div>
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-0.5
                        rounded-full text-xs font-medium border shrink-0
                        ${cfg.cls}
                      `}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>

                    {/* Linha 2: atividade + data */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dark-400">
                      <span>{icon} {visit.activity_type ?? '—'}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(visit.visit_date ?? visit.scheduled_date)}
                      </span>
                    </div>

                    {/* Linha 3: observação (se existir) */}
                    {visit.obs && (
                      <p className="text-xs text-dark-300 italic line-clamp-2">
                        {visit.obs}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/*
              ── Tabela desktop (≥ sm) ────────────────────────────────────────
              Oculta no mobile. Scroll horizontal controlado pelo overflow-x-auto.
            */}
            <div className="hidden sm:block bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700 text-dark-400 text-xs uppercase">
                      <th className="text-left px-4 py-3">Cliente</th>
                      <th className="text-left px-4 py-3">Atividade</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Data</th>
                      <th className="text-left px-4 py-3">Agendamento</th>
                      <th className="text-left px-4 py-3">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {filtered.map(visit => {
                      const cfg  = getStatusCfg(visit.status);
                      const icon = ACTIVITY_ICON[visit.activity_type ?? ''] ?? '📋';
                      return (
                        <tr
                          key={visit.id}
                          className="hover:bg-dark-700/30 transition-colors"
                        >
                          {/* Cliente */}
                          <td className="px-4 py-3">
                            <div className="text-white text-sm font-medium">
                              {clientName(visit.client_id)}
                            </div>
                          </td>

                          {/* Atividade */}
                          <td className="px-4 py-3">
                            <span className="text-dark-300 text-sm">
                              {icon} {visit.activity_type ?? '—'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span className={`
                              inline-flex items-center gap-1 px-2 py-0.5
                              rounded-full text-xs font-medium border
                              ${cfg.cls}
                            `}>
                              {cfg.icon}
                              {cfg.label}
                            </span>
                          </td>

                          {/* Data de realização */}
                          <td className="px-4 py-3 text-dark-300 text-sm">
                            {fmtDate(visit.visit_date)}
                          </td>

                          {/* Data agendada */}
                          <td className="px-4 py-3 text-dark-300 text-sm">
                            {fmtDate(visit.scheduled_date)}
                          </td>

                          {/* Observação */}
                          <td className="px-4 py-3">
                            {visit.obs ? (
                              <span className="flex items-center gap-1 text-xs text-dark-400 max-w-[200px] truncate">
                                <FileText className="w-3 h-3 shrink-0" />
                                {visit.obs}
                              </span>
                            ) : (
                              <span className="text-dark-600 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
