'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Search, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';

interface Commission {
  id:string; referral_name?:string|null; client_name?:string|null;
  order_id?:string|null; amount:number; commission_type?:string|null;
  status:'pendente'|'paga'|'cancelada'; paid_at?:string|null;
  order_date?:string|null; order_total?:number|null; created_at:string;
}

const STATUS_CFG={
  pendente:{label:'Pendente',cls:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'},
  paga:    {label:'Paga',    cls:'bg-green-500/20 text-green-400 border-green-500/30'},
  cancelada:{label:'Cancelada',cls:'bg-red-500/20 text-red-400 border-red-500/30'},
};

export default function CommissionsPage() {
  const router=useRouter(); const {isAuthenticated}=useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const [commissions,setCommissions]=useState<Commission[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [filterStatus,setFilter]=useState<'todos'|'pendente'|'paga'|'cancelada'>('todos');
  const [confirming,setConfirming]=useState<string|null>(null);

  useEffect(()=>{if (!hydrated) return; if(!isAuthenticated)router.push('/auth/login');},[isAuthenticated,router]);

  const load=useCallback(async()=>{
    setLoading(true);
    const r=await apiFetch('/api/commissions'); const j=await r.json();
    setCommissions(j.commissions??[]); setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);

  const confirmPayment=async(id:string)=>{
    setConfirming(id);
    await apiFetch(`/api/commissions/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'paga'})});
    await load(); setConfirming(null);
  };

  const filtered=commissions.filter(c=>{
    const ms=(c.referral_name??'').toLowerCase().includes(search.toLowerCase())||(c.client_name??'').toLowerCase().includes(search.toLowerCase());
    return ms&&(filterStatus==='todos'||c.status===filterStatus);
  });

  const totalPendente=commissions.filter(c=>c.status==='pendente').reduce((s,c)=>s+Number(c.amount),0);
  const totalPago=commissions.filter(c=>c.status==='paga').reduce((s,c)=>s+Number(c.amount),0);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Comissões</h1>
          <p className="text-dark-400 text-sm mt-1">Controle de comissões dos indicadores</p>
        </div>

        {/* Cards de totais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
            <div className="flex items-center gap-3 mb-2"><Clock className="w-5 h-5 text-yellow-400"/><span className="text-dark-400 text-sm">A Pagar</span></div>
            <p className="text-2xl font-bold text-yellow-400">{totalPendente.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
            <p className="text-dark-500 text-xs mt-1">{commissions.filter(c=>c.status==='pendente').length} comissões pendentes</p>
          </div>
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
            <div className="flex items-center gap-3 mb-2"><CheckCircle className="w-5 h-5 text-green-400"/><span className="text-dark-400 text-sm">Total Pago</span></div>
            <p className="text-2xl font-bold text-green-400">{totalPago.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
            <p className="text-dark-500 text-xs mt-1">{commissions.filter(c=>c.status==='paga').length} comissões pagas</p>
          </div>
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
            <div className="flex items-center gap-3 mb-2"><DollarSign className="w-5 h-5 text-primary-400"/><span className="text-dark-400 text-sm">Total Geral</span></div>
            <p className="text-2xl font-bold text-white">{(totalPendente+totalPago).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
            <p className="text-dark-500 text-xs mt-1">{commissions.length} comissões no total</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 w-4 h-4 text-dark-500"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por indicador ou cliente..."
              className="w-full bg-dark-800 border border-dark-700 rounded-lg py-2 pl-9 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
          <select value={filterStatus} onChange={e=>setFilter(e.target.value as any)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none">
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendentes</option>
            <option value="paga">Pagas</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>

        {loading?<div className="text-center py-12 text-dark-400">Carregando...</div>
        :filtered.length===0?<div className="text-center py-12 text-dark-400">Nenhuma comissão encontrada</div>
        :<div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr className="border-b border-dark-700 text-dark-400 text-xs uppercase">
              <th className="text-left px-4 py-3">Indicador</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Venda</th>
              <th className="text-left px-4 py-3">Comissão</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Ação</th>
            </tr></thead>
            <tbody className="divide-y divide-dark-700">
              {filtered.map(c=>{
                const cfg=STATUS_CFG[c.status];
                return <tr key={c.id} className="hover:bg-dark-700/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium text-sm">{c.referral_name??'—'}</td>
                  <td className="px-4 py-3 text-dark-300 text-sm">{c.client_name??'—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-white text-sm">{Number(c.order_total??0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</div>
                    <div className="text-dark-500 text-xs">{c.order_date??''}</div>
                  </td>
                  <td className="px-4 py-3 text-green-400 font-bold text-sm">{Number(c.amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>{cfg.label}</span>
                    {c.paid_at&&<div className="text-dark-500 text-xs mt-0.5">Pago em: {new Date(c.paid_at).toLocaleDateString('pt-BR')}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status==='pendente'&&(
                      <button onClick={()=>confirmPayment(c.id)} disabled={confirming===c.id}
                        className="flex items-center gap-1 ml-auto text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        <CheckCircle className="w-3.5 h-3.5"/>
                        {confirming===c.id?'...':'Confirmar Pagamento'}
                      </button>
                    )}
                  </td>
                </tr>;
              })}
            </tbody>
          </table></div>
        </div>}
      </div>
    </DashboardShell>
  );
}
