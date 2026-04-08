'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Plus, Search, Pencil, Trash2, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';

type ClientStatus = 'interessado' | 'visitado' | 'agendado' | 'comprou' | 'naointeressado' | 'retornar' | 'outro';

interface Client {
  id: string; name: string; status: ClientStatus;
  tel?: string | null; email?: string | null;
  address?: string | null; city?: string | null; state?: string | null;
  lat?: number | null; lng?: number | null;
  maps_link?: string | null; obs?: string | null;
}

const STATUS_COLORS: Record<ClientStatus, string> = {
  interessado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  visitado:    'bg-green-500/20 text-green-400 border-green-500/30',
  agendado:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  comprou:     'bg-purple-500/20 text-purple-400 border-purple-500/30',
  naointeressado: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  retornar:    'bg-red-500/20 text-red-400 border-red-500/30',
  outro:       'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  interessado: 'Interessado', visitado: 'Visitado', agendado: 'Agendado',
  comprou: 'Comprou', naointeressado: 'Não Interessado', retornar: 'Retornar', outro: 'Outro',
};

const EMPTY: Partial<Client> = { name: '', status: 'interessado', tel: '', email: '', city: '', state: '', address: '', obs: '' };

export default function ClientsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [clients, setClients]   = useState<Client[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilter] = useState<ClientStatus | 'todos'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<Client | null>(null);
  const [form, setForm]         = useState<Partial<Client>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => { if (!isAuthenticated) router.push('/auth/login'); }, [isAuthenticated, router]);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/clients');
    const j = await r.json();
    setClients(j.clients ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true); };
  const openEdit = (c: Client) => { setEditing(c); setForm({ ...c }); setError(''); setShowModal(true); };

  const save = async () => {
    if (!form.name?.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const url    = editing ? `/api/clients/${editing.id}` : '/api/clients';
      const method = editing ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!r.ok) { const j = await r.json(); throw new Error(j.error); }
      await load(); setShowModal(false);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este cliente?')) return;
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    await load();
  };

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tel?.includes(search) || c.city?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const f = (k: keyof Client, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Clientes</h1>
            <p className="text-dark-400 text-sm mt-1">{clients.length} clientes cadastrados</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-dark-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone ou cidade..."
              className="w-full bg-dark-800 border border-dark-700 rounded-lg py-2 pl-9 pr-4 text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
          </div>
          <select value={filterStatus} onChange={e => setFilter(e.target.value as any)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500">
            <option value="todos">Todos os status</option>
            {(Object.keys(STATUS_LABELS) as ClientStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-12 text-dark-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum cliente encontrado</p>
            <button onClick={openNew} className="mt-3 text-primary-400 hover:text-primary-300 text-sm">
              + Cadastrar primeiro cliente
            </button>
          </div>
        ) : (
          <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700 text-dark-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Nome</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Contato</th>
                    <th className="text-left px-4 py-3">Localização</th>
                    <th className="text-right px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-dark-750 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-white font-medium text-sm">{c.name}</div>
                        {c.obs && <div className="text-dark-500 text-xs mt-0.5 truncate max-w-[200px]">{c.obs}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[c.status]}`}>
                          {STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {c.tel && (
                            <a href={`tel:${c.tel}`} className="flex items-center gap-1 text-xs text-dark-300 hover:text-white transition-colors">
                              <Phone className="w-3 h-3" /> {c.tel}
                            </a>
                          )}
                          {c.email && (
                            <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-dark-300 hover:text-white transition-colors truncate max-w-[160px]">
                              <Mail className="w-3 h-3" /> {c.email}
                            </a>
                          )}
                          {!c.tel && !c.email && <span className="text-dark-600 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-dark-300">
                          {[c.city, c.state].filter(Boolean).join(' — ') || '—'}
                        </div>
                        {(c.maps_link || (c.lat && c.lng)) && (
                          <a href={c.maps_link ?? `https://www.google.com/maps?q=${c.lat},${c.lng}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-0.5 transition-colors">
                            <MapPin className="w-3 h-3" /> Ver no mapa <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(c)}
                            className="text-dark-400 hover:text-white p-1.5 rounded hover:bg-dark-700 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => remove(c.id)}
                            className="text-dark-400 hover:text-red-400 p-1.5 rounded hover:bg-dark-700 transition-colors">
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
        )}
      </div>

      {/* Modal novo/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-700 flex justify-between items-center">
              <h2 className="text-white font-semibold text-lg">
                {editing ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">Nome *</label>
                  <input value={form.name ?? ''} onChange={e => f('name', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Status</label>
                  <select value={form.status ?? 'interessado'} onChange={e => f('status', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    {(Object.keys(STATUS_LABELS) as ClientStatus[]).map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Telefone</label>
                  <input value={form.tel ?? ''} onChange={e => f('tel', e.target.value)}
                    placeholder="(48) 99999-9999"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">Email</label>
                  <input value={form.email ?? ''} onChange={e => f('email', e.target.value)}
                    type="email"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Cidade</label>
                  <input value={form.city ?? ''} onChange={e => f('city', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Estado</label>
                  <input value={form.state ?? ''} onChange={e => f('state', e.target.value)}
                    placeholder="SC"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">Endereço</label>
                  <input value={form.address ?? ''} onChange={e => f('address', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Latitude</label>
                  <input value={form.lat ?? ''} onChange={e => f('lat', e.target.value)}
                    type="number" step="any" placeholder="-28.935"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Longitude</label>
                  <input value={form.lng ?? ''} onChange={e => f('lng', e.target.value)}
                    type="number" step="any" placeholder="-49.486"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">Link Google Maps (opcional — gerado automaticamente se tiver lat/lng)</label>
                  <input value={form.maps_link ?? ''} onChange={e => f('maps_link', e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">Observações</label>
                  <textarea value={form.obs ?? ''} onChange={e => f('obs', e.target.value)}
                    rows={3}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-dark-700 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-dark-400 hover:text-white transition-colors text-sm">
                Cancelar
              </button>
              <button onClick={save} disabled={saving}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
