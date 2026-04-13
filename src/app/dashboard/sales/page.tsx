'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Plus, Search, ShoppingCart, CheckCircle, XCircle, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';

type OrderStatus='pendente'|'aprovado'|'pago'|'cancelado'|'faturado';
interface Order {
  id:string; order_number?:number|null; date?:string|null; status:OrderStatus;
  total:number; commission_value?:number|null; obs?:string|null;
  client_id?:string|null; referral_id?:string|null;
  clients?:{name:string}|null; referrals?:{name:string}|null;
}
interface Client{id:string;name:string;}
interface Product{id:string;name:string;unit_price:number;rep_commission_pct:number;unit:string;}
interface Referral{id:string;name:string;commission_type:string;commission_pct?:number;commission?:number;}
interface OrderItem{product_id:string;product_name:string;quantity:number;unit_price:number;rep_commission_pct:number;}

const STATUS_CFG:Record<OrderStatus,{label:string;cls:string;icon:any}>={
  pendente:{label:'Pendente',cls:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',icon:Clock},
  aprovado:{label:'Aprovado',cls:'bg-blue-500/20 text-blue-400 border-blue-500/30',icon:CheckCircle},
  pago:{label:'Pago',cls:'bg-green-500/20 text-green-400 border-green-500/30',icon:CheckCircle},
  cancelado:{label:'Cancelado',cls:'bg-red-500/20 text-red-400 border-red-500/30',icon:XCircle},
  faturado:{label:'Faturado',cls:'bg-purple-500/20 text-purple-400 border-purple-500/30',icon:CheckCircle},
};

export default function SalesPage() {
  const router=useRouter(); const {isAuthenticated}=useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const [orders,setOrders]=useState<Order[]>([]);
  const [clients,setClients]=useState<Client[]>([]);
  const [products,setProducts]=useState<Product[]>([]);
  const [referrals,setReferrals]=useState<Referral[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [filterStatus,setFilter]=useState<OrderStatus|'todos'>('todos');
  const [showModal,setShowModal]=useState(false);
  const [form, setForm] = useState({
    client_id: '',
    referral_id: '',
    status: 'pendente' as OrderStatus,
    date: new Date().toISOString().split('T')[0],
    obs: '',
    items: [] as OrderItem[],
  });
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{if (!hydrated) return; if(!isAuthenticated)router.push('/auth/login');},[isAuthenticated,router]);

  const load=useCallback(async()=>{
    setLoading(true);
    const [o,c,p,r]=await Promise.all([
      apiFetch('/api/orders').then(x=>x.json()),
      apiFetch('/api/clients').then(x=>x.json()),
      apiFetch('/api/products').then(x=>x.json()),
      apiFetch('/api/referrals').then(x=>x.json()),
    ]);
    setOrders(o.orders??[]); setClients(c.clients??[]); setProducts(p.products??[]); setReferrals(r.referrals??[]);
    setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);

  const addItem=()=>setForm((f:any)=>({...f,items:[...f.items,{product_id:'',product_name:'',quantity:1,unit_price:0,rep_commission_pct:0}]}));
  const removeItem=(i:number)=>setForm((f:any)=>({...f,items:f.items.filter((_:any,idx:number)=>idx!==i)}));
  const updateItem=(i:number,k:string,v:any)=>setForm((f:any)=>{
    const items=[...f.items]; items[i]={...items[i],[k]:v};
    if(k==='product_id'){
      const prod=products.find(p=>p.id===v);
      if(prod){items[i].product_name=prod.name;items[i].unit_price=prod.unit_price;items[i].rep_commission_pct=prod.rep_commission_pct;}
    }
    return {...f,items};
  });

  const total=form.items.reduce((s:number,i:any)=>s+Number(i.quantity)*Number(i.unit_price),0);

  const calcCommission=()=>{
    if(!form.referral_id)return 0;
    const ref=referrals.find(r=>r.id===form.referral_id);
    if(!ref)return 0;
    return ref.commission_type==='percent'?(total*Number(ref.commission_pct??0)/100):Number(ref.commission??0);
  };

  const save = async () => {
    if (!form.client_id) {
      setError('Cliente obrigatório');
      return;
    }

    const hasInvalidItems = form.items.some(
      (item: any) => !item.product_id || Number(item.quantity) <= 0
    );

    if (hasInvalidItems) {
      setError('Preencha todos os itens da venda antes de salvar.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        total,
        commission_value: calcCommission(),
      };

      const r = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const j = await r.json();
        throw new Error(j.error);
      }

      await load();
      setShowModal(false);
      setForm({
        client_id: '',
        referral_id: '',
        status: 'pendente' as OrderStatus,
        date: new Date().toISOString().split('T')[0],
        obs: '',
        items: [] as OrderItem[],
      });
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus=async(id:string,status:OrderStatus)=>{
    await apiFetch(`/api/orders/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
    await load();
  };

  const filtered=orders.filter(o=>{
    const ms=(o.clients?.name??'').toLowerCase().includes(search.toLowerCase())||String(o.order_number??'').includes(search);
    return ms&&(filterStatus==='todos'||o.status===filterStatus);
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-white">Vendas</h1>
            <p className="text-dark-400 text-sm mt-1">{orders.length} pedidos</p></div>
          <button onClick={()=>{setError('');setShowModal(true);}} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4"/>Nova Venda</button>
        </div>

        {/* Totalizadores */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(['pendente','aprovado','pago','cancelado'] as OrderStatus[]).map(s=>{
            const cfg=STATUS_CFG[s]; const n=orders.filter(o=>o.status===s).length;
            const tot=orders.filter(o=>o.status===s).reduce((a,o)=>a+Number(o.total),0);
            return <div key={s} className="bg-dark-800 rounded-xl border border-dark-700 p-4">
              <p className="text-dark-400 text-xs uppercase mb-1">{cfg.label}</p>
              <p className="text-white text-xl font-bold">{n}</p>
              <p className="text-dark-400 text-xs mt-1">{tot.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
            </div>;
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 w-4 h-4 text-dark-500"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por cliente ou nº do pedido..."
              className="w-full bg-dark-800 border border-dark-700 rounded-lg py-2 pl-9 pr-4 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
          <select value={filterStatus} onChange={e=>setFilter(e.target.value as any)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none">
            <option value="todos">Todos</option>
            {(Object.keys(STATUS_CFG) as OrderStatus[]).map(s=><option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
          </select>
        </div>

        {loading?<div className="text-center py-12 text-dark-400">Carregando...</div>
        :filtered.length===0?<div className="text-center py-12 text-dark-400"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30"/><p>Nenhum pedido encontrado</p></div>
        :<div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr className="border-b border-dark-700 text-dark-400 text-xs uppercase">
              <th className="text-left px-4 py-3">Pedido</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Indicador</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Comissão</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Ação</th>
            </tr></thead>
            <tbody className="divide-y divide-dark-700">
              {filtered.map(o=>{
                const cfg=STATUS_CFG[o.status];
                return <tr key={o.id} className="hover:bg-dark-700/30 transition-colors">
                  <td className="px-4 py-3"><div className="text-white font-mono text-sm">#{o.order_number??'—'}</div>
                    <div className="text-dark-500 text-xs">{o.date??''}</div></td>
                  <td className="px-4 py-3 text-white text-sm">{o.clients?.name??'—'}</td>
                  <td className="px-4 py-3 text-dark-300 text-sm">{o.referrals?.name??'—'}</td>
                  <td className="px-4 py-3 text-white font-medium text-sm">{Number(o.total).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                  <td className="px-4 py-3 text-green-400 text-sm">{Number(o.commission_value??0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>{cfg.label}</span></td>
                  <td className="px-4 py-3 text-right">
                    <select value={o.status} onChange={e=>changeStatus(o.id,e.target.value as OrderStatus)}
                      className="bg-dark-700 border border-dark-600 rounded-lg px-2 py-1 text-white text-xs outline-none">
                      {(Object.keys(STATUS_CFG) as OrderStatus[]).map(s=><option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                    </select>
                  </td>
                </tr>;
              })}
            </tbody>
          </table></div>
        </div>}
      </div>

      {showModal&&(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-700 flex justify-between items-center sticky top-0 bg-dark-800">
              <h2 className="text-white font-semibold text-lg">Nova Venda</h2>
              <button onClick={()=>setShowModal(false)} className="text-dark-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {error&&<div className="bg-red-500/10 border border-red-500 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-xs text-dark-400 mb-1">Cliente *</label>
                  <select value={form.client_id} onChange={e=>setForm((f:any)=>({...f,client_id:e.target.value}))}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Selecione um cliente</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></div>
                <div><label className="block text-xs text-dark-400 mb-1">Indicador</label>
                  <select value={form.referral_id} onChange={e=>setForm((f:any)=>({...f,referral_id:e.target.value}))}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Sem indicador</option>
                    {referrals.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                  </select></div>
                <div><label className="block text-xs text-dark-400 mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    {(Object.keys(STATUS_CFG) as OrderStatus[]).map(s=><option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
                  </select></div>
                <div><label className="block text-xs text-dark-400 mb-1">Data</label>
                  <input type="date" value={form.date} onChange={e=>setForm((f:any)=>({...f,date:e.target.value}))}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"/></div>
                <div className="col-span-2"><label className="block text-xs text-dark-400 mb-1">Observações</label>
                  <textarea value={form.obs} onChange={e=>setForm((f:any)=>({...f,obs:e.target.value}))} rows={2}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"/></div>
              </div>

              {/* Itens */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-dark-400 font-medium uppercase">Produtos</p>
                  <button onClick={addItem} className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
                    <Plus className="w-3 h-3"/>Adicionar</button>
                </div>
                {form.items.length===0&&<p className="text-dark-600 text-sm text-center py-4">Nenhum produto adicionado</p>}
                <div className="space-y-2">
                  {form.items.map((item:OrderItem,i:number)=>(
                    <div key={i} className="bg-dark-900 rounded-lg p-3 grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5"><label className="block text-xs text-dark-500 mb-1">Produto</label>
                        <select value={item.product_id} onChange={e=>updateItem(i,'product_id',e.target.value)}
                          className="w-full bg-dark-800 border border-dark-700 rounded px-2 py-1.5 text-white text-xs outline-none">
                          <option value="">Selecione</option>
                          {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                        </select></div>
                      <div className="col-span-2"><label className="block text-xs text-dark-500 mb-1">Qtd</label>
                        <input value={item.quantity} onChange={e=>updateItem(i,'quantity',Number(e.target.value))} type="number" min="1"
                          className="w-full bg-dark-800 border border-dark-700 rounded px-2 py-1.5 text-white text-xs outline-none"/></div>
                      <div className="col-span-3"><label className="block text-xs text-dark-500 mb-1">Preço Unit.</label>
                        <input value={item.unit_price} onChange={e=>updateItem(i,'unit_price',Number(e.target.value))} type="number" step="0.01"
                          className="w-full bg-dark-800 border border-dark-700 rounded px-2 py-1.5 text-white text-xs outline-none"/></div>
                      <div className="col-span-2 flex items-end justify-end pb-1">
                        <span className="text-xs text-green-400 font-medium">{(item.quantity*item.unit_price).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span>
                        <button onClick={()=>removeItem(i)} className="ml-2 text-dark-500 hover:text-red-400"><XCircle className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              {form.items.length>0&&(
                <div className="bg-dark-900 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-dark-400">Subtotal</span>
                    <span className="text-white font-medium">{total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div>
                  {form.referral_id&&<div className="flex justify-between text-sm"><span className="text-dark-400">Comissão indicador</span>
                    <span className="text-green-400">{calcCommission().toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div>}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-dark-700 flex gap-3 justify-end sticky bottom-0 bg-dark-800">
              <button onClick={()=>setShowModal(false)} className="px-4 py-2 text-dark-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={save} disabled={saving} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving?'Salvando...':'Registrar Venda'}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
