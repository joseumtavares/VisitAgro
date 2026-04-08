'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Search, RefreshCw } from 'lucide-react';

interface Log {
  id:number; action:string; user_id?:string|null; username?:string|null;
  ip?:string|null; meta?:any; created_at:string;
}

const ACTION_COLOR=(action:string)=>{
  if(action.includes('LIMPEZA')||action.includes('DELETE')) return 'text-red-400 bg-red-500/10 border-red-500/30';
  if(action.includes('COMISSÃO')) return 'text-green-400 bg-green-500/10 border-green-500/30';
  if(action.includes('VENDA')||action.includes('CADASTRO')) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  if(action.includes('MANUTENÇÃO')) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  if(action.includes('ACESSO')||action.includes('LOGIN')) return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
  return 'text-dark-300 bg-dark-700 border-dark-600';
};

export default function LogsPage() {
  const router=useRouter(); const {isAuthenticated}=useAuthStore();
  const [logs,setLogs]=useState<Log[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');

  useEffect(()=>{if(!isAuthenticated)router.push('/auth/login');},[isAuthenticated,router]);

  const load=useCallback(async()=>{
    setLoading(true);
    const r=await fetch('/api/admin/logs'); const j=await r.json();
    setLogs(j.logs??[]); setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);

  const filtered=logs.filter(l=>
    l.action.toLowerCase().includes(search.toLowerCase())||
    (l.username??'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Logs Administrativos</h1>
            <p className="text-dark-400 text-sm mt-1">{logs.length} registros</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 text-dark-400 hover:text-white border border-dark-700 hover:border-dark-500 px-3 py-2 rounded-lg text-sm transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>Atualizar
          </button>
        </div>

        <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-dark-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por ação ou usuário..."
            className="w-full bg-dark-800 border border-dark-700 rounded-lg py-2 pl-9 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>

        {loading?<div className="text-center py-12 text-dark-400">Carregando...</div>
        :filtered.length===0?<div className="text-center py-12 text-dark-400">Nenhum log encontrado</div>
        :<div className="space-y-2">
          {filtered.map(l=>(
            <div key={l.id} className="bg-dark-800 rounded-lg border border-dark-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 min-w-0">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border mr-2 ${ACTION_COLOR(l.action)}`}>
                  {l.action}
                </span>
                {l.meta&&(
                  <span className="text-dark-500 text-xs">{JSON.stringify(l.meta).slice(0,80)}{JSON.stringify(l.meta).length>80?'…':''}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-dark-500 shrink-0">
                {l.username&&<span>👤 {l.username}</span>}
                {l.ip&&<span>🌐 {l.ip}</span>}
                <span>{new Date(l.created_at).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </DashboardShell>
  );
}
