'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Shield, RefreshCw, Trash2, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

const CLEANUP_GROUPS=[
  {key:'clients',    label:'Clientes',    desc:'Remove todos os clientes cadastrados',     color:'text-orange-400'},
  {key:'orders',     label:'Vendas',      desc:'Remove pedidos, itens e comissões',        color:'text-red-400'},
  {key:'products',   label:'Produtos',    desc:'Remove produtos do catálogo',              color:'text-orange-400'},
  {key:'commissions',label:'Comissões',   desc:'Limpa histórico de comissões',             color:'text-red-400'},
  {key:'visits',     label:'Visitas',     desc:'Remove registro de visitas',               color:'text-orange-400'},
  {key:'all',        label:'TUDO',        desc:'⚠️ Remove todos os dados operacionais',   color:'text-red-500'},
];

export default function MaintenancePage() {
  const router=useRouter(); const {isAuthenticated}=useAuthStore();
  const [pin,setPin]=useState('');
  const [newPin,setNewPin]=useState('');
  const [confirmPin,setConfirmPin]=useState('');
  const [pinMsg,setPinMsg]=useState('');
  const [savingPin,setSavingPin]=useState(false);
  const [reprocessPin,setReprocessPin]=useState('');
  const [reprocessing,setReprocessing]=useState(false);
  const [reprocessResult,setReprocessResult]=useState<any>(null);
  const [cleanupPin,setCleanupPin]=useState('');
  const [cleanupGroup,setCleanupGroup]=useState('');
  const [cleaning,setCleaning]=useState(false);
  const [cleanupResult,setCleanupResult]=useState<any>(null);

  useEffect(()=>{if(!isAuthenticated)router.push('/auth/login');},[isAuthenticated,router]);

  const savePin=async()=>{
    if(newPin.length<4){setPinMsg('PIN deve ter pelo menos 4 dígitos');return;}
    if(newPin!==confirmPin){setPinMsg('PINs não coincidem');return;}
    setSavingPin(true); setPinMsg('');
    try{
      // Hash SHA-256 do PIN no cliente antes de enviar
      const enc=new TextEncoder().encode(newPin);
      const buf=await crypto.subtle.digest('SHA-256',enc);
      const hash=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
      const r=await fetch('/api/admin/pin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin_hash:hash})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error);
      setPinMsg('✅ PIN configurado com sucesso!');
      setNewPin(''); setConfirmPin('');
    }catch(e:any){setPinMsg('❌ '+e.message);}
    finally{setSavingPin(false);}
  };

  const reprocess=async()=>{
    if(!reprocessPin){alert('Digite o PIN de segurança');return;}
    if(!confirm('Reprocessar todas as comissões pendentes?'))return;
    setReprocessing(true); setReprocessResult(null);
    try{
      const r=await fetch('/api/admin/reprocess',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:reprocessPin})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error);
      setReprocessResult(j);
    }catch(e:any){setReprocessResult({error:e.message});}
    finally{setReprocessing(false);}
  };

  const cleanup=async()=>{
    if(!cleanupGroup){alert('Selecione um grupo de dados');return;}
    if(!cleanupPin){alert('Digite o PIN de segurança');return;}
    const grp=CLEANUP_GROUPS.find(g=>g.key===cleanupGroup);
    if(!confirm(`⚠️ ATENÇÃO: Isso irá remover permanentemente: ${grp?.desc}\n\nTem certeza absoluta?`))return;
    setCleaning(true); setCleanupResult(null);
    try{
      const r=await fetch('/api/admin/cleanup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:cleanupPin,group:cleanupGroup})});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error);
      setCleanupResult(j);
    }catch(e:any){setCleanupResult({error:e.message});}
    finally{setCleaning(false);}
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Ferramentas de Manutenção</h1>
          <p className="text-dark-400 text-sm mt-1">Operações avançadas — requer PIN de segurança</p>
        </div>

        {/* Configurar PIN */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-primary-400"/>
            <h2 className="text-white font-semibold">Configurar PIN de Segurança</h2>
          </div>
          <p className="text-dark-400 text-sm mb-4">O PIN é necessário para todas as operações de manutenção.</p>
          {pinMsg&&<div className={`text-sm px-3 py-2 rounded-lg mb-3 ${pinMsg.startsWith('✅')?'bg-green-500/10 border border-green-500 text-green-400':'bg-red-500/10 border border-red-500 text-red-400'}`}>{pinMsg}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-dark-400 mb-1">Novo PIN</label>
              <input type="password" value={newPin} onChange={e=>setNewPin(e.target.value)} placeholder="Mínimo 4 dígitos"
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
            <div><label className="block text-xs text-dark-400 mb-1">Confirmar PIN</label>
              <input type="password" value={confirmPin} onChange={e=>setConfirmPin(e.target.value)} placeholder="Repita o PIN"
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
          </div>
          <button onClick={savePin} disabled={savingPin}
            className="mt-3 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
            <Shield className="w-4 h-4"/>{savingPin?'Salvando...':'Salvar PIN'}
          </button>
        </div>

        {/* Reprocessar Comissões */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-5 h-5 text-blue-400"/>
            <h2 className="text-white font-semibold">Reprocessar Comissões</h2>
          </div>
          <p className="text-dark-400 text-sm mb-4">Gera comissões para pedidos pagos que ainda não possuem comissão registrada.</p>
          {reprocessResult&&(
            <div className={`text-sm px-3 py-2 rounded-lg mb-3 ${reprocessResult.error?'bg-red-500/10 border border-red-500 text-red-400':'bg-green-500/10 border border-green-500 text-green-400'}`}>
              {reprocessResult.error??`✅ ${reprocessResult.processed} pedidos verificados — ${reprocessResult.created} comissões geradas`}
            </div>
          )}
          <div className="flex gap-3">
            <input type="password" value={reprocessPin} onChange={e=>setReprocessPin(e.target.value)} placeholder="PIN de segurança"
              className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/>
            <button onClick={reprocess} disabled={reprocessing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              <RefreshCw className={`w-4 h-4 ${reprocessing?'animate-spin':''}`}/>
              {reprocessing?'Processando...':'Reprocessar'}
            </button>
          </div>
        </div>

        {/* Limpeza de Dados */}
        <div className="bg-dark-800 rounded-xl border border-red-900/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400"/>
            <h2 className="text-white font-semibold">Limpeza de Dados</h2>
          </div>
          <p className="text-red-400 text-sm mb-4">⚠️ Operação irreversível. Os dados serão permanentemente removidos.</p>

          {cleanupResult&&(
            <div className={`text-sm px-3 py-2 rounded-lg mb-4 ${cleanupResult.error?'bg-red-500/10 border border-red-500 text-red-400':'bg-green-500/10 border border-green-500 text-green-400'}`}>
              {cleanupResult.error??<>
                <p className="font-medium mb-1">✅ Limpeza concluída:</p>
                {Object.entries(cleanupResult.deleted??{}).map(([t,n]:any)=>(
                  <p key={t} className="text-xs">{t}: {n} registros removidos</p>
                ))}
              </>}
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {CLEANUP_GROUPS.map(g=>(
                <button key={g.key} onClick={()=>setCleanupGroup(g.key)}
                  className={`text-left p-3 rounded-lg border text-sm transition-colors ${cleanupGroup===g.key?'border-red-500 bg-red-500/10':'border-dark-700 bg-dark-900 hover:border-dark-500'}`}>
                  <div className={`font-medium ${g.color}`}>{g.label}</div>
                  <div className="text-dark-400 text-xs mt-0.5">{g.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              <input type="password" value={cleanupPin} onChange={e=>setCleanupPin(e.target.value)} placeholder="PIN de segurança"
                className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/>
              <button onClick={cleanup} disabled={cleaning||!cleanupGroup}
                className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                <Trash2 className="w-4 h-4"/>
                {cleaning?'Limpando...':'Executar Limpeza'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
