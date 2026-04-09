'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiFetch } from '@/lib/apiFetch';

type ClientStatus = 'interessado' | 'visitado' | 'agendado' | 'comprou' | 'naointeressado' | 'retornar' | 'outro';

interface Client {
  id: string; name: string; status: ClientStatus;
  lat?: number | null; lng?: number | null;
  tel?: string | null; tel2?: string | null; email?: string | null;
  address?: string | null; city?: string | null; state?: string | null;
  maps_link?: string | null; obs?: string | null; workspace?: string;
  category?: string | null;
}

// ── Centro: Araranguá — SC ────────────────────────────────────
const SC_CENTER: [number, number] = [-28.935, -49.486];

// ── Cores e labels por status ─────────────────────────────────
const STATUS_COLORS: Record<ClientStatus, string> = {
  interessado: '#f59e0b', visitado: '#3b82f6', agendado: '#8b5cf6',
  comprou: '#10b981', naointeressado: '#ef4444', retornar: '#f97316', outro: '#6b7280',
};
const STATUS_LABELS: Record<ClientStatus, string> = {
  interessado: 'Interessado', visitado: 'Visitado', agendado: 'Agendado',
  comprou: 'Comprou', naointeressado: 'Não Interessado', retornar: 'Retornar', outro: 'Outro',
};

// ── Ícone SVG por status (pin teardrop) — ref: index.html makeIcon() ─────────
function makeLeafletIcon(status: ClientStatus) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  const svg = `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 9.4 17 27 17 27s17-17.6 17-27C34 7.6 26.4 0 17 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="17" cy="17" r="7" fill="white" opacity="0.95"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [34, 44], iconAnchor: [17, 44], popupAnchor: [0, -46],
    className: '',
  });
}

// ── Toast simples ──────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' | 'info' }) {
  const bg = type === 'success' ? '#166534' : type === 'error' ? '#7f1d1d' : '#1e3a5f';
  return (
    <div style={{
      position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, background: bg, color: '#fff', padding: '10px 18px',
      borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      whiteSpace: 'nowrap', maxWidth: '92vw', animation: 'fadeIn .2s ease',
    }}>{msg}</div>
  );
}

// ── Recentraliza mapa quando clientes carregam ────────────────
function RecenterMap({ clients, resetKey }: { clients: Client[]; resetKey: number }) {
  const map = useMap();
  useEffect(() => {
    const pts = clients.filter(c => c.lat && c.lng);
    if (pts.length === 0) { map.setView(SC_CENTER, 9); return; }
    const lats = pts.map(c => c.lat!), lngs = pts.map(c => c.lng!);
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [50, 50], maxZoom: 13 }
    );
  }, [resetKey]);
  return null;
}

// ── Controle de geolocalização (botão GPS no mapa) ────────────
function LocateControl() {
  const map = useMap();
  const [locCircle, setLocCircle] = useState<L.Circle | null>(null);
  const [locDot, setLocDot] = useState<L.CircleMarker | null>(null);

  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
        map.flyTo([lat, lng], 16, { duration: 1.2 });
        if (locDot)   { map.removeLayer(locDot); }
        if (locCircle){ map.removeLayer(locCircle); }
        const dot = L.circleMarker([lat, lng], {
          radius: 10, color: '#fff', weight: 2,
          fillColor: '#4f8ef7', fillOpacity: 1,
        }).addTo(map);
        const circle = acc > 5 ? L.circle([lat, lng], {
          radius: acc, color: '#4f8ef7',
          fillColor: '#4f8ef7', fillOpacity: 0.08, weight: 1,
        }).addTo(map) : null;
        setLocDot(dot);
        if (circle) setLocCircle(circle);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div style={{ position: 'absolute', bottom: 80, right: 10, zIndex: 800 }}>
      <button onClick={locate} title="Minha localização"
        style={{
          width: 38, height: 38, borderRadius: '50%', border: '2px solid #fff',
          background: '#1e40af', color: '#fff', fontSize: 18, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>📍</button>
    </div>
  );
}

// ── Barra de busca Nominatim no mapa ──────────────────────────
function MapSearchBar() {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const debounceRef = useRef<any>(null);

  const search = useCallback(async (q: string, suggest = false) => {
    if (!q || q.length < 3) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1&accept-language=pt-BR,pt`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR,pt' } });
      const results = await res.json();
      if (!suggest && results.length === 1) { apply(results[0]); return; }
      setSuggestions(results);
    } catch { }
    finally { setLoading(false); }
  }, []);

  const apply = (r: any) => {
    const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
    setSuggestions([]);
    if (searchMarkerRef.current) map.removeLayer(searchMarkerRef.current);
    const m = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 0 8px rgba(59,130,246,0.8)"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7], className: '',
      })
    }).addTo(map);
    searchMarkerRef.current = m;
    map.flyTo([lat, lng], 15, { duration: 1 });
  };

  return (
    <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 800, width: 300 }}>
      <div style={{ display: 'flex', gap: 4, background: '#1e293b', borderRadius: 10, padding: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
        <input
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => search(e.target.value, true), 600);
          }}
          onKeyDown={e => { if (e.key === 'Enter') search(query); if (e.key === 'Escape') setSuggestions([]); }}
          placeholder="🔍 Buscar endereço no mapa..."
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#f1f5f9', fontSize: 12, padding: '4px 6px',
          }}
        />
        <button onClick={() => search(query)} disabled={loading}
          style={{ background: '#3b82f6', border: 'none', borderRadius: 7, padding: '4px 10px', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
          {loading ? '⏳' : '🔍'}
        </button>
      </div>
      {suggestions.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: 8, marginTop: 4, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
          {suggestions.map((r, i) => {
            const a = r.address || {};
            const city = a.city || a.town || a.village || a.municipality || '';
            const road = a.road || a.pedestrian || '';
            const label = [road, city, a.state].filter(Boolean).join(', ') || r.display_name.split(',').slice(0, 2).join(',');
            return (
              <button key={i} onClick={() => { apply(r); setQuery(label); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', background: 'transparent',
                  border: 'none', borderBottom: '1px solid #334155', padding: '8px 10px',
                  color: '#e2e8f0', fontSize: 11, cursor: 'pointer',
                }}>
                📍 {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────
export default function InteractiveMap({ compact = false }: { compact?: boolean }) {
  const [clients, setClients]     = useState<Client[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm]   = useState<Partial<Client>>({});
  const [saving, setSaving]       = useState(false);
  const [filter, setFilter]       = useState<ClientStatus | 'todos'>('todos');
  const [toast, setToast]         = useState<{ msg: string; type: 'success'|'error'|'info' } | null>(null);
  const [recenterKey, setRecenterKey] = useState(0);

  const showToast = (msg: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await apiFetch('/api/clients');
      const j = await r.json();
      setClients(j.clients ?? []);
      setRecenterKey(k => k + 1);
    } catch { showToast('Erro ao carregar clientes', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const payload = { ...editForm };
      if (!payload.maps_link && payload.lat && payload.lng)
        payload.maps_link = `https://www.google.com/maps?q=${payload.lat},${payload.lng}`;
      const r = await apiFetch(`/api/clients/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('Falha ao salvar');
      showToast('✅ Cliente atualizado!', 'success');
      await load(); setEditingId(null);
    } catch (e: any) { showToast('❌ ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  const visible = clients.filter(c =>
    c.lat && c.lng && (filter === 'todos' || c.status === filter)
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200, background: '#0f172a', borderRadius: 8, color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #334155', borderTopColor: '#3b82f6', borderRadius: '50%', margin: '0 auto 8px', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 13 }}>Carregando clientes...</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Filtros de status */}
      {!compact && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button
            onClick={() => setFilter('todos')}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: filter === 'todos' ? '#2563eb' : '#1e293b',
              color: filter === 'todos' ? '#fff' : '#94a3b8',
              border: `1px solid ${filter === 'todos' ? '#2563eb' : '#334155'}`,
            }}>
            Todos ({clients.filter(c => c.lat && c.lng).length})
          </button>
          {(Object.keys(STATUS_LABELS) as ClientStatus[]).map(s => {
            const n = clients.filter(c => c.status === s && c.lat && c.lng).length;
            if (n === 0) return null;
            const active = filter === s;
            return (
              <button key={s} onClick={() => setFilter(s)}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  background: active ? STATUS_COLORS[s] : '#1e293b',
                  color: active ? '#fff' : '#94a3b8',
                  border: `1px solid ${active ? STATUS_COLORS[s] : '#334155'}`,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s], display: 'inline-block' }} />
                {STATUS_LABELS[s]} ({n})
              </button>
            );
          })}
        </div>
      )}

      {/* Mapa */}
      <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden', position: 'relative', minHeight: compact ? 240 : 520 }}>
        <MapContainer
          key="main-map"
          center={SC_CENTER} zoom={compact ? 7 : 9}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={!compact}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <RecenterMap clients={clients} resetKey={recenterKey} />
          {!compact && <MapSearchBar />}
          {!compact && <LocateControl />}

          {visible.map(client => (
            <Marker key={client.id}
              position={[client.lat!, client.lng!]}
              icon={makeLeafletIcon(client.status)}>
              <Popup minWidth={220} maxWidth={300}>
                {editingId === client.id ? (
                  /* ── Formulário de edição inline ── */
                  <div style={{ fontFamily: 'system-ui', color: '#111', padding: 2 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>✏️ {client.name}</p>
                    <div style={{ marginBottom: 6 }}>
                      <label style={{ fontSize: 11, color: '#666' }}>Status</label>
                      <select value={editForm.status}
                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value as ClientStatus }))}
                        style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 5, padding: '4px 6px', fontSize: 12, marginTop: 2 }}>
                        {(Object.keys(STATUS_LABELS) as ClientStatus[]).map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <label style={{ fontSize: 11, color: '#666' }}>Telefone 1</label>
                      <input value={editForm.tel ?? ''} onChange={e => setEditForm(f => ({ ...f, tel: e.target.value }))}
                        placeholder="(48) 99999-9999"
                        style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 5, padding: '4px 6px', fontSize: 12, marginTop: 2, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <label style={{ fontSize: 11, color: '#666' }}>Telefone 2</label>
                      <input value={editForm.tel2 ?? ''} onChange={e => setEditForm(f => ({ ...f, tel2: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 5, padding: '4px 6px', fontSize: 12, marginTop: 2, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 11, color: '#666' }}>Observação</label>
                      <textarea value={editForm.obs ?? ''} onChange={e => setEditForm(f => ({ ...f, obs: e.target.value }))}
                        rows={2} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 5, padding: '4px 6px', fontSize: 12, marginTop: 2, resize: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={saveEdit} disabled={saving}
                        style={{ flex: 1, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 0', fontSize: 12, cursor: 'pointer' }}>
                        {saving ? '...' : '✓ Salvar'}
                      </button>
                      <button onClick={() => setEditingId(null)}
                        style={{ flex: 1, background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, padding: '6px 0', fontSize: 12, cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Visualização ── */
                  <div style={{ fontFamily: 'system-ui', color: '#111', minWidth: 190 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{client.name}</div>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11,
                      fontWeight: 600, marginBottom: 8,
                      background: STATUS_COLORS[client.status] + '22',
                      color: STATUS_COLORS[client.status],
                      border: `1px solid ${STATUS_COLORS[client.status]}44`,
                    }}>
                      {STATUS_LABELS[client.status]}
                    </span>
                    {client.category && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>📂 {client.category}</div>}
                    <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6 }}>
                      {client.tel && <div>📞 <a href={`tel:${client.tel}`} style={{ color: '#2563eb' }}>{client.tel}</a></div>}
                      {client.tel2 && <div>📞 <a href={`tel:${client.tel2}`} style={{ color: '#2563eb' }}>{client.tel2}</a></div>}
                      {client.email && <div>✉️ <a href={`mailto:${client.email}`} style={{ color: '#2563eb', fontSize: 11 }}>{client.email}</a></div>}
                      {(client.city || client.state) && <div>📍 {[client.city, client.state].filter(Boolean).join(' — ')}</div>}
                      {client.obs && <div style={{ fontStyle: 'italic', color: '#9ca3af', fontSize: 11, marginTop: 4 }}>"{client.obs}"</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <a href={client.maps_link ?? `https://www.google.com/maps?q=${client.lat},${client.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, textAlign: 'center', background: '#16a34a', color: '#fff', textDecoration: 'none', borderRadius: 6, padding: '6px 0', fontSize: 11, fontWeight: 600 }}>
                        🗺️ Maps
                      </a>
                      {!compact && (
                        <button onClick={() => { setEditingId(client.id); setEditForm({ ...client }); }}
                          style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          ✏️ Editar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(-6px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}
