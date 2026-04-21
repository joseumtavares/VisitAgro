'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Settings, Building2, Key, CheckCircle, Tag, Plus, Trash2, Pencil, Users } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import RepresentativesTab from '@/components/settings/RepresentativesTab';

interface Company { id:string; name:string; trade_name?:string; document?:string; address?:string; city?:string; state?:string; zip_code?:string; phone?:string; email?:string; }
interface Category { id:string; name:string; description?:string|null; active:boolean; }

// Adicionado 'representantes'
type Tab = 'empresa' | 'senha' | 'categorias' | 'representantes';

function Toast({msg,type}:{msg:string;type:'success'|'error'}) {
  if(!msg) return null;
  const bg = type==='success' ? 'bg-green-900/80 border-green-600' : 'bg-red-900/80 border-red-600';
  return <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border text-white text-sm font-medium shadow-lg ${bg}`}>{msg}</div>;
}

function inp(extra='') {
  return `w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 ${extra}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const isAdmin = (user as any)?.role === 'admin';

  const [activeTab, setActiveTab] = useState<Tab>('empresa');
  const [company, setCompany] = useState<Partial<Company>>({});
  const [companyId, setCompanyId] = useState<string|null>(null);
  const [loadingCo, setLoadingCo] = useState(true);
  const [savingCo, setSavingCo] = useState(false);
  const [pwForm, setPwForm] = useState({ current:'', next:'', confirm:'' });
  const [savingPw, setSavingPw] = useState(false);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [catForm, setCatForm] = useState({ name:'', description:'' });
  const [editingCat, setEditingCat] = useState<Category|null>(null);
  const [savingCat, setSavingCat] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);

  useEffect(() => { if (!hydrated) return; if (!isAuthenticated) router.push('/auth/login'); }, [hydrated, isAuthenticated, router]);

  const showToast = (msg:string, type:'success'|'error'='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null), 3500);
  };

  // Company
  const loadCompany = useCallback(async () => {
    try {
      setLoadingCo(true);
      const res = await apiFetch('/api/settings');
      if (res.ok) { const j = await res.json(); if (j.company) { setCompany(j.company); setCompanyId(j.company.id); } }
    } catch {} finally { setLoadingCo(false); }
  }, []);

  useEffect(() => { if (isAuthenticated) loadCompany(); }, [isAuthenticated, loadCompany]);

  const saveCompany = async () => {
    if (!company.name?.trim()) { showToast('Nome da empresa é obrigatório.','error'); return; }
    setSavingCo(true);
    try {
      const res = await apiFetch('/api/settings/company', { method:'POST', body: JSON.stringify({...company, id:companyId}) });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error||'Erro ao salvar'); }
      showToast('✅ Empresa atualizada!'); await loadCompany();
    } catch(e:any) { showToast(e.message,'error'); } finally { setSavingCo(false); }
  };

  const changePassword = async () => {
    if (!pwForm.current) { showToast('Informe a senha atual.','error'); return; }
    if (pwForm.next.length < 6) { showToast('Nova senha: mínimo 6 caracteres.','error'); return; }
    if (pwForm.next !== pwForm.confirm) { showToast('As senhas não coincidem.','error'); return; }
    setSavingPw(true);
    try {
      const res = await apiFetch('/api/auth/change-password', { method:'POST', body: JSON.stringify({ currentPassword:pwForm.current, newPassword:pwForm.next }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error||'Erro');
      showToast('✅ Senha alterada!'); setPwForm({current:'',next:'',confirm:''});
    } catch(e:any) { showToast(e.message,'error'); } finally { setSavingPw(false); }
  };

  // Categories
  const loadCategories = useCallback(async () => {
    setLoadingCats(true);
    const r = await apiFetch('/api/categories');
    const j = await r.json();
    setCategories(j.categories ?? []);
    setLoadingCats(false);
  }, []);

  useEffect(() => { if (activeTab === 'categorias') loadCategories(); }, [activeTab, loadCategories]);

  const openNewCat = () => { setEditingCat(null); setCatForm({ name:'', description:'' }); setShowCatModal(true); };
  const openEditCat = (c: Category) => { setEditingCat(c); setCatForm({ name:c.name, description:c.description??'' }); setShowCatModal(true); };

  const saveCat = async () => {
    if (!catForm.name.trim()) { showToast('Nome obrigatório','error'); return; }
    setSavingCat(true);
    try {
      if (editingCat) {
        await apiFetch('/api/categories', { method:'PUT', body: JSON.stringify({ id:editingCat.id, name:catForm.name, description:catForm.description||null }) });
      } else {
        await apiFetch('/api/categories', { method:'POST', body: JSON.stringify({ name:catForm.name, description:catForm.description||null }) });
      }
      showToast(editingCat ? '✅ Categoria atualizada!' : '✅ Categoria criada!');
      setShowCatModal(false); await loadCategories();
    } catch(e:any) { showToast(e.message,'error'); } finally { setSavingCat(false); }
  };

  const deleteCat = async (id:string) => {
    if (!confirm('Desativar esta categoria?')) return;
    await apiFetch(`/api/categories?id=${id}`, { method:'DELETE' });
    showToast('Categoria desativada'); await loadCategories();
  };

  // Only admins see the Representatives tab
  const tabs: {id:Tab; label:string; icon:any}[] = [
    { id:'empresa',          label:'Empresa',          icon:Building2 },
    { id:'senha',            label:'Senha',            icon:Key },
    { id:'categorias',       label:'Categorias',       icon:Tag },
    ...(isAdmin ? [{ id:'representantes' as Tab, label:'Representantes', icon:Users }] : []),
  ];

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-3xl">
        {toast && <Toast msg={toast.msg} type={toast.type} />}

        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-dark-400 text-sm mt-1">Gerencie empresa, acesso, categorias e representantes</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-800 p-1 rounded-xl border border-dark-700 w-fit flex-wrap">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === t.id ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>

        {/* TAB: EMPRESA */}
        {activeTab === 'empresa' && (
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-5">
            <h2 className="text-white font-semibold flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-400"/>Dados da Empresa</h2>
            {loadingCo ? <p className="text-dark-400 text-sm">Carregando...</p> : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><label className="block text-xs text-dark-400 mb-1">Razão Social *</label>
                    <input value={company.name??''} onChange={e=>setCompany(p=>({...p,name:e.target.value}))} className={inp()} /></div>
                  <div><label className="block text-xs text-dark-400 mb-1">Nome Fantasia</label>
                    <input value={company.trade_name??''} onChange={e=>setCompany(p=>({...p,trade_name:e.target.value}))} className={inp()} /></div>
                  <div><label className="block text-xs text-dark-400 mb-1">CNPJ / CPF</label>
                    <input value={company.document??''} onChange={e=>setCompany(p=>({...p,document:e.target.value}))} className={inp()} /></div>
                  <div><label className="block text-xs text-dark-400 mb-1">Telefone</label>
                    <input value={company.phone??''} onChange={e=>setCompany(p=>({...p,phone:e.target.value}))} className={inp()} /></div>
                  <div><label className="block text-xs text-dark-400 mb-1">Email</label>
                    <input value={company.email??''} onChange={e=>setCompany(p=>({...p,email:e.target.value}))} type="email" className={inp()} /></div>
                  <div className="sm:col-span-2"><label className="block text-xs text-dark-400 mb-1">Endereço</label>
                    <input value={company.address??''} onChange={e=>setCompany(p=>({...p,address:e.target.value}))} className={inp()} /></div>
                  <div><label className="block text-xs text-dark-400 mb-1">Cidade</label>
                    <input value={company.city??''} onChange={e=>setCompany(p=>({...p,city:e.target.value}))} className={inp()} /></div>
                  <div><label className="block text-xs text-dark-400 mb-1">Estado</label>
                    <input value={company.state??''} onChange={e=>setCompany(p=>({...p,state:e.target.value}))} placeholder="SC" className={inp()} /></div>
                </div>
                <button onClick={saveCompany} disabled={savingCo}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  <CheckCircle className="w-4 h-4"/>{savingCo ? 'Salvando...' : 'Salvar empresa'}
                </button>
              </>
            )}
          </div>
        )}

        {/* TAB: SENHA */}
        {activeTab === 'senha' && (
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2"><Key className="w-5 h-5 text-primary-400"/>Alterar Senha</h2>
            <div><label className="block text-xs text-dark-400 mb-1">Senha Atual</label>
              <input type="password" value={pwForm.current} onChange={e=>setPwForm(p=>({...p,current:e.target.value}))} className={inp()} /></div>
            <div><label className="block text-xs text-dark-400 mb-1">Nova Senha (mínimo 6 caracteres)</label>
              <input type="password" value={pwForm.next} onChange={e=>setPwForm(p=>({...p,next:e.target.value}))} className={inp()} /></div>
            <div><label className="block text-xs text-dark-400 mb-1">Confirmar Nova Senha</label>
              <input type="password" value={pwForm.confirm} onChange={e=>setPwForm(p=>({...p,confirm:e.target.value}))} className={inp()} /></div>
            <button onClick={changePassword} disabled={savingPw}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              <Key className="w-4 h-4"/>{savingPw ? 'Alterando...' : 'Alterar senha'}
            </button>
          </div>
        )}

        {/* TAB: CATEGORIAS */}
        {activeTab === 'categorias' && (
          <div className="space-y-4">
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary-400"/>Categorias de Produtos
                </h2>
                <button onClick={openNewCat}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5"/>Nova Categoria
                </button>
              </div>

              {loadingCats ? (
                <p className="text-dark-400 text-sm">Carregando...</p>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-dark-500">
                  <Tag className="w-10 h-10 mx-auto mb-2 opacity-30"/>
                  <p className="text-sm">Nenhuma categoria cadastrada</p>
                  <button onClick={openNewCat} className="mt-2 text-primary-400 hover:text-primary-300 text-xs">+ Criar primeira categoria</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map(c => (
                    <div key={c.id} className="flex items-center justify-between py-3 px-4 bg-dark-900 rounded-lg border border-dark-700">
                      <div>
                        <div className="text-white text-sm font-medium">{c.name}</div>
                        {c.description && <div className="text-dark-500 text-xs mt-0.5">{c.description}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditCat(c)} className="text-dark-400 hover:text-white p-1.5 rounded hover:bg-dark-700 transition-colors">
                          <Pencil className="w-3.5 h-3.5"/>
                        </button>
                        <button onClick={() => deleteCat(c.id)} className="text-dark-400 hover:text-red-400 p-1.5 rounded hover:bg-dark-700 transition-colors">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info box sobre status */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
              <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-primary-400"/>Status do Sistema
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-dark-400 uppercase tracking-wider font-semibold mb-2">Status de Clientes</p>
                  <div className="flex flex-wrap gap-2">
                    {['Interessado','Visitado','Agendado','Comprou','Não Interessado','Retornar','Outro'].map(s => (
                      <span key={s} className="text-xs bg-dark-700 text-dark-300 px-3 py-1 rounded-full border border-dark-600">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-dark-400 uppercase tracking-wider font-semibold mb-2">Status de Pedidos</p>
                  <div className="flex flex-wrap gap-2">
                    {['Pendente','Aprovado','Pago','Cancelado','Faturado'].map(s => (
                      <span key={s} className="text-xs bg-dark-700 text-dark-300 px-3 py-1 rounded-full border border-dark-600">{s}</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-dark-500 mt-2">Os status são fixos no sistema. Para personalizar, entre em contato com o suporte.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REPRESENTANTES — apenas admin */}
        {activeTab === 'representantes' && (
          <RepresentativesTab />
        )}
      </div>

      {/* Modal Categoria */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-md">
            <div className="p-5 border-b border-dark-700 flex justify-between items-center">
              <h3 className="text-white font-semibold">{editingCat ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <button onClick={() => setShowCatModal(false)} className="text-dark-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-dark-400 mb-1">Nome *</label>
                <input value={catForm.name} onChange={e => setCatForm(p=>({...p,name:e.target.value}))}
                  placeholder="Ex: Defensivos, Sementes..."
                  className={inp()} />
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-1">Descrição</label>
                <input value={catForm.description} onChange={e => setCatForm(p=>({...p,description:e.target.value}))}
                  placeholder="Descrição opcional"
                  className={inp()} />
              </div>
            </div>
            <div className="p-5 border-t border-dark-700 flex gap-3 justify-end">
              <button onClick={() => setShowCatModal(false)} className="px-4 py-2 text-dark-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={saveCat} disabled={savingCat}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {savingCat ? 'Salvando...' : editingCat ? 'Salvar' : 'Criar categoria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
