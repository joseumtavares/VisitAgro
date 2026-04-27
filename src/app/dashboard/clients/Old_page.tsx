'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Plus, Search, Pencil, Trash2, Phone, Mail, MapPin, ExternalLink, Navigation, Copy, CheckCircle } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import dynamic from 'next/dynamic';
const GpsPickerMap = dynamic(
  () => import('@/components/map/GpsPickerMap'),
  { ssr: false }
);
import LeafletProvider from '@/components/map/LeafletProvider';

type ClientStatus = 'interessado'|'visitado'|'agendado'|'comprou'|'naointeressado'|'retornar'|'outro';
interface Client {
  id:string; name:string; status:ClientStatus; category?:string|null;
  tel?:string|null; tel2?:string|null; email?:string|null;
  address?:string|null; city?:string|null; state?:string|null; zip_code?:string|null;
  lat?:number|null; lng?:number|null; maps_link?:string|null; obs?:string|null;
}
const STATUS_BADGE:Record<ClientStatus,string>={
  interessado:'bg-blue-500/20 text-blue-400 border-blue-500/30',
  visitado:'bg-green-500/20 text-green-400 border-green-500/30',
  agendado:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  comprou:'bg-purple-500/20 text-purple-400 border-purple-500/30',
  naointeressado:'bg-gray-500/20 text-gray-400 border-gray-500/30',
  retornar:'bg-red-500/20 text-red-400 border-red-500/30',
  outro:'bg-gray-500/20 text-gray-400 border-gray-500/30',
};
const STATUS_LABELS:Record<ClientStatus,string>={
  interessado:'Interessado',visitado:'Visitado',agendado:'Agendado',
  comprou:'Comprou',naointeressado:'Não Interessado',retornar:'Retornar',outro:'Outro',
};
const EMPTY:Partial<Client>={name:'',status:'interessado',category:'geral',tel:'',tel2:'',email:'',address:'',city:'',state:'',zip_code:'',obs:''};

export default function ClientsPage() {
  const router=useRouter(); const {isAuthenticated}=useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const [clients,setClients]=useState<Client[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [filterStatus,setFilter]=useState<ClientStatus|'todos'>('todos');
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState<Client|null>(null);
  const [form,setForm]=useState<Partial<Client>>(EMPTY);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [cepLoading,setCepLoading]=useState(false);
  const [geoLoading,setGeoLoading]=useState(false);
  const [geoError,setGeoError]=useState('');
  // ── NOVO: modal do mapa picker ────────────────────────────
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  useEffect(()=>{if (!hydrated) return; if(!isAuthenticated)router.push('/auth/login');},[isAuthenticated,router]);

  const load=useCallback(async()=>{
    setLoading(true);
    const r=await apiFetch('/api/clients'); const j=await r.json();
    setClients(j.clients??[]); setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);

  const openNew=()=>{setEditing(null);setForm(EMPTY);setError('');setGeoError('');setShowModal(true);};
  const openEdit=(c:Client)=>{setEditing(c);setForm({...c});setError('');setGeoError('');setShowModal(true);};

  const lookupCep=async()=>{
    const cep=(form.zip_code??'').replace(/\D/g,'');
    if(cep.length!==8){setError('CEP deve ter 8 dígitos');return;}
    setCepLoading(true);
    try{
      const r=await apiFetch(`/api/cep/${cep}`); const j=await r.json();
      if(j.error){setError(j.error);return;}
      setForm(f=>({...f,address:j.address??f.address,city:j.city,state:j.state,zip_code:j.zip_code}));
    }catch{setError('Falha ao buscar CEP');}
    finally{setCepLoading(false);}
  };

  const save=async()=>{
    if(!form.name?.trim()){setError('Nome obrigatório');return;}
    setSaving(true);
    try{
      const url=editing?`/api/clients/${editing.id}`:'/api/clients';
      const method=editing?'PUT':'POST';
      const r=await apiFetch(url,{method,body:JSON.stringify(form)});
      if(!r.ok){const j=await r.json();throw new Error(j.error);}
      await load(); setShowModal(false);
    }catch(e:any){setError(e.message);}
    finally{setSaving(false);}
  };

  const remove=async(id:string)=>{
    if(!confirm('Remover este cliente?'))return;
    const r=await apiFetch(`/api/clients/${id}`,{method:'DELETE'});
    if(!r.ok){const j=await r.json().catch(()=>({}));setError(j.error||'Erro ao remover cliente.');return;}
    await load();
  };

  // ── Confirma localização vinda do GpsPickerMap ────────────
  const handleMapConfirm = (lat: number, lng: number) => {
    const maps_link = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
    setForm(f => ({ ...f, lat, lng, maps_link }));
    setShowMapPicker(false);
  };

  // ── Copia coordenadas pro clipboard ───────────────────────
  const copyCoords = async () => {
    if (!form.lat || !form.lng) return;
    const text = `${(form.lat as number).toFixed(6)}, ${(form.lng as number).toFixed(6)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    } catch {
      // fallback silencioso
    }
  };

  const filtered=clients.filter(c=>{
    const ms=c.name.toLowerCase().includes(search.toLowerCase())||c.tel?.includes(search)||c.city?.toLowerCase().includes(search.toLowerCase());
    return ms&&(filterStatus==='todos'||c.status===filterStatus);
  });
  const f=(k:keyof Client,v:any)=>setForm(p=>({...p,[k]:v}));

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-white">Clientes</h1>
            <p className="text-dark-400 text-sm mt-1">{clients.length} cadastrados</p></div>
          <button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4"/>Novo Cliente</button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 w-4 h-4 text-dark-500"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome, telefone ou cidade..."
              className="w-full bg-dark-800 border border-dark-700 rounded-lg py-2 pl-9 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
          <select value={filterStatus} onChange={e=>setFilter(e.target.value as any)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500">
            <option value="todos">Todos os status</option>
            {(Object.keys(STATUS_LABELS) as ClientStatus[]).map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        {loading?<div className="text-center py-12 text-dark-400">Carregando...</div>
        :filtered.length===0?<div className="text-center py-12 text-dark-400">
            <p>Nenhum cliente encontrado</p>
            <button onClick={openNew} className="mt-3 text-primary-400 hover:text-primary-300 text-sm">+ Cadastrar primeiro cliente</button>
          </div>
        :<div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full">
              <thead><tr className="border-b border-dark-700 text-dark-400 text-xs uppercase">
                <th className="text-left px-4 py-3">Nome</th><th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Contato</th><th className="text-left px-4 py-3">Localização</th>
                <th className="text-right px-4 py-3">Ações</th></tr></thead>
              <tbody className="divide-y divide-dark-700">
                {filtered.map(c=>(
                  <tr key={c.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3"><div className="text-white font-medium text-sm">{c.name}</div>
                      {c.category&&<div className="text-dark-500 text-xs mt-0.5">{c.category}</div>}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[c.status]}`}>{STATUS_LABELS[c.status]}</span></td>
                    <td className="px-4 py-3"><div className="space-y-0.5">
                      {c.tel&&<a href={`tel:${c.tel}`} className="flex items-center gap-1 text-xs text-dark-300 hover:text-white"><Phone className="w-3 h-3"/>{c.tel}</a>}
                      {c.tel2&&<a href={`tel:${c.tel2}`} className="flex items-center gap-1 text-xs text-dark-400 hover:text-white"><Phone className="w-3 h-3"/>{c.tel2}</a>}
                      {c.email&&<a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-dark-300 hover:text-white truncate max-w-[160px]"><Mail className="w-3 h-3"/>{c.email}</a>}
                      {!c.tel&&!c.email&&<span className="text-dark-600 text-xs">—</span>}
                    </div></td>
                    <td className="px-4 py-3"><div className="text-xs text-dark-300">{[c.city,c.state].filter(Boolean).join(' — ')||'—'}</div>
                      {(c.maps_link||(c.lat&&c.lng))&&<a href={c.maps_link??`https://www.google.com/maps?q=${c.lat},${c.lng}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-0.5"><MapPin className="w-3 h-3"/>Ver no mapa<ExternalLink className="w-3 h-3"/></a>}
                    </td>
                    <td className="px-4 py-3"><div className="flex items-center justify-end gap-2">
                      <button onClick={()=>openEdit(c)} className="text-dark-400 hover:text-white p-1.5 rounded hover:bg-dark-700 transition-colors"><Pencil className="w-4 h-4"/></button>
                      <button onClick={()=>remove(c.id)} className="text-dark-400 hover:text-red-400 p-1.5 rounded hover:bg-dark-700 transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>}
      </div>

      {/* ── MODAL DE CADASTRO/EDIÇÃO ── */}
      {showModal&&(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-700 flex justify-between items-center sticky top-0 bg-dark-800">
              <h2 className="text-white font-semibold text-lg">{editing?'Editar Cliente':'Novo Cliente'}</h2>
              <button onClick={()=>setShowModal(false)} className="text-dark-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {error&&<div className="bg-red-500/10 border border-red-500 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><label className="block text-xs text-dark-400 mb-1">Nome *</label>
                  <input value={form.name??''} onChange={e=>f('name',e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                <div><label className="block text-xs text-dark-400 mb-1">Status</label>
                  <select value={form.status??'interessado'} onChange={e=>f('status',e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    {(Object.keys(STATUS_LABELS) as ClientStatus[]).map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select></div>
                <div><label className="block text-xs text-dark-400 mb-1">Categoria</label>
                  <input value={form.category??''} onChange={e=>f('category',e.target.value)} placeholder="Ex: Agricultor, Pecuarista"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                <div><label className="block text-xs text-dark-400 mb-1">Telefone 1</label>
                  <input value={form.tel??''} onChange={e=>f('tel',e.target.value)} placeholder="(48) 99999-9999"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                <div><label className="block text-xs text-dark-400 mb-1">Telefone 2</label>
                  <input value={form.tel2??''} onChange={e=>f('tel2',e.target.value)} placeholder="(48) 99999-9999"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                <div className="sm:col-span-2"><label className="block text-xs text-dark-400 mb-1">Email</label>
                  <input value={form.email??''} onChange={e=>f('email',e.target.value)} type="email"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>

                {/* CEP com busca automática */}
                <div><label className="block text-xs text-dark-400 mb-1">CEP</label>
                  <div className="flex gap-2">
                    <input value={form.zip_code??''} onChange={e=>f('zip_code',e.target.value)} placeholder="88900-000"
                      className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/>
                    <button onClick={lookupCep} disabled={cepLoading}
                      className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded-lg disabled:opacity-50 whitespace-nowrap">
                      {cepLoading?'…':'Buscar'}</button>
                  </div></div>
                <div><label className="block text-xs text-dark-400 mb-1">Estado</label>
                  <input value={form.state??''} onChange={e=>f('state',e.target.value)} placeholder="SC"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                <div className="sm:col-span-2"><label className="block text-xs text-dark-400 mb-1">Endereço</label>
                  <input value={form.address??''} onChange={e=>f('address',e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                <div><label className="block text-xs text-dark-400 mb-1">Cidade</label>
                  <input value={form.city??''} onChange={e=>f('city',e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>

                {/* ── SEÇÃO DE LOCALIZAÇÃO ────────────────────────────── */}
                <div className="sm:col-span-2">
                  <div className="border-t border-dark-700 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-dark-400 font-semibold uppercase tracking-wide">
                        📍 Localização no Mapa
                      </label>
                    </div>

                    {/* Busca por endereço (Nominatim) — preservada do fluxo original */}
                    <div className="mb-3">
                      <label className="block text-xs text-dark-400 mb-1">
                        Buscar Endereço no Mapa <span className="text-dark-500">(Nominatim)</span>
                      </label>
                      <div className="flex gap-2">
                        <input id="geo-search-input" placeholder="Ex: Araranguá SC, Rua XV de Novembro 100..."
                          className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                          onKeyDown={(e)=>{if(e.key==='Enter'){e.preventDefault();(document.getElementById('geo-search-btn') as HTMLButtonElement)?.click();}}}
                        />
                        <button id="geo-search-btn" type="button"
                          onClick={async()=>{
                            const q=(document.getElementById('geo-search-input') as HTMLInputElement)?.value?.trim();
                            if(!q||q.length<3)return;
                            setGeoLoading(true);
                            try{
                              const res=await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1`,{headers:{'Accept-Language':'pt-BR,pt'}});
                              const data=await res.json();
                              if(data.length>0){
                                const r=data[0];
                                const lat=parseFloat(r.lat),lng=parseFloat(r.lon);
                                const a=r.address||{};
                                const city=a.city||a.town||a.village||a.municipality||'';
                                const state=a.state||'';
                                const road=a.road||'';
                                setForm(prev=>({...prev,
                                  lat,lng,
                                  maps_link:`https://www.google.com/maps?q=${lat},${lng}`,
                                  city:city||prev.city,
                                  state:state||prev.state,
                                  address:road||prev.address,
                                }));
                                setGeoError('');
                              }else{setGeoError('Endereço não encontrado. Tente ser mais específico.');}
                            }catch{setGeoError('Erro ao buscar endereço.');}
                            finally{setGeoLoading(false);}
                          }}
                          disabled={geoLoading}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap">
                          {geoLoading?'⏳':'📍 Buscar'}
                        </button>
                      </div>
                      {geoError&&<p className="text-red-400 text-xs mt-1">{geoError}</p>}
                    </div>

                    {/* ── NOVO: Botão para abrir o mapa picker ── */}
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="w-full flex items-center justify-center gap-2 bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-primary-500 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all group"
                    >
                      <MapPin className="w-4 h-4 text-primary-400 group-hover:scale-110 transition-transform" />
                      {form.lat && form.lng
                        ? '✏️ Ajustar localização no mapa'
                        : '🗺️ Selecionar localização no mapa'}
                    </button>

                    {/* ── NOVO: Card de localização confirmada ── */}
                    {form.lat && form.lng && (
                      <div className="mt-3 bg-dark-900 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-green-400 font-medium mb-0.5">Localização definida</p>
                              <p className="text-xs text-dark-300 font-mono truncate">
                                {(form.lat as number).toFixed(5)}, {(form.lng as number).toFixed(5)}
                              </p>
                            </div>
                          </div>
                          {/* Botões do card */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <a
                              href={form.maps_link ?? `https://www.google.com/maps?q=${form.lat},${form.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir no Google Maps"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 rounded-lg text-xs transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Maps
                            </a>
                            <button
                              type="button"
                              onClick={copyCoords}
                              title="Copiar coordenadas"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-dark-300 hover:text-white rounded-lg text-xs transition-colors"
                            >
                              {copiedCoords
                                ? <><CheckCircle className="w-3 h-3 text-green-400" /><span className="text-green-400">Copiado</span></>
                                : <><Copy className="w-3 h-3" />Copiar</>
                              }
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowMapPicker(true)}
                              title="Editar localização"
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-dark-700 hover:bg-dark-600 border border-dark-600 text-dark-300 hover:text-white rounded-lg text-xs transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                              Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Campos manuais de lat/lng/maps_link — preservados do original */}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs text-dark-400 mb-1">Latitude</label>
                        <input value={form.lat??''} onChange={e=>f('lat',parseFloat(e.target.value)||null)} type="number" step="any" placeholder="-28.935"
                          className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/>
                      </div>
                      <div>
                        <label className="block text-xs text-dark-400 mb-1">Longitude</label>
                        <input value={form.lng??''} onChange={e=>f('lng',parseFloat(e.target.value)||null)} type="number" step="any" placeholder="-49.486"
                          className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs text-dark-400 mb-1">Link Google Maps</label>
                      <input value={form.maps_link??''} onChange={e=>f('maps_link',e.target.value)} placeholder="https://maps.google.com/..."
                        className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2"><label className="block text-xs text-dark-400 mb-1">Observações</label>
                  <textarea value={form.obs??''} onChange={e=>f('obs',e.target.value)} rows={3}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"/></div>
              </div>
            </div>
            <div className="p-6 border-t border-dark-700 flex gap-3 justify-end sticky bottom-0 bg-dark-800">
              <button onClick={()=>setShowModal(false)} className="px-4 py-2 text-dark-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={save} disabled={saving}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving?'Salvando...':editing?'Salvar alterações':'Cadastrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DO MAPA PICKER (fullscreen) ── */}
      {showMapPicker && (
        <div
          className="fixed inset-0 z-[60] bg-dark-950"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {/* Header do modal do mapa */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: '#1e293b',
              borderBottom: '1px solid #334155',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin style={{ width: 18, height: 18, color: '#10b981' }} />
              <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>
                Selecionar localização no mapa
              </span>
            </div>
            <button
              onClick={() => setShowMapPicker(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: 20,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
              }}
            >
              ✕
            </button>
          </div>

          {/* Instrução */}
          <div
            style={{
              background: '#0f172a',
              padding: '8px 16px',
              fontSize: 12,
              color: '#94a3b8',
              borderBottom: '1px solid #1e293b',
              flexShrink: 0,
            }}
          >
            Clique no mapa ou arraste o marcador para definir a localização. Use 📡 para detectar sua posição atual.
          </div>

          {/* Mapa ocupando o restante da tela */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <LeafletProvider>
              <GpsPickerMap
                initialLat={form.lat as number | undefined}
                initialLng={form.lng as number | undefined}
                onConfirm={handleMapConfirm}
                onCancel={() => setShowMapPicker(false)}
              />
            </LeafletProvider>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}