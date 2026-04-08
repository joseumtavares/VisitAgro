'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type ClientStatus = 'interessado' | 'visitado' | 'agendado' | 'comprou' | 'naointeressado' | 'retornar' | 'outro';

interface Client {
  id: string; name: string; status: ClientStatus;
  lat?: number | null; lng?: number | null;
  tel?: string | null; email?: string | null;
  address?: string | null; city?: string | null; state?: string | null;
  maps_link?: string | null; obs?: string | null; workspace?: string;
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Centro: Araranguá — Santa Catarina
const SC_CENTER: [number, number] = [-28.935, -49.486];

const STATUS_COLORS: Record<ClientStatus, string> = {
  interessado: '#3b82f6', visitado: '#10b981', agendado: '#f59e0b',
  comprou: '#8b5cf6', naointeressado: '#6b7280', retornar: '#ef4444', outro: '#9ca3af',
};
const STATUS_LABELS: Record<ClientStatus, string> = {
  interessado: 'Interessado', visitado: 'Visitado', agendado: 'Agendado',
  comprou: 'Comprou', naointeressado: 'Não Interessado', retornar: 'Retornar', outro: 'Outro',
};

function RecenterMap({ clients }: { clients: Client[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = clients.filter(c => c.lat && c.lng);
    if (pts.length === 0) { map.setView(SC_CENTER, 9); return; }
    // Centraliza nos clientes reais
    const lats = pts.map(c => c.lat!), lngs = pts.map(c => c.lng!);
    const bounds = L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [clients, map]);
  return null;
}

export default function InteractiveMap({ compact = false }: { compact?: boolean }) {
  const [clients, setClients]     = useState<Client[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm]   = useState<Partial<Client>>({});
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [filter, setFilter]       = useState<ClientStatus | 'todos'>('todos');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await fetch('/api/clients');
      const j = await r.json();
      setClients(j.clients ?? []);
    } catch { setError('Erro ao carregar clientes'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const payload = { ...editForm };
      if (!payload.maps_link && payload.lat && payload.lng)
        payload.maps_link = `https://www.google.com/maps?q=${payload.lat},${payload.lng}`;
      const r = await fetch(`/api/clients/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('Falha ao salvar');
      await load(); setEditingId(null);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const visible = clients.filter(c =>
    c.lat && c.lng && (filter === 'todos' || c.status === filter)
  );

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-dark-900 rounded-lg text-dark-400 min-h-[200px]">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm">Carregando clientes...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-3">
      {!compact && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('todos')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === 'todos' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'}`}>
            Todos ({clients.filter(c => c.lat && c.lng).length})
          </button>
          {(Object.keys(STATUS_LABELS) as ClientStatus[]).map(s => {
            const n = clients.filter(c => c.status === s && c.lat && c.lng).length;
            if (n === 0) return null;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${filter === s ? 'text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'}`}
                style={filter === s ? { backgroundColor: STATUS_COLORS[s] } : {}}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />
                {STATUS_LABELS[s]} ({n})
              </button>
            );
          })}
        </div>
      )}

      {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500 px-3 py-2 rounded-lg">{error}</div>}

      <div className="flex-1 rounded-lg overflow-hidden" style={{ minHeight: compact ? 240 : 520 }}>
        <MapContainer center={SC_CENTER} zoom={compact ? 7 : 9}
          style={{ height: '100%', width: '100%' }} scrollWheelZoom={!compact}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap clients={clients} />

          {visible.map(client => (
            <CircleMarker key={client.id}
              center={[client.lat!, client.lng!]}
              radius={compact ? 8 : 12}
              fillColor={STATUS_COLORS[client.status] ?? '#6b7280'}
              color="#fff" weight={2} opacity={1} fillOpacity={0.85}>
              <Popup minWidth={220} maxWidth={300}>
                {editingId === client.id ? (
                  <div className="text-gray-900 space-y-2 p-1">
                    <p className="font-bold text-sm">✏️ Editar: {client.name}</p>
                    <div>
                      <label className="text-xs text-gray-500">Status</label>
                      <select value={editForm.status}
                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value as ClientStatus }))}
                        className="w-full border rounded px-2 py-1 text-sm mt-0.5">
                        {(Object.keys(STATUS_LABELS) as ClientStatus[]).map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Telefone</label>
                      <input value={editForm.tel ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, tel: e.target.value }))}
                        placeholder="(48) 99999-9999"
                        className="w-full border rounded px-2 py-1 text-sm mt-0.5" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Email</label>
                      <input value={editForm.email ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full border rounded px-2 py-1 text-sm mt-0.5" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Observação</label>
                      <textarea value={editForm.obs ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, obs: e.target.value }))}
                        rows={2} className="w-full border rounded px-2 py-1 text-sm mt-0.5" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={saveEdit} disabled={saving}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded disabled:opacity-50">
                        {saving ? 'Salvando...' : '✓ Salvar'}
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1.5 rounded">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-900 min-w-[190px]">
                    <h3 className="font-bold text-base mb-2">{client.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[client.status] }} />
                      <span className="text-sm font-medium">{STATUS_LABELS[client.status]}</span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {client.tel && (
                        <div className="flex items-center gap-1">
                          <span>📞</span>
                          <a href={`tel:${client.tel}`} className="text-blue-600 hover:underline">{client.tel}</a>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-1">
                          <span>✉️</span>
                          <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline text-xs truncate max-w-[170px]">
                            {client.email}
                          </a>
                        </div>
                      )}
                      {(client.city || client.state) && (
                        <div className="flex items-center gap-1">
                          <span>📍</span>
                          <span>{[client.city, client.state].filter(Boolean).join(' — ')}</span>
                        </div>
                      )}
                      {client.obs && (
                        <div className="flex items-center gap-1 mt-1">
                          <span>📝</span>
                          <span className="text-xs italic text-gray-500">{client.obs}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <a href={client.maps_link ?? `https://www.google.com/maps?q=${client.lat},${client.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs py-1.5 rounded border border-blue-200">
                        🗺️ Google Maps
                      </a>
                      {!compact && (
                        <button onClick={() => { setEditingId(client.id); setEditForm({ ...client }); }}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 rounded border border-gray-300">
                          ✏️ Editar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
