'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Settings, MapPin, Shield, Building2, Key, CheckCircle } from 'lucide-react';

interface Company { id:string; name:string; trade_name?:string; document?:string; address?:string; city?:string; state?:string; zip_code?:string; phone?:string; email?:string; }

function FToast({msg,type}:{msg:string;type:'success'|'error'}) {
  if(!msg)return null;
  const bg=type==='success'?'bg-green-900/80 border-green-600':'bg-red-900/80 border-red-600';
  return <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border text-white text-sm font-medium shadow-lg ${bg}`}>{msg}</div>;
}

export default function SettingsPage() {
  const router=useRouter();
  const {isAuthenticated,user,token}=useAuthStore();
  const [company,setCompany]=useState<Partial<Company>>({});
  const [companyId,setCompanyId]=useState<string|null>(null);
  const [loadingCo,setLoadingCo]=useState(true);
  const [savingCo,setSavingCo]=useState(false);
  const [pwForm,setPwForm]=useState({current:'',next:'',confirm:''});
  const [savingPw,setSavingPw]=useState(false);
  const [toast,setToast]=useState<{msg:string;type:'success'|'error'}|null>(null);

  useEffect(()=>{if(!isAuthenticated)router.push('/auth/login');},[isAuthenticated,router]);

  const showToast=(msg:string,type:'success'|'error'='success')=>{
    setToast({msg,type});setTimeout(()=>setToast(null),3500);
  };

  const authFetch=useCallback((url:string,opts:RequestInit={})=>
    fetch(url,{...opts,headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`,...(opts.headers||{})}}),
    [token]);

  const loadCompany=useCallback(async()=>{
    try{
      setLoadingCo(true);
      const res=await authFetch('/api/settings');
      if(res.ok){const j=await res.json();if(j.company){setCompany(j.company);setCompanyId(j.company.id);}}
    }catch{}finally{setLoadingCo(false);}
  },[authFetch]);

  useEffect(()=>{if(isAuthenticated)loadCompany();},[isAuthenticated,loadCompany]);

  const saveCompany=async()=>{
    if(!company.name?.trim()){showToast('Nome da empresa é obrigatório.','error');return;}
    setSavingCo(true);
    try{
      const res=await authFetch('/api/settings/company',{method:'POST',body:JSON.stringify({...company,id:companyId})});
      if(!res.ok){const j=await res.json();throw new Error(j.error||'Erro ao salvar');}
      showToast('✅ Empresa atualizada!');await loadCompany();
    }catch(e:any){showToast(e.message,'error');}finally{setSavingCo(false);}
  };

  const changePassword=async()=>{
    if(!pwForm.current){showToast('Informe a senha atual.','error');return;}
    if(pwForm.next.length<6){showToast('Nova senha: mínimo 6 caracteres.','error');return;}
    if(pwForm.next!==pwForm.confirm){showToast('As senhas não coincidem.','error');return;}
    setSavingPw(true);
    try{
      const res=await authFetch('/api/auth/change-password',{method:'POST',body:JSON.stringify({currentPassword:pwForm.current,newPassword:pwForm.next})});
      if(!res.ok){const j=await res.json();throw new Error(j.error||'Erro');}
      showToast('✅ Senha alterada!');setPwForm({current:'',next:'',confirm:''});
    }catch(e:any){showToast(e.message,'error');}finally{setSavingPw(false);}
  };

  const cf=(k:keyof Company,v:string)=>setCompany(p=>({...p,[k]:v}));
  const u=user as any;
  if(!isAuthenticated)return null;

  const input=(val:string,onChange:(v:string)=>void,placeholder='',type='text')=>(
    <input type={type} value={val} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/>
  );

  return (
    <DashboardShell>
      {toast&&<FToast msg={toast.msg} type={toast.type}/>}
      <div className="space-y-6 max-w-2xl">
        <div><h1 className="text-2xl font-bold text-white">Configurações</h1><p className="text-dark-400 text-sm mt-1">Empresa, perfil e preferências</p></div>

        {/* Empresa */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <div className="flex items-center gap-3 mb-5"><Building2 className="w-5 h-5 text-primary-500"/><h2 className="text-white font-semibold">Dados da Empresa</h2></div>
          {loadingCo?<p className="text-dark-400 text-sm">Carregando...</p>:(
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-xs text-dark-400 mb-1">Razão Social *</label>{input(company.name??'',v=>cf('name',v),'Empresa Ltda')}</div>
              <div><label className="block text-xs text-dark-400 mb-1">Nome Fantasia</label>{input(company.trade_name??'',v=>cf('trade_name',v),'Nome Fantasia')}</div>
              <div><label className="block text-xs text-dark-400 mb-1">CNPJ</label>{input(company.document??'',v=>cf('document',v),'00.000.000/0001-00')}</div>
              <div><label className="block text-xs text-dark-400 mb-1">Telefone</label>{input(company.phone??'',v=>cf('phone',v),'(48) 99999-9999')}</div>
              <div><label className="block text-xs text-dark-400 mb-1">E-mail</label>{input(company.email??'',v=>cf('email',v),'contato@empresa.com.br','email')}</div>
              <div className="sm:col-span-2"><label className="block text-xs text-dark-400 mb-1">Endereço</label>{input(company.address??'',v=>cf('address',v),'Rua, número, bairro')}</div>
              <div><label className="block text-xs text-dark-400 mb-1">Cidade</label>{input(company.city??'',v=>cf('city',v),'Araranguá')}</div>
              <div><label className="block text-xs text-dark-400 mb-1">Estado</label>{input(company.state??'',v=>cf('state',v),'SC')}</div>
              <div className="sm:col-span-2 flex justify-end pt-1">
                <button onClick={saveCompany} disabled={savingCo}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {savingCo?'⏳ Salvando...':<><CheckCircle className="w-4 h-4"/>Salvar Empresa</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Perfil */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <div className="flex items-center gap-3 mb-4"><Shield className="w-5 h-5 text-primary-500"/><h2 className="text-white font-semibold">Perfil do Usuário</h2></div>
          <div className="space-y-1 text-sm">
            {([['Usuário',u?.username??'—'],['E-mail',u?.email??'—'],['Perfil',u?.role??'—'],['Workspace',u?.workspace??'principal']] as [string,string][]).map(([l,v])=>(
              <div key={l} className="flex justify-between items-center py-2 border-b border-dark-700 last:border-0">
                <span className="text-dark-400">{l}</span><span className="text-white font-medium capitalize">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Troca de Senha */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <div className="flex items-center gap-3 mb-5"><Key className="w-5 h-5 text-primary-500"/><h2 className="text-white font-semibold">Alterar Senha</h2></div>
          <div className="space-y-4">
            {([['current','Senha Atual'],['next','Nova Senha'],['confirm','Confirmar Nova Senha']] as [keyof typeof pwForm,string][]).map(([f,l])=>(
              <div key={f}><label className="block text-xs text-dark-400 mb-1">{l}</label>
                <input type="password" value={pwForm[f]} onChange={e=>setPwForm(p=>({...p,[f]:e.target.value}))} placeholder="••••••••"
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/>
              </div>
            ))}
            <div className="flex justify-end">
              <button onClick={changePassword} disabled={savingPw}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {savingPw?'⏳ Alterando...':<><Key className="w-4 h-4"/>Alterar Senha</>}
              </button>
            </div>
          </div>
        </div>

        {/* Sistema */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <div className="flex items-center gap-3 mb-4"><Settings className="w-5 h-5 text-primary-500"/><h2 className="text-white font-semibold">Sistema</h2></div>
          <div className="text-sm space-y-1">
            {([['Versão','0.8.1'],['Frontend','Next.js 14 + React 18'],['Backend','Vercel Serverless (gru1)'],['Banco','Supabase — PostgreSQL 15'],['Auth','JWT HS256 + bcrypt rounds=12'],['Mapas','Leaflet + OpenStreetMap + Nominatim']] as [string,string][]).map(([k,v])=>(
              <div key={k} className="flex justify-between py-1.5 border-b border-dark-700/40 last:border-0">
                <span className="text-dark-400">{k}</span><span className="text-dark-200 text-xs font-mono">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
