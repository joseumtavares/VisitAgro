'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Plus, Search, Pencil, Trash2, Percent, DollarSign } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';

interface Referral {
  id:string; name:string; document?:string|null; tel?:string|null; email?:string|null;
  commission_type:'fixed'|'percent'; commission_pct?:number|null; commission?:number|null;
  bank_name?:string|null; bank_agency?:string|null; bank_account?:string|null; bank_pix?:string|null;
  active:boolean;
}
const EMPTY:Partial<Referral>={name:'',document:'',tel:'',email:'',commission_type:'fixed',commission_pct:0,commission:0,bank_name:'',bank_agency:'',bank_account:'',bank_pix:''};

export default function ReferralsPage() {
  const router=useRouter(); const {isAuthenticated}=useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const [referrals,setReferrals]=useState<Referral[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState<Referral|null>(null);
  const [form,setForm]=useState<Partial<Referral>>(EMPTY);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{if (!hydrated) return; if(!isAuthenticated)router.push('/auth/login');},[isAuthenticated,router]);
  const load=useCallback(async()=>{
    setLoading(true);
    const r=await apiFetch('/api/referrals'); const j=await r.json();
    setReferrals(j.referrals??[]); setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);

  const openNew=()=>{setEditing(null);setForm(EMPTY);setError('');setShowModal(true);};
  const openEdit=(r:Referral)=>{setEditing(r);setForm({...r});setError('');setShowModal(true);};
  const save=async()=>{
    if(!form.name?.trim()){setError('Nome obrigatório');return;}
    setSaving(true);
    try{
      const url=editing?`/api/referrals/${editing.id}`:'/api/referrals';
      const method=editing?'PUT':'POST';
      const r=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      if(!r.ok){const j=await r.json();throw new Error(j.error);}
      await load(); setShowModal(false);
    }catch(e:any){setError(e.message);}finally{setSaving(false);}
  };
  const remove=async(id:string)=>{
    if(!confirm('Remover este indicador?'))return;
    await apiFetch(`/api/referrals/${id}`,{method:'DELETE'}); await load();
  };
  const filtered=referrals.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())||r.tel?.includes(search));
  const f=(k:keyof Referral,v:any)=>setForm(p=>({...p,[k]:v}));

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-white">Indicadores</h1>
            <p className="text-dark-400 text-sm mt-1">{referrals.length} cadastrados</p></div>
          <button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4"/>Novo Indicador</button>
        </div>
        <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-dark-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar indicadores..."
            className="w-full bg-dark-800 border border-dark-700 rounded-lg py-2 pl-9 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>

        {loading?<div className="text-center py-12 text-dark-400">Carregando...</div>
        :filtered.length===0?<div className="text-center py-12 text-dark-400">Nenhum indicador encontrado</div>
        :<div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full">
              <thead><tr className="border-b border-dark-700 text-dark-400 text-xs uppercase">
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Contato</th>
                <th className="text-left px-4 py-3">Comissão</th>
                <th className="text-left px-4 py-3">Dados Bancários</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-dark-700">
                {filtered.map(r=>(
                  <tr key={r.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3"><div className="text-white font-medium text-sm">{r.name}</div>
                      {r.document&&<div className="text-dark-500 text-xs">CPF: {r.document}</div>}</td>
                    <td className="px-4 py-3"><div className="space-y-0.5 text-xs text-dark-300">
                      {r.tel&&<div>📞 {r.tel}</div>}
                      {r.email&&<div>✉️ {r.email}</div>}
                    </div></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${r.commission_type==='percent'?'bg-blue-500/20 text-blue-400 border-blue-500/30':'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                        {r.commission_type==='percent'?<><Percent className="w-3 h-3"/>{r.commission_pct}%</>:<><DollarSign className="w-3 h-3"/>R$ {Number(r.commission??0).toFixed(2)}</>}
                      </span>
                    </td>
                    <td className="px-4 py-3"><div className="text-xs text-dark-400 space-y-0.5">
                      {r.bank_name&&<div>{r.bank_name}{r.bank_agency?` Ag.${r.bank_agency}`:''}{r.bank_account?` Cc.${r.bank_account}`:''}</div>}
                      {r.bank_pix&&<div>Pix: {r.bank_pix}</div>}
                      {!r.bank_name&&!r.bank_pix&&<span className="text-dark-600">—</span>}
                    </div></td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-2">
                      <button onClick={()=>openEdit(r)} className="text-dark-400 hover:text-white p-1.5 rounded hover:bg-dark-700"><Pencil className="w-4 h-4"/></button>
                      <button onClick={()=>remove(r.id)} className="text-dark-400 hover:text-red-400 p-1.5 rounded hover:bg-dark-700"><Trash2 className="w-4 h-4"/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>}
      </div>

      {showModal&&(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-700 flex justify-between items-center sticky top-0 bg-dark-800">
              <h2 className="text-white font-semibold">{editing?'Editar Indicador':'Novo Indicador'}</h2>
              <button onClick={()=>setShowModal(false)} className="text-dark-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {error&&<div className="bg-red-500/10 border border-red-500 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs text-dark-400 mb-1">Nome *</label>
                  <input value={form.name??''} onChange={e=>f('name',e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                <div><label className="block text-xs text-dark-400 mb-1">CPF</label>
                  <input value={form.document??''} onChange={e=>f('document',e.target.value)} placeholder="000.000.000-00" className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                <div><label className="block text-xs text-dark-400 mb-1">Telefone</label>
                  <input value={form.tel??''} onChange={e=>f('tel',e.target.value)} placeholder="(48) 99999-9999" className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                <div className="col-span-2"><label className="block text-xs text-dark-400 mb-1">Email</label>
                  <input value={form.email??''} onChange={e=>f('email',e.target.value)} type="email" className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>

                <div><label className="block text-xs text-dark-400 mb-1">Tipo de Comissão</label>
                  <select value={form.commission_type??'fixed'} onChange={e=>f('commission_type',e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="fixed">Valor Fixo (R$)</option>
                    <option value="percent">Percentual (%)</option>
                  </select></div>
                {form.commission_type==='percent'
                  ?<div><label className="block text-xs text-dark-400 mb-1">Percentual (%)</label>
                    <input value={form.commission_pct??0} onChange={e=>f('commission_pct',parseFloat(e.target.value)||0)} type="number" step="0.1" min="0" max="100" className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                  :<div><label className="block text-xs text-dark-400 mb-1">Valor Fixo (R$)</label>
                    <input value={form.commission??0} onChange={e=>f('commission',parseFloat(e.target.value)||0)} type="number" step="0.01" min="0" className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>}

                <div className="col-span-2 pt-2 border-t border-dark-700">
                  <p className="text-xs text-dark-400 mb-3 font-medium uppercase tracking-wide">Dados Bancários</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-dark-400 mb-1">Banco</label>
                      <input value={form.bank_name??''} onChange={e=>f('bank_name',e.target.value)} placeholder="Ex: Nubank, Bradesco" className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                    <div><label className="block text-xs text-dark-400 mb-1">Agência</label>
                      <input value={form.bank_agency??''} onChange={e=>f('bank_agency',e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                    <div><label className="block text-xs text-dark-400 mb-1">Conta</label>
                      <input value={form.bank_account??''} onChange={e=>f('bank_account',e.target.value)} className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                    <div><label className="block text-xs text-dark-400 mb-1">Chave Pix</label>
                      <input value={form.bank_pix??''} onChange={e=>f('bank_pix',e.target.value)} placeholder="CPF, email, telefone..." className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-dark-700 flex gap-3 justify-end">
              <button onClick={()=>setShowModal(false)} className="px-4 py-2 text-dark-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={save} disabled={saving} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving?'Salvando...':editing?'Salvar':'Cadastrar'}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
