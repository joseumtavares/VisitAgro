'use client';
// L038: cards mobile adicionados para a tabela de 7 colunas;
//       selects de filtro com w-full no mobile; botões com min-h-[44px].
//       Toda lógica (MapParamsReader, FASE A/B, geoSearch, CRUD) preservada.
// L040: botão "Converter em Cliente" adicionado (POST /api/pre-registrations/[id]/convert).
//       Modal de confirmação + toast + reload após conversão.
//       Nenhuma lógica anterior alterada.
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import {
  Plus, Search, Pencil, Trash2, Phone, Mail,
  MapPin, ExternalLink, UserCheck, Navigation, UserPlus,
} from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import type { PreRegistration, PreRegistrationStatus, Referral } from '@/types';

// ── Constants ────────────────────────────────────────────────

const STATUS_LABELS: Record<PreRegistrationStatus, string> = {
  novo:        'Novo',
  contatado:   'Contatado',
  qualificado: 'Qualificado',
  convertido:  'Convertido',
  perdido:     'Perdido',
};

const STATUS_BADGE: Record<PreRegistrationStatus, string> = {
  novo:        'bg-blue-500/20 text-blue-400 border-blue-500/30',
  contatado:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  qualificado: 'bg-green-500/20 text-green-400 border-green-500/30',
  convertido:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  perdido:     'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const SOURCE_LABELS: Record<string, string> = {
  manual:      'Manual',
  site:        'Site',
  indicacao:   'Indicação',
  whatsapp:    'WhatsApp',
  instagram:   'Instagram',
  facebook:    'Facebook',
  feira:       'Feira',
  outro:       'Outro',
};

const EMPTY: Partial<PreRegistration> = {
  name: '', tel: '', email: '', interest: '',
  source: 'manual', status: 'novo', obs: '',
  referral_id: null, maps_link: '', lat: null, lng: null, point_reference: '',
};

// ── FASE B: Leitor de params da URL ─────────────────────────
// Componente separado para satisfazer o requisito de Suspense do Next.js
// com useSearchParams. Não renderiza nada, apenas chama o callback.
function MapParamsReader({
  onParams,
  onEditRequest,
}: {
  onParams: (lat: number, lng: number, mapsLink: string) => void;
  onEditRequest: (id: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const mapsLink = searchParams.get('maps_link') ?? '';

    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        onParams(latNum, lngNum, mapsLink);
      }
    }

    const editId = searchParams.get('edit');
    if (editId) {
      onEditRequest(editId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

// ── Component ────────────────────────────────────────────────

/**
 * PreRegistrationsPage — Pré-cadastros / Leads.
 *
 * L040: adicionado botão "Converter em Cliente" que chama
 * POST /api/pre-registrations/[id]/convert.
 * O botão é exibido apenas quando lead.status !== 'convertido'.
 *
 * AI-RULE: não alterar fluxo MapParamsReader (FASE A/B) nem CRUD existente.
 */
export default function PreRegistrationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, hydrated, router]);

  const [leads, setLeads] = useState<PreRegistration[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PreRegistrationStatus | 'todos'>('todos');
  const [filterSource, setFilterSource] = useState('todos');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PreRegistration | null>(null);
  const [form, setForm] = useState<Partial<PreRegistration>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // ── L040: estado do modal de conversão ──────────────────────
  const [convertTarget, setConvertTarget] = useState<PreRegistration | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertToast, setConvertToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  /**
   * Exibe um toast temporário de resultado da conversão.
   * Remove automaticamente após 3,5 s.
   */
  const showConvertToast = (msg: string, type: 'success' | 'error') => {
    setConvertToast({ msg, type });
    setTimeout(() => setConvertToast(null), 3500);
  };

  // ── Data loading ──────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch('/api/pre-registrations');
    const j = await r.json();
    setLeads(j.pre_registrations ?? []);
    setLoading(false);
  }, []);

  const loadReferrals = useCallback(async () => {
    const r = await apiFetch('/api/referrals');
    const j = await r.json();
    setReferrals(j.referrals ?? []);
  }, []);

  useEffect(() => { load(); loadReferrals(); }, [load, loadReferrals]);

  // ── Modal helpers ─────────────────────────────────────────

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setGeoError('');
    setShowModal(true);
  };

  const openEdit = useCallback((lead: PreRegistration) => {
    setEditing(lead);
    setForm({ ...lead });
    setError('');
    setGeoError('');
    setShowModal(true);
  }, []);

  const f = (k: keyof PreRegistration, v: any) =>
    setForm(p => ({ ...p, [k]: v }));

  // ── FASE B: Callback para quando params de mapa chegam ────
  const handleMapParams = useCallback((lat: number, lng: number, mapsLink: string) => {
    setEditing(null);
    setForm({
      ...EMPTY,
      lat,
      lng,
      maps_link: mapsLink || `https://www.google.com/maps?q=${lat},${lng}`,
      source: 'manual',
    });
    setError('');
    setGeoError('');
    setShowModal(true);
  }, []);

  // ── FASE A: Callback para edição via popup do mapa ────────
  const handleEditRequest = useCallback((id: string) => {
    const tryOpen = (retries = 0) => {
      setLeads(current => {
        const found = current.find(l => l.id === id);
        if (found) {
          openEdit(found);
        } else if (retries < 5) {
          setTimeout(() => tryOpen(retries + 1), 300);
        }
        return current;
      });
    };
    tryOpen();
  }, [openEdit]);

  // ── GPS via Nominatim ──────────────────────────────────────

  const geoSearch = async (query: string) => {
    if (!query || query.length < 3) return;
    setGeoLoading(true);
    setGeoError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'pt-BR,pt' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const r = data[0];
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        setForm(prev => ({
          ...prev,
          lat,
          lng,
          maps_link: `https://www.google.com/maps?q=${lat},${lng}`,
        }));
      } else {
        setGeoError('Endereço não encontrado. Tente ser mais específico.');
      }
    } catch {
      setGeoError('Erro ao buscar endereço.');
    } finally {
      setGeoLoading(false);
    }
  };

  const useCurrentGps = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalização não suportada neste dispositivo.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm(prev => ({
          ...prev,
          lat,
          lng,
          maps_link: `https://www.google.com/maps?q=${lat},${lng}`,
        }));
        setGeoLoading(false);
      },
      err => {
        console.warn('[pre-registrations] GPS error', err);
        setGeoError('Não foi possível obter sua localização atual.');
        setGeoLoading(false);
      }
    );
  };

  // ── CRUD ──────────────────────────────────────────────────

  const save = async () => {
    if (!form.name?.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/pre-registrations/${editing.id}` : '/api/pre-registrations';
      const method = editing ? 'PUT' : 'POST';
      const r = await apiFetch(url, { method, body: JSON.stringify(form) });
      if (!r.ok) { const j = await r.json(); throw new Error(j.error); }
      await load();
      setShowModal(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este pré-cadastro?')) return;
    const r = await apiFetch(`/api/pre-registrations/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Erro ao remover pré-cadastro.');
      return;
    }
    await load();
  };

  // ── L040: Conversão de lead em cliente ────────────────────

  /**
   * Executa POST /api/pre-registrations/[id]/convert.
   * A API cria o cliente, atualiza o lead para status 'convertido'
   * e retorna os dados do cliente criado.
   *
   * CRITICAL: não alterar o payload enviado sem verificar a rota de conversão,
   * que espera apenas { additional_data: {} }.
   */
  const handleConvert = async () => {
    if (!convertTarget) return;
    setConverting(true);
    try {
      const r = await apiFetch(
        `/api/pre-registrations/${convertTarget.id}/convert`,
        { method: 'POST', body: JSON.stringify({ additional_data: {} }) }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erro ao converter lead.');
      const targetName = convertTarget.name;
      setConvertTarget(null);
      await load();
      showConvertToast(`✅ "${targetName}" convertido em cliente!`, 'success');
    } catch (e: any) {
      showConvertToast('❌ ' + (e.message || 'Erro ao converter.'), 'error');
    } finally {
      setConverting(false);
    }
  };

  // ── Filtering ─────────────────────────────────────────────

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch =
      l.name.toLowerCase().includes(q) ||
      (l.tel ?? '').includes(q) ||
      (l.email ?? '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'todos' || l.status === filterStatus;
    const matchSource = filterSource === 'todos' || l.source === filterSource;
    return matchSearch && matchStatus && matchSource;
  });

  // ── Referral lookup ───────────────────────────────────────

  const refName = (id?: string | null) =>
    referrals.find(r => r.id === id)?.name ?? '—';

  // ── Render ────────────────────────────────────────────────

  return (
    <DashboardShell>
      {/* FASE A + B: Leitor de params da URL (Suspense obrigatório no Next.js 14) */}
      <Suspense fallback={null}>
        <MapParamsReader
          onParams={handleMapParams}
          onEditRequest={handleEditRequest}
        />
      </Suspense>

      {/* ── L040: Toast de conversão ──────────────────────────────────── */}
      {convertToast && (
        <div
          className={`
            fixed top-4 left-1/2 -translate-x-1/2 z-[9999]
            px-5 py-3 rounded-xl border text-white text-sm font-medium
            shadow-lg whitespace-nowrap max-w-[92vw]
            ${convertToast.type === 'success'
              ? 'bg-green-900/90 border-green-600'
              : 'bg-red-900/90 border-red-600'
            }
          `}
        >
          {convertToast.msg}
        </div>
      )}

      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Pré-cadastros / Leads</h1>
            <p className="text-dark-400 text-sm mt-1">{leads.length} registros</p>
          </div>
          {/* L038: botões com min-h-[44px] */}
          <div className="flex items-center gap-2">
            <a
              href="/dashboard/map"
              className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-dark-600 min-h-[44px]"
            >
              <MapPin className="w-4 h-4" />
              Ver no mapa
            </a>
            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
            >
              <Plus className="w-4 h-4" />Novo Lead
            </button>
          </div>
        </div>

        {/* Filtros — L038: selects com w-full no mobile */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-dark-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar nome, telefone ou email..."
              className="w-full bg-dark-800 border border-dark-700 rounded-lg py-2 pl-9 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {/* L038: w-full sm:w-auto para não quebrar no mobile */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="w-full sm:w-auto bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="todos">Todos os status</option>
            {(Object.keys(STATUS_LABELS) as PreRegistrationStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="w-full sm:w-auto bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="todos">Todas as origens</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12 text-dark-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <p>Nenhum pré-cadastro encontrado</p>
            <button onClick={openNew} className="mt-3 text-primary-400 hover:text-primary-300 text-sm">
              + Cadastrar primeiro lead
            </button>
          </div>
        ) : (
          <>
            {/* L038: Cards mobile */}
            <div className="sm:hidden space-y-3">
              {filtered.map(lead => (
                <div key={lead.id} className="bg-dark-800 rounded-xl border border-dark-700 p-4 space-y-3">
                  {/* Nome + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-white font-medium text-sm">{lead.name}</div>
                      <div className="text-dark-500 text-xs mt-0.5">
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '—'}
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </div>

                  {/* Contato */}
                  {(lead.tel || lead.email) && (
                    <div className="space-y-0.5">
                      {lead.tel && (
                        <a href={`tel:${lead.tel}`} className="flex items-center gap-1 text-xs text-dark-300 hover:text-white">
                          <Phone className="w-3 h-3 shrink-0" />{lead.tel}
                        </a>
                      )}
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-dark-300 hover:text-white truncate">
                          <Mail className="w-3 h-3 shrink-0" />{lead.email}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Origem + Indicador + Interesse */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dark-400">
                    <span>{SOURCE_LABELS[lead.source ?? ''] ?? lead.source ?? '—'}</span>
                    {lead.referral_id && (
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />{refName(lead.referral_id)}
                      </span>
                    )}
                    {lead.interest && (
                      <span className="text-dark-500 truncate max-w-[140px]">{lead.interest}</span>
                    )}
                  </div>

                  {/* Localização */}
                  {(lead.maps_link || (lead.lat && lead.lng)) && (
                    <a
                      href={lead.maps_link ?? `https://www.google.com/maps?q=${lead.lat},${lead.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                      <MapPin className="w-3 h-3" />Ver no mapa<ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {/* L040: botão Converter + L038: min-h-[44px] */}
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {lead.status !== 'convertido' && (
                      <button
                        onClick={() => setConvertTarget(lead)}
                        className="flex-1 flex items-center justify-center gap-1 min-h-[44px] bg-primary-600/20 hover:bg-primary-600/40 text-primary-400 text-xs rounded-lg transition-colors border border-primary-600/30"
                      >
                        <UserPlus className="w-3.5 h-3.5" />Converter
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(lead)}
                      className="flex-1 flex items-center justify-center gap-1 min-h-[44px] bg-dark-700 hover:bg-dark-600 text-white text-xs rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />Editar
                    </button>
                    <button
                      onClick={() => remove(lead.id)}
                      className="flex-1 flex items-center justify-center gap-1 min-h-[44px] bg-dark-700 hover:bg-red-900/40 text-dark-400 hover:text-red-400 text-xs rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* L038: Tabela desktop — oculta no mobile */}
            <div className="hidden sm:block bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700 text-dark-400 text-xs uppercase">
                      <th className="text-left px-4 py-3">Nome</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Contato</th>
                      <th className="text-left px-4 py-3">Origem / Indicador</th>
                      <th className="text-left px-4 py-3">Interesse</th>
                      <th className="text-left px-4 py-3">Localização</th>
                      <th className="text-right px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {filtered.map(lead => (
                      <tr key={lead.id} className="hover:bg-dark-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium text-sm">{lead.name}</div>
                          <div className="text-dark-500 text-xs mt-0.5">
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[lead.status]}`}>
                            {STATUS_LABELS[lead.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {lead.tel && (
                              <a href={`tel:${lead.tel}`} className="flex items-center gap-1 text-xs text-dark-300 hover:text-white">
                                <Phone className="w-3 h-3" />{lead.tel}
                              </a>
                            )}
                            {lead.email && (
                              <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-dark-300 hover:text-white truncate max-w-[160px]">
                                <Mail className="w-3 h-3" />{lead.email}
                              </a>
                            )}
                            {!lead.tel && !lead.email && <span className="text-dark-600 text-xs">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-dark-300">{SOURCE_LABELS[lead.source ?? ''] ?? lead.source ?? '—'}</div>
                          {lead.referral_id && (
                            <div className="flex items-center gap-1 text-xs text-dark-400 mt-0.5">
                              <UserCheck className="w-3 h-3" />{refName(lead.referral_id)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-dark-300 max-w-[120px] truncate">{lead.interest || '—'}</div>
                        </td>
                        <td className="px-4 py-3">
                          {(lead.maps_link || (lead.lat && lead.lng)) ? (
                            <a
                              href={lead.maps_link ?? `https://www.google.com/maps?q=${lead.lat},${lead.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                            >
                              <MapPin className="w-3 h-3" />Ver no mapa<ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-dark-600 text-xs">—</span>
                          )}
                          {lead.point_reference && (
                            <div className="text-xs text-dark-500 mt-0.5 max-w-[120px] truncate">{lead.point_reference}</div>
                          )}
                        </td>
                        {/* L040: ações incluem botão "Converter em Cliente" */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {lead.status !== 'convertido' && (
                              <button
                                onClick={() => setConvertTarget(lead)}
                                title="Converter em Cliente"
                                className="text-primary-400 hover:text-primary-300 p-1.5 rounded hover:bg-primary-600/20 transition-colors"
                              >
                                <UserPlus className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(lead)}
                              className="text-dark-400 hover:text-white p-1.5 rounded hover:bg-dark-700 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => remove(lead.id)}
                              className="text-dark-400 hover:text-red-400 p-1.5 rounded hover:bg-dark-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </div>

      {/* ── L040: Modal de confirmação de conversão ──────────────────────── */}
      {/*
        CRITICAL: a API de conversão cria o cliente e atualiza o lead
        para status 'convertido'. Não revert automático disponível.
      */}
      {convertTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">Converter em Cliente</h2>
                <p className="text-dark-400 text-xs mt-0.5">Esta ação não pode ser desfeita facilmente.</p>
              </div>
            </div>

            <p className="text-dark-300 text-sm">
              O lead{' '}
              <span className="text-white font-medium">"{convertTarget.name}"</span>{' '}
              será convertido em cliente com os dados existentes.
              O status mudará para{' '}
              <span className="text-purple-400 font-medium">Convertido</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={() => setConvertTarget(null)}
                disabled={converting}
                className="flex-1 px-4 py-2 min-h-[44px] text-dark-400 hover:text-white bg-dark-700 hover:bg-dark-600 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConvert}
                disabled={converting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {converting ? (
                  <>⏳ Convertendo...</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Confirmar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição/criação de lead (preservado integralmente do L038) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="p-6 border-b border-dark-700 flex justify-between items-center sticky top-0 bg-dark-800">
              <h2 className="text-white font-semibold text-lg">
                {editing ? 'Editar Lead' : 'Novo Lead'}
              </h2>
              {/* L038: área de toque adequada */}
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white text-xl min-w-[44px] min-h-[44px] flex items-center justify-center">✕</button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>
              )}

              {/* Banner quando vem do mapa */}
              {!editing && form.lat && form.lng && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  Localização pré-preenchida a partir do mapa. Preencha os demais campos.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Nome */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">Nome *</label>
                  <input
                    value={form.name ?? ''}
                    onChange={e => f('name', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Status</label>
                  <select
                    value={form.status ?? 'novo'}
                    onChange={e => f('status', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {(Object.keys(STATUS_LABELS) as PreRegistrationStatus[]).map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>

                {/* Origem */}
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Origem</label>
                  <select
                    value={form.source ?? 'manual'}
                    onChange={e => f('source', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Telefone</label>
                  <input
                    value={form.tel ?? ''}
                    onChange={e => f('tel', e.target.value)}
                    placeholder="(48) 99999-9999"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Email</label>
                  <input
                    value={form.email ?? ''}
                    onChange={e => f('email', e.target.value)}
                    type="email"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Interesse */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">Interesse / Produto</label>
                  <input
                    value={form.interest ?? ''}
                    onChange={e => f('interest', e.target.value)}
                    placeholder="Ex: Defensivos, Sementes, Maquinário..."
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Indicador */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">Indicado por</label>
                  <select
                    value={form.referral_id ?? ''}
                    onChange={e => f('referral_id', e.target.value || null)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">— Nenhum indicador —</option>
                    {referrals.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Localização: busca por endereço */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">
                    Buscar Endereço no Mapa <span className="text-dark-500">(Nominatim)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="pre-geo-search-input"
                      placeholder="Ex: Araranguá SC, Rua XV de Novembro 100..."
                      className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          geoSearch((document.getElementById('pre-geo-search-input') as HTMLInputElement)?.value ?? '');
                        }
                      }}
                    />
                    {/* L038: min-h-[44px] nos botões do formulário */}
                    <button
                      type="button"
                      disabled={geoLoading}
                      onClick={() => geoSearch((document.getElementById('pre-geo-search-input') as HTMLInputElement)?.value ?? '')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap min-h-[44px]"
                    >
                      {geoLoading ? '⏳' : '📍 Buscar'}
                    </button>
                    <button
                      type="button"
                      disabled={geoLoading}
                      onClick={useCurrentGps}
                      title="Usar minha localização atual"
                      className="px-3 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg text-sm disabled:opacity-50 min-h-[44px]"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                  </div>
                  {geoError && <p className="text-red-400 text-xs mt-1">{geoError}</p>}
                  {form.lat && form.lng && (
                    <p className="text-green-400 text-xs mt-1">
                      ✅ Coordenadas: {(form.lat as number).toFixed(5)}, {(form.lng as number).toFixed(5)}
                      <a
                        href={`https://www.google.com/maps?q=${form.lat},${form.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 underline text-blue-400"
                      >
                        Abrir no Maps
                      </a>
                    </p>
                  )}
                </div>

                {/* Link Maps */}
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Link Google Maps</label>
                  <input
                    value={form.maps_link ?? ''}
                    onChange={e => f('maps_link', e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Ponto de referência */}
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Ponto de referência</label>
                  <input
                    value={form.point_reference ?? ''}
                    onChange={e => f('point_reference', e.target.value)}
                    placeholder="Ex: Próximo ao silos da cooperativa"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Lat / Lng manuais */}
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Latitude</label>
                  <input
                    value={form.lat ?? ''}
                    onChange={e => f('lat', parseFloat(e.target.value) || null)}
                    type="number"
                    step="any"
                    placeholder="-28.935"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Longitude</label>
                  <input
                    value={form.lng ?? ''}
                    onChange={e => f('lng', parseFloat(e.target.value) || null)}
                    type="number"
                    step="any"
                    placeholder="-49.486"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Observações */}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">Observações</label>
                  <textarea
                    value={form.obs ?? ''}
                    onChange={e => f('obs', e.target.value)}
                    rows={3}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal footer — L038: min-h-[44px] + empilhamento no mobile */}
            <div className="p-6 border-t border-dark-700 flex flex-col sm:flex-row gap-3 justify-end sticky bottom-0 bg-dark-800">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-dark-400 hover:text-white text-sm min-h-[44px]">
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 min-h-[44px]"
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
