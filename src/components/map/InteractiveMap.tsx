'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiFetch } from '@/lib/apiFetch';

// ── Types ─────────────────────────────────────────────────────
type ClientStatus = 'interessado' | 'visitado' | 'agendado' | 'comprou' | 'naointeressado' | 'retornar' | 'outro';
type ActivityType = 'Visita' | 'Ligação' | 'WhatsApp' | 'Email' | 'Reunião';
type PreRegistrationStatus = 'novo' | 'contatado' | 'qualificado' | 'convertido' | 'perdido';

interface Client {
  id: string; name: string; status: ClientStatus;
  lat?: number | null; lng?: number | null;
  tel?: string | null; tel2?: string | null; email?: string | null;
  address?: string | null; city?: string | null; state?: string | null;
  maps_link?: string | null; obs?: string | null; workspace?: string;
  category?: string | null;
}

interface PreRegistration {
  id: string; name: string; status: PreRegistrationStatus;
  lat?: number | null; lng?: number | null;
  tel?: string | null; source?: string | null;
  interest?: string | null; point_reference?: string | null;
  maps_link?: string | null; obs?: string | null;
}

interface CheckinForm {
  client_id: string; client_name: string;
  activity_type: ActivityType; client_status: ClientStatus;
  obs: string; schedule_next: boolean;
  next_visit_date: string; next_activity_type: ActivityType; next_obs: string;
}

// ── Constants ─────────────────────────────────────────────────
const SC_CENTER: [number, number] = [-28.935, -49.486];

const STATUS_COLORS: Record<ClientStatus, string> = {
  interessado: '#f59e0b', visitado: '#3b82f6', agendado: '#8b5cf6',
  comprou: '#10b981', naointeressado: '#ef4444', retornar: '#f97316', outro: '#6b7280',
};
const STATUS_LABELS: Record<ClientStatus, string> = {
  interessado: 'Interessado', visitado: 'Visitado', agendado: 'Agendado',
  comprou: 'Comprou', naointeressado: 'Não Interessado', retornar: 'Retornar', outro: 'Outro',
};

// Lead colors — cyan palette, distinct from all client status colors
const LEAD_STATUS_COLORS: Record<PreRegistrationStatus, string> = {
  novo:        '#06b6d4',
  contatado:   '#0ea5e9',
  qualificado: '#14b8a6',
  convertido:  '#a855f7',
  perdido:     '#6b7280',
};
const LEAD_STATUS_LABELS: Record<PreRegistrationStatus, string> = {
  novo: 'Novo', contatado: 'Contatado', qualificado: 'Qualificado',
  convertido: 'Convertido', perdido: 'Perdido',
};
const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual', site: 'Site', indicacao: 'Indicação',
  whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook',
  feira: 'Feira', outro: 'Outro',
};

const ACTIVITY_TYPES: ActivityType[] = ['Visita', 'Ligação', 'WhatsApp', 'Email', 'Reunião'];
const ACTIVITY_ICONS: Record<ActivityType, string> = {
  'Visita': '🚗', 'Ligação': '📞', 'WhatsApp': '💬', 'Email': '✉️', 'Reunião': '🤝',
};

// ── Icon factories ─────────────────────────────────────────────
function makeLeafletIcon(status: ClientStatus) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  const svg = `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg"><path d="M17 0C7.6 0 0 7.6 0 17c0 9.4 17 27 17 27s17-17.6 17-27C34 7.6 26.4 0 17 0z" fill="${color}" stroke="white" stroke-width="2"/><circle cx="17" cy="17" r="7" fill="white" opacity="0.95"/></svg>`;
  return L.divIcon({ html: svg, iconSize: [34, 44], iconAnchor: [17, 44], popupAnchor: [0, -46], className: '' });
}

function makeLeafletIconLead(status: PreRegistrationStatus) {
  const color = LEAD_STATUS_COLORS[status] ?? '#06b6d4';
  const svg = `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg"><path d="M17 0C7.6 0 0 7.6 0 17c0 9.4 17 27 17 27s17-17.6 17-27C34 7.6 26.4 0 17 0z" fill="${color}" stroke="white" stroke-width="2"/><text x="17" y="22" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="white" font-weight="bold">★</text></svg>`;
  return L.divIcon({ html: svg, iconSize: [34, 44], iconAnchor: [17, 44], popupAnchor: [0, -46], className: '' });
}

// ── Sub-components ─────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' | 'info' }) {
  const bg = type === 'success' ? '#166534' : type === 'error' ? '#7f1d1d' : '#1e3a5f';
  return <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: bg, color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', maxWidth: '92vw', animation: 'fadeIn .2s ease' }}>{msg}</div>;
}

function RecenterMap({ clients, resetKey }: { clients: Client[]; resetKey: number }) {
  const map = useMap();
  useEffect(() => {
    const pts = clients.filter(c => c.lat && c.lng);
    if (pts.length === 0) { map.setView(SC_CENTER, 9); return; }
    const lats = pts.map(c => c.lat!), lngs = pts.map(c => c.lng!);
    map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [50, 50], maxZoom: 13 });
  }, [map, clients, resetKey]);
  return null;
}

function LocateControl() {
  const map = useMap();
  const [locCircle, setLocCircle] = useState<L.Circle | null>(null);
  const [locDot, setLocDot] = useState<L.CircleMarker | null>(null);
  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
      map.flyTo([lat, lng], 16, { duration: 1.2 });
      if (locDot) map.removeLayer(locDot);
      if (locCircle) map.removeLayer(locCircle);
      const dot = L.circleMarker([lat, lng], { radius: 10, color: '#fff', weight: 2, fillColor: '#4f8ef7', fillOpacity: 1 }).addTo(map);
      const circle = acc > 5 ? L.circle([lat, lng], { radius: acc, color: '#4f8ef7', fillColor: '#4f8ef7', fillOpacity: 0.08, weight: 1 }).addTo(map) : null;
      setLocDot(dot); if (circle) setLocCircle(circle);
    }, () => {}, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };
  return <div style={{ position: 'absolute', bottom: 80, right: 10, zIndex: 800 }}><button onClick={locate} title="Minha localização" style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid #fff', background: '#1e40af', color: '#fff', fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📍</button></div>;
}

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
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`, { headers: { 'Accept-Language': 'pt-BR,pt' } });
      const results = await res.json();
      if (!suggest && results.length === 1) { applyResult(results[0]); return; }
      setSuggestions(results);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, [map]);

  const applyResult = (r: any) => {
    const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
    setSuggestions([]);
    if (searchMarkerRef.current) map.removeLayer(searchMarkerRef.current);
    const m = L.marker([lat, lng], { icon: L.divIcon({ html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 0 8px rgba(59,130,246,0.8)"></div>`, iconSize: [14, 14], iconAnchor: [7, 7], className: '' }) }).addTo(map);
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
          onKeyDown={e => {
            if (e.key === 'Enter') search(query);
            if (e.key === 'Escape') setSuggestions([]);
          }}
          placeholder="🔍 Buscar endereço no mapa..."
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 12, padding: '4px 6px' }}
        />
        <button onClick={() => search(query)} disabled={loading} style={{ background: '#3b82f6', border: 'none', borderRadius: 7, padding: '4px 10px', color: '#fff', cursor: 'pointer', fontSize: 13 }}>{loading ? '⏳' : '🔍'}</button>
      </div>
      {suggestions.length > 0 && <div style={{ background: '#1e293b', borderRadius: 8, marginTop: 4, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>{suggestions.map((r, i) => { const a = r.address || {}; const label = [a.road, a.city || a.town || a.village, a.state].filter(Boolean).join(', ') || r.display_name.split(',').slice(0, 2).join(','); return <button key={i} onClick={() => { applyResult(r); setQuery(label); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid #334155', padding: '8px 10px', color: '#e2e8f0', fontSize: 11, cursor: 'pointer' }}>📍 {label}</button>; })}</div>}
    </div>
  );
}

function LeadPlacementHandler({ active, onMapClick }: {
  active: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (active) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function CheckinModal({ form, setForm, onSave, onClose, saving }: {
  form: CheckinForm; setForm: React.Dispatch<React.SetStateAction<CheckinForm>>;
  onSave: () => void; onClose: () => void; saving: boolean;
}) {
  const f = (k: keyof CheckinForm, v: any) => setForm(p => ({ ...p, [k]: v }));
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#1e293b', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Check-in de Visita</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{form.client_name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 8 }}>TIPO DE ATIVIDADE</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ACTIVITY_TYPES.map(a => (
                <button key={a} onClick={() => f('activity_type', a)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: form.activity_type === a ? '#2563eb' : '#0f172a', color: form.activity_type === a ? '#fff' : '#94a3b8', border: `1px solid ${form.activity_type === a ? '#2563eb' : '#334155'}` }}>
                  {ACTIVITY_ICONS[a]} {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6 }}>ATUALIZAR STATUS DO CLIENTE</label>
            <select value={form.client_status} onChange={e => f('client_status', e.target.value as ClientStatus)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 10px', color: '#f1f5f9', fontSize: 13 }}>
              {(Object.keys(STATUS_LABELS) as ClientStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6 }}>OBSERVAÇÕES</label>
            <textarea value={form.obs} onChange={e => f('obs', e.target.value)} rows={3} placeholder="O que foi discutido? Próximos passos..." style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '8px 10px', color: '#f1f5f9', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          <div style={{ background: '#0f172a', borderRadius: 10, padding: 14, border: '1px solid #334155' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.schedule_next} onChange={e => f('schedule_next', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#8b5cf6' }} />
              <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>📅 Agendar próxima visita</span>
            </label>
            {form.schedule_next && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>DATA E HORA</label>
                  <input type="datetime-local" value={form.next_visit_date} min={minDate} onChange={e => f('next_visit_date', e.target.value)} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 10px', color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ACTIVITY_TYPES.map(a => (
                    <button key={a} onClick={() => f('next_activity_type', a)} style={{ padding: '4px 10px', borderRadius: 16, fontSize: 11, cursor: 'pointer', background: form.next_activity_type === a ? '#7c3aed' : '#0f172a', color: form.next_activity_type === a ? '#fff' : '#94a3b8', border: `1px solid ${form.next_activity_type === a ? '#7c3aed' : '#334155'}` }}>
                      {ACTIVITY_ICONS[a]} {a}
                    </button>
                  ))}
                </div>
                <input value={form.next_obs} onChange={e => f('next_obs', e.target.value)} placeholder="Pauta da próxima visita..." style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 10px', color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' }} />
                {form.next_visit_date && (
                  <a
                    href={(() => {
                      const start = new Date(form.next_visit_date);
                      const end = new Date(start.getTime() + 60 * 60 * 1000);
                      const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
                      const title = encodeURIComponent(`${ACTIVITY_ICONS[form.next_activity_type]} ${form.next_activity_type} — ${form.client_name}`);
                      const details = encodeURIComponent(form.next_obs || 'Visita agendada via VisitAgroPro');
                      return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#1a73e8', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 600 }}
                  >
                    📅 Adicionar ao Google Calendar
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onClose} disabled={saving} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
          <button onClick={onSave} disabled={saving} style={{ background: saving ? '#374151' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
            {saving ? '⏳ Salvando...' : '✅ Registrar Visita'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InteractiveMap({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<ClientStatus | 'todos'>('todos');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [recenterKey, setRecenterKey] = useState(0);
  const [checkinClient, setCheckinClient] = useState<Client | null>(null);
  const [checkinForm, setCheckinForm] = useState<CheckinForm>({
    client_id: '', client_name: '', activity_type: 'Visita', client_status: 'visitado',
    obs: '', schedule_next: false, next_visit_date: '', next_activity_type: 'Visita', next_obs: '',
  });
  const [checkinSaving, setCheckinSaving] = useState(false);

  const [preRegistrations, setPreRegistrations] = useState<PreRegistration[]>([]);
  const [showLeads, setShowLeads] = useState(true);
  const [placingLead, setPlacingLead] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await apiFetch('/api/clients');
      const j = await r.json();
      setClients(j.clients ?? []);
      setRecenterKey(k => k + 1);
    } catch {
      showToast('Erro ao carregar clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    try {
      const r = await apiFetch('/api/pre-registrations');
      const j = await r.json();
      setPreRegistrations(j.pre_registrations ?? []);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => { load(); loadLeads(); }, [load, loadLeads]);

  const handleLeadMapClick = useCallback((lat: number, lng: number) => {
    setPlacingLead(false);
    const mapsLink = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
    router.push(`/dashboard/pre-registrations?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}&maps_link=${encodeURIComponent(mapsLink)}`);
  }, [router]);

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const payload = { ...editForm };
      if (!payload.maps_link && payload.lat && payload.lng) {
        payload.maps_link = `https://www.google.com/maps?q=${payload.lat},${payload.lng}`;
      }
      const r = await apiFetch(`/api/clients/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('Falha ao salvar');
      showToast('✅ Cliente atualizado!', 'success');
      await load();
      setEditingId(null);
    } catch (e: any) {
      showToast('❌ ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openCheckin = (client: Client) => {
    setCheckinClient(client);
    setCheckinForm({
      client_id: client.id, client_name: client.name, activity_type: 'Visita', client_status: 'visitado',
      obs: '', schedule_next: false, next_visit_date: '', next_activity_type: 'Visita', next_obs: '',
    });
  };

  const saveCheckin = async () => {
    if (!checkinClient) return;
    setCheckinSaving(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;

      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (geoErr) {
        console.warn('[map] Geolocalização indisponível no check-in', geoErr);
      }

      const payload: any = {
        checkin: true,
        client_id: checkinForm.client_id,
        activity_type: checkinForm.activity_type,
        client_status: checkinForm.client_status,
        obs: checkinForm.obs || null,
        lat,
        lng,
      };

      if (checkinForm.schedule_next && checkinForm.next_visit_date) {
        payload.next_visit_date = new Date(checkinForm.next_visit_date).toISOString();
        payload.next_activity_type = checkinForm.next_activity_type;
        payload.next_obs = checkinForm.next_obs || null;
      }

      const r = await apiFetch('/api/visits', { method: 'POST', body: JSON.stringify(payload) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || 'Erro ao registrar visita');

      showToast('✅ Visita registrada!', 'success');
      setCheckinClient(null);
      await load();
      await loadLeads();
    } catch (e: any) {
      showToast('❌ ' + e.message, 'error');
    } finally {
      setCheckinSaving(false);
    }
  };

  const visible = clients.filter(c => c.lat && c.lng && (filter === 'todos' || c.status === filter));
  const visibleLeads = showLeads
    ? preRegistrations.filter(p => p.lat != null && p.lng != null)
    : [];

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
      {checkinClient && (
        <CheckinModal
          form={checkinForm}
          setForm={setCheckinForm}
          onSave={saveCheckin}
          onClose={() => setCheckinClient(null)}
          saving={checkinSaving}
        />
      )}

      {placingLead && (
        <div style={{
          background: '#0c4a6e',
          border: '1px solid #0ea5e9',
          borderRadius: 8,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <span style={{ fontSize: 13, color: '#bae6fd', fontWeight: 500 }}>
            📌 Clique no mapa para posicionar o novo lead
          </span>
          <button
            onClick={() => setPlacingLead(false)}
            style={{ background: '#164e63', border: '1px solid #0ea5e9', color: '#7dd3fc', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}
          >
            Cancelar
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
  {!compact && (
    <>
      <button onClick={() => setFilter('todos')} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: filter === 'todos' ? '#2563eb' : '#1e293b', color: filter === 'todos' ? '#fff' : '#94a3b8', border: `1px solid ${filter === 'todos' ? '#2563eb' : '#334155'}` }}>
        Todos ({clients.filter(c => c.lat && c.lng).length})
      </button>
      {(Object.keys(STATUS_LABELS) as ClientStatus[]).map(s => {
        const n = clients.filter(c => c.status === s && c.lat && c.lng).length;
        if (n === 0) return null;
        const active = filter === s;
        return (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: active ? STATUS_COLORS[s] : '#1e293b', color: active ? '#fff' : '#94a3b8', border: `1px solid ${active ? STATUS_COLORS[s] : '#334155'}`, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s], display: 'inline-block' }} />
            {STATUS_LABELS[s]} ({n})
          </button>
        );
      })}
    </>
  )}

  <button
    onClick={() => setPlacingLead(v => !v)}
    ...
  >
    📌 {placingLead ? 'Cancelar' : 'Novo Lead aqui'}
  </button>
</div>

            {preRegistrations.filter(p => p.lat != null && p.lng != null).length > 0 && (
              <button
                onClick={() => setShowLeads(v => !v)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: showLeads ? '#06b6d4' : '#1e293b',
                  color: showLeads ? '#fff' : '#94a3b8',
                  border: `1px solid ${showLeads ? '#06b6d4' : '#334155'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 11 }}>★</span>
                Leads ({preRegistrations.filter(p => p.lat != null && p.lng != null).length})
              </button>
            )}
          </>
        )}

        <button
          onClick={() => setPlacingLead(v => !v)}
          style={{
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            marginLeft: compact ? 0 : 'auto',
            background: placingLead ? '#0ea5e9' : '#1e293b',
            color: placingLead ? '#fff' : '#94a3b8',
            border: `1px solid ${placingLead ? '#0ea5e9' : '#334155'}`,
          }}
        >
          📌 {placingLead ? 'Cancelar' : 'Novo Lead aqui'}
        </button>
      </div>

      <div
        style={{
          flex: 1,
          borderRadius: 10,
          overflow: 'hidden',
          position: 'relative',
          minHeight: compact ? 240 : 520,
          cursor: placingLead ? 'crosshair' : 'grab',
        }}
      >
        <MapContainer
          key="main-map"
          center={SC_CENTER}
          zoom={compact ? 7 : 9}
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

          <LeadPlacementHandler
            active={placingLead}
            onMapClick={handleLeadMapClick}
          />

          {visible.map(client => (
            <Marker key={client.id} position={[client.lat!, client.lng!]} icon={makeLeafletIcon(client.status)}>
              <Popup minWidth={220} maxWidth={320}>
                {editingId === client.id ? (
                  <div style={{ fontFamily: 'system-ui', color: '#111', padding: 2 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>✏️ {client.name}</p>
                    <div style={{ marginBottom: 6 }}>
                      <label style={{ fontSize: 11, color: '#666' }}>Status</label>
                      <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as ClientStatus }))} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 5, padding: '4px 6px', fontSize: 12, marginTop: 2 }}>
                        {(Object.keys(STATUS_LABELS) as ClientStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 6 }}>
                      <label style={{ fontSize: 11, color: '#666' }}>Telefone</label>
                      <input value={editForm.tel ?? ''} onChange={e => setEditForm(f => ({ ...f, tel: e.target.value }))} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 5, padding: '4px 6px', fontSize: 12, marginTop: 2, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 11, color: '#666' }}>Observação</label>
                      <textarea value={editForm.obs ?? ''} onChange={e => setEditForm(f => ({ ...f, obs: e.target.value }))} rows={2} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 5, padding: '4px 6px', fontSize: 12, marginTop: 2, resize: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={saveEdit} disabled={saving} style={{ flex: 1, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 0', fontSize: 12, cursor: 'pointer' }}>{saving ? '...' : '✓ Salvar'}</button>
                      <button onClick={() => setEditingId(null)} style={{ flex: 1, background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, padding: '6px 0', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontFamily: 'system-ui', color: '#111', minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{client.name}</div>
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, marginBottom: 8, background: STATUS_COLORS[client.status] + '22', color: STATUS_COLORS[client.status], border: `1px solid ${STATUS_COLORS[client.status]}44` }}>{STATUS_LABELS[client.status]}</span>
                    {client.category && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>📂 {client.category}</div>}
                    <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6 }}>
                      {client.tel && <div>📞 <a href={`tel:${client.tel}`} style={{ color: '#2563eb' }}>{client.tel}</a></div>}
                      {client.tel2 && <div>📞 <a href={`tel:${client.tel2}`} style={{ color: '#2563eb' }}>{client.tel2}</a></div>}
                      {client.email && <div>✉️ <a href={`mailto:${client.email}`} style={{ color: '#2563eb', fontSize: 11 }}>{client.email}</a></div>}
                      {(client.city || client.state) && <div>📍 {[client.city, client.state].filter(Boolean).join(' — ')}</div>}
                      {client.obs && <div style={{ fontStyle: 'italic', color: '#9ca3af', fontSize: 11, marginTop: 4 }}>"{client.obs}"</div>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginTop: 10 }}>
                      <a href={client.maps_link ?? `https://www.google.com/maps?q=${client.lat},${client.lng}`} target="_blank" rel="noopener noreferrer" style={{ textAlign: 'center', background: '#16a34a', color: '#fff', textDecoration: 'none', borderRadius: 6, padding: '7px 2px', fontSize: 11, fontWeight: 600 }}>🗺️ Maps</a>
                      <button onClick={() => { setEditingId(client.id); setEditForm({ ...client }); }} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 2px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>✏️ Editar</button>
                      <button onClick={() => openCheckin(client)} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 2px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>✅ Check-in</button>
                    </div>
                  </div>
                )}
              </Popup>
            </Marker>
          ))}

          {visibleLeads.map(lead => (
            <Marker
              key={`lead-${lead.id}`}
              position={[lead.lat!, lead.lng!]}
              icon={makeLeafletIconLead(lead.status)}
            >
              <Popup minWidth={200} maxWidth={300}>
                <div style={{ fontFamily: 'system-ui', color: '#111', minWidth: 190 }}>
                  <div style={{ fontSize: 10, color: '#06b6d4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    ★ Lead / Pré-cadastro
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{lead.name}</div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      marginBottom: 8,
                      background: (LEAD_STATUS_COLORS[lead.status] ?? '#06b6d4') + '22',
                      color: LEAD_STATUS_COLORS[lead.status] ?? '#06b6d4',
                      border: `1px solid ${(LEAD_STATUS_COLORS[lead.status] ?? '#06b6d4')}44`,
                    }}
                  >
                    {LEAD_STATUS_LABELS[lead.status]}
                  </span>
                  <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6 }}>
                    {lead.tel && (
                      <div>📞 <a href={`tel:${lead.tel}`} style={{ color: '#2563eb' }}>{lead.tel}</a></div>
                    )}
                    {lead.source && (
                      <div>🔖 {SOURCE_LABELS[lead.source] ?? lead.source}</div>
                    )}
                    {lead.interest && (
                      <div style={{ fontSize: 11, color: '#6b7280' }}>💼 {lead.interest}</div>
                    )}
                    {lead.point_reference && (
                      <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginTop: 2 }}>
                        📌 {lead.point_reference}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 10 }}>
                    <a
                      href={lead.maps_link ?? `https://www.google.com/maps?q=${lead.lat},${lead.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textAlign: 'center', background: '#16a34a', color: '#fff', textDecoration: 'none', borderRadius: 6, padding: '7px 2px', fontSize: 11, fontWeight: 600 }}
                    >
                      🗺️ Maps
                    </a>
                    <a
                      href={`/dashboard/pre-registrations?edit=${lead.id}`}
                      style={{ textAlign: 'center', background: '#0891b2', color: '#fff', textDecoration: 'none', borderRadius: 6, padding: '7px 2px', fontSize: 11, fontWeight: 600 }}
                    >
                      ✏️ Editar
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}