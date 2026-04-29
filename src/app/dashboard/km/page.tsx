'use client';
// src/app/dashboard/km/page.tsx
// Lote: L040.1 — Controle de KM
//
// AI-CONTEXT: Segue padrão de responsividade de docs/ui/responsividade.md:
//   - mobile (<768px): cards individuais, formulário coluna única, botões min-h-[44px]
//   - desktop (≥1024px): tabela completa, sidebar funcional
//   - sem overflow horizontal em 375px
//
// AI-RULE: Filtro por representante visível apenas para admin/manager.
//          Representative sempre vê apenas seus próprios registros (filtro na API).
// DEPENDE DE: apiFetch (src/lib/apiFetch.ts) para requisições autenticadas.
// DEPENDE DE: authStore (src/store/authStore.ts) para role e user.

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Save, Loader2, Car } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/apiFetch';
import type { KmLog, KmLogCreatePayload, KmLogUpdatePayload } from '@/types';

// ---------------------------------------------------------------------------
// Tipos locais
// ---------------------------------------------------------------------------
interface Totais {
  percorrido:  number;
  litros:      number;
  combustivel: number;
}

interface FormState {
  data:        string;
  veiculo:     string;
  km_ini:      string;
  km_fim:      string;
  litros:      string;
  combustivel: string;
  obs:         string;
}

const FORM_VAZIO: FormState = {
  data: '', veiculo: '', km_ini: '', km_fim: '',
  litros: '', combustivel: '', obs: '',
};

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
function fmt(n: number | null | undefined, decimais = 1): string {
  if (n == null) return '—';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: decimais, maximumFractionDigits: decimais });
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function KmPage() {
  const { user } = useAuthStore();
  const isAdmin     = user?.role === 'admin';
  const isManager   = user?.role === 'manager';
  const canSeeTodos = isAdmin || isManager;

  // Estado de listagem
  const [kmLogs, setKmLogs]     = useState<KmLog[]>([]);
  const [totais, setTotais]     = useState<Totais>({ percorrido: 0, litros: 0, combustivel: 0 });
  const [loading, setLoading]   = useState(false);
  const [erro, setErro]         = useState<string | null>(null);

  // Filtros
  const hoje = new Date().toISOString().slice(0, 10);
  const [from, setFrom]                 = useState('');
  const [to, setTo]                     = useState(hoje);
  const [filtroUserId, setFiltroUserId] = useState('');

  // Modal / formulário
  const [modalAberto, setModalAberto]         = useState(false);
  const [editando, setEditando]               = useState<KmLog | null>(null);
  const [form, setForm]                       = useState<FormState>(FORM_VAZIO);
  const [salvando, setSalvando]               = useState(false);
  const [erroForm, setErroForm]               = useState<string | null>(null);

  // Pré-visualização de percorrido no formulário
  const prevPercorrido = (() => {
    const ini = parseFloat(form.km_ini);
    const fim = parseFloat(form.km_fim);
    if (!isNaN(ini) && !isNaN(fim) && fim >= ini) return fim - ini;
    return null;
  })();

  // -------------------------------------------------------------------------
  // Carregar registros
  // -------------------------------------------------------------------------
  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const params = new URLSearchParams();
      if (from)          params.set('from', from);
      if (to)            params.set('to', to);
      if (filtroUserId)  params.set('user_id', filtroUserId);

      const res = await apiFetch(`/api/km-logs?${params.toString()}`);
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao carregar KM.');
      const json = await res.json();
      setKmLogs(json.km_logs ?? []);
      setTotais({
        percorrido:  json.total_percorrido  ?? 0,
        litros:      json.total_litros      ?? 0,
        combustivel: json.total_combustivel ?? 0,
      });
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }, [from, to, filtroUserId]);

  useEffect(() => { carregar(); }, [carregar]);

  // -------------------------------------------------------------------------
  // Abrir modal (novo ou editar)
  // -------------------------------------------------------------------------
  function abrirNovo() {
    setEditando(null);
    setForm({ ...FORM_VAZIO, data: hoje });
    setErroForm(null);
    setModalAberto(true);
  }

  function abrirEdicao(log: KmLog) {
    setEditando(log);
    setForm({
      data:        log.data,
      veiculo:     log.veiculo,
      km_ini:      String(log.km_ini),
      km_fim:      String(log.km_fim),
      litros:      log.litros      != null ? String(log.litros)      : '',
      combustivel: log.combustivel != null ? String(log.combustivel) : '',
      obs:         log.obs ?? '',
    });
    setErroForm(null);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditando(null);
    setForm(FORM_VAZIO);
    setErroForm(null);
  }

  // -------------------------------------------------------------------------
  // Salvar (criar ou atualizar)
  // -------------------------------------------------------------------------
  async function salvar() {
    setErroForm(null);
    const km_ini = parseFloat(form.km_ini);
    const km_fim = parseFloat(form.km_fim);

    if (!form.data || !form.veiculo.trim() || isNaN(km_ini) || isNaN(km_fim)) {
      setErroForm('Preencha data, veículo, KM inicial e KM final.');
      return;
    }
    if (km_fim < km_ini) {
      setErroForm('KM final não pode ser menor que KM inicial.');
      return;
    }

    setSalvando(true);
    try {
      if (editando) {
        // PUT
        const payload: KmLogUpdatePayload = {
          data:        form.data,
          veiculo:     form.veiculo.trim(),
          km_ini,
          km_fim,
          litros:      form.litros      ? parseFloat(form.litros)      : null,
          combustivel: form.combustivel ? parseFloat(form.combustivel) : null,
          obs:         form.obs.trim()  || null,
        };
        const res = await apiFetch(`/api/km-logs/${editando.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao atualizar.');
      } else {
        // POST
        const payload: KmLogCreatePayload = {
          data:    form.data,
          veiculo: form.veiculo.trim(),
          km_ini,
          km_fim,
          ...(form.litros      && { litros:      parseFloat(form.litros) }),
          ...(form.combustivel && { combustivel: parseFloat(form.combustivel) }),
          ...(form.obs.trim()  && { obs:         form.obs.trim() }),
        };
        const res = await apiFetch('/api/km-logs', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao criar.');
      }
      fecharModal();
      carregar();
    } catch (e: unknown) {
      setErroForm(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  // -------------------------------------------------------------------------
  // Remover (soft delete)
  // -------------------------------------------------------------------------
  async function remover(id: string) {
    if (!confirm('Remover este registro de KM?')) return;
    try {
      const res = await apiFetch(`/api/km-logs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao remover.');
      carregar();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao remover.');
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Car className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-800">Controle de KM</h1>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white
                     px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Novo Registro
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">De</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Até</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {/* AI-RULE: filtro por representante só para admin/manager */}
          {canSeeTodos && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ID do Representante</label>
              <input type="text" value={filtroUserId}
                onChange={e => setFiltroUserId(e.target.value)}
                placeholder="UUID do usuário"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          )}
          <div className="flex items-end">
            <button onClick={carregar}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2
                         rounded-lg text-sm font-medium transition-colors min-h-[44px]">
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Cards de totais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'KM Percorrido', valor: `${fmt(totais.percorrido, 1)} km` },
          { label: 'Litros Abastecidos', valor: `${fmt(totais.litros, 2)} L` },
          { label: 'Custo Combustível', valor: totais.combustivel > 0 ? `R$ ${fmt(totais.combustivel, 2)}` : '—' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{card.valor}</p>
          </div>
        ))}
      </div>

      {/* Erro de carregamento */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {erro}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      )}

      {/* Lista vazia */}
      {!loading && kmLogs.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum registro encontrado para o período.</p>
        </div>
      )}

      {/* Cards mobile (< md) */}
      {!loading && kmLogs.length > 0 && (
        <>
          <div className="md:hidden space-y-3">
            {kmLogs.map(log => (
              <div key={log.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{fmtDate(log.data)}</p>
                    <p className="text-sm text-gray-500">{log.veiculo}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => abrirEdicao(log)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => remover(log.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-3">
                  <span className="text-gray-500">KM Ini</span>
                  <span className="text-right font-mono">{fmt(log.km_ini, 0)}</span>
                  <span className="text-gray-500">KM Fim</span>
                  <span className="text-right font-mono">{fmt(log.km_fim, 0)}</span>
                  <span className="text-gray-500 font-medium">Percorrido</span>
                  <span className="text-right font-mono font-semibold text-green-700">{fmt(log.percorrido, 1)} km</span>
                  {log.litros != null && (
                    <>
                      <span className="text-gray-500">Litros</span>
                      <span className="text-right font-mono">{fmt(log.litros, 2)} L</span>
                    </>
                  )}
                  {log.combustivel != null && (
                    <>
                      <span className="text-gray-500">Custo</span>
                      <span className="text-right font-mono">R$ {fmt(log.combustivel, 2)}</span>
                    </>
                  )}
                  {log.obs && (
                    <span className="col-span-2 text-gray-400 text-xs mt-1 italic">{log.obs}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tabela desktop (≥ md) */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Data', 'Veículo', 'KM Ini', 'KM Fim', 'Percorrido', 'Litros', 'Combustível', 'Ações'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {kmLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{fmtDate(log.data)}</td>
                      <td className="px-4 py-3 text-gray-600">{log.veiculo}</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{fmt(log.km_ini, 0)}</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{fmt(log.km_fim, 0)}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-green-700">{fmt(log.percorrido, 1)} km</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{log.litros != null ? `${fmt(log.litros, 2)} L` : '—'}</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{log.combustivel != null ? `R$ ${fmt(log.combustivel, 2)}` : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => abrirEdicao(log)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors min-h-[32px]">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => remover(log.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors min-h-[32px]">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal formulário */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={fecharModal} />

          {/* Painel — coluna única, mobile-first */}
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl
                          w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              {/* Header modal */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-800">
                  {editando ? 'Editar Registro de KM' : 'Novo Registro de KM'}
                </h2>
                <button onClick={fecharModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {erroForm && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm mb-4">
                  {erroForm}
                </div>
              )}

              {/* Campos — coluna única */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                  <input type="date" value={form.data}
                    onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Veículo *</label>
                  <input type="text" value={form.veiculo} placeholder="Ex: ABC-1234"
                    onChange={e => setForm(f => ({ ...f, veiculo: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KM Inicial *</label>
                    <input type="number" value={form.km_ini} placeholder="0"
                      onChange={e => setForm(f => ({ ...f, km_ini: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KM Final *</label>
                    <input type="number" value={form.km_fim} placeholder="0"
                      onChange={e => setForm(f => ({ ...f, km_fim: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>

                {/* Pré-visualização de percorrido */}
                {prevPercorrido != null && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
                    Percorrido estimado: <strong>{fmt(prevPercorrido, 1)} km</strong>
                    <span className="text-xs text-green-500 ml-1">(calculado pelo servidor ao salvar)</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Litros (opcional)</label>
                    <input type="number" value={form.litros} placeholder="0.00" step="0.01"
                      onChange={e => setForm(f => ({ ...f, litros: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Combustível R$ (opcional)</label>
                    <input type="number" value={form.combustivel} placeholder="0.00" step="0.01"
                      onChange={e => setForm(f => ({ ...f, combustivel: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                                 focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea value={form.obs} rows={2} placeholder="Opcional..."
                    onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 mt-6">
                <button onClick={fecharModal}
                  className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50
                             px-4 py-3 rounded-xl font-medium transition-colors min-h-[44px]">
                  Cancelar
                </button>
                <button onClick={salvar} disabled={salvando}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed
                             text-white px-4 py-3 rounded-xl font-medium transition-colors
                             flex items-center justify-center gap-2 min-h-[44px]">
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
