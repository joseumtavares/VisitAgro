'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Plus, Search, Package, Pencil, Trash2, Tag } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';

interface Category { id: string; name: string; }
interface Product {
  id: string; name: string; description?: string | null;
  unit_price: number; cost_price?: number; stock_qty: number; unit: string; active: boolean;
  category_id?: string | null; sku?: string | null; model?: string | null;
  color?: string | null; finame_code?: string | null; ncm_code?: string | null;
  rep_commission_pct?: number;
}

const UNITS = ['UN','KG','L','M','M²','M³','CX','PCT','PC','PAR','SC','T','G','ML'];
const EMPTY: Partial<Product> = {
  name: '', description: '', unit_price: 0, cost_price: 0, stock_qty: 0, unit: 'UN',
  sku: '', model: '', color: '', finame_code: '', ncm_code: '', rep_commission_pct: 0,
  category_id: null, active: true,
};

export default function ProductsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const [products, setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Product | null>(null);
  const [form, setForm]           = useState<Partial<Product>>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => { if (!hydrated) return; if (!isAuthenticated) router.push('/auth/login'); }, [hydrated, isAuthenticated, router]);

  const load = useCallback(async () => {
    setLoading(true);
    const [rp, rc] = await Promise.all([
      apiFetch('/api/products').then(r => r.json()),
      apiFetch('/api/categories').then(r => r.json()),
    ]);
    setProducts(rp.products ?? []);
    setCategories(rc.categories ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ ...p }); setError(''); setShowModal(true); };

  const save = async () => {
    if (!form.name?.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/products/${editing.id}` : '/api/products';
      const method = editing ? 'PUT' : 'POST';
      const r = await apiFetch(url, { method, body: JSON.stringify(form) });
      if (!r.ok) { const j = await r.json(); throw new Error(j.error); }
      await load(); setShowModal(false);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Desativar este produto?')) return;
    await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    await load();
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.model ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const f = (k: keyof Product, v: any) => setForm(p => ({ ...p, [k]: v }));
  const catName = (id?: string | null) => categories.find(c => c.id === id)?.name ?? '—';

  const cur = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Produtos</h1>
            <p className="text-dark-400 text-sm mt-1">{products.length} cadastrados</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-dark-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, modelo ou SKU..."
            className="w-full bg-dark-800 border border-dark-700 rounded-lg py-2 pl-9 pr-4 text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-dark-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum produto encontrado</p>
            <button onClick={openNew} className="mt-3 text-primary-400 hover:text-primary-300 text-sm">+ Cadastrar primeiro produto</button>
          </div>
        ) : (
          <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700 text-dark-400 text-xs uppercase">
                    <th className="text-left px-4 py-3">Nome / Modelo</th>
                    <th className="text-left px-4 py-3">Categoria</th>
                    <th className="text-left px-4 py-3">SKU</th>
                    <th className="text-right px-4 py-3">Preço Venda</th>
                    <th className="text-right px-4 py-3">Custo</th>
                    <th className="text-right px-4 py-3">Estoque</th>
                    <th className="text-right px-4 py-3">Comissão</th>
                    <th className="text-right px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-dark-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-white font-medium text-sm">{p.name}</div>
                        {p.model && <div className="text-dark-500 text-xs">Modelo: {p.model}</div>}
                        {p.color && <div className="text-dark-500 text-xs">Cor: {p.color}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-dark-300">
                          <Tag className="w-3 h-3" />{catName(p.category_id)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-dark-400 font-mono">{p.sku || '—'}</td>
                      <td className="px-4 py-3 text-right text-sm text-white font-medium">{cur(p.unit_price)}</td>
                      <td className="px-4 py-3 text-right text-xs text-dark-400">{p.cost_price ? cur(p.cost_price) : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${p.stock_qty <= 0 ? 'text-red-400' : p.stock_qty < 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {p.stock_qty} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-dark-400">
                        {p.rep_commission_pct ? `${p.rep_commission_pct}%` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(p)} className="text-dark-400 hover:text-white p-1.5 rounded hover:bg-dark-700 transition-colors"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => remove(p.id)} className="text-dark-400 hover:text-red-400 p-1.5 rounded hover:bg-dark-700 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-700 flex justify-between items-center sticky top-0 bg-dark-800 z-10">
              <h2 className="text-white font-semibold text-lg">{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}

              {/* IDENTIFICAÇÃO */}
              <div>
                <p className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3">Identificação</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-dark-400 mb-1">Nome *</label>
                    <input value={form.name ?? ''} onChange={e => f('name', e.target.value)}
                      placeholder="Ex: Bioqueimador a Pellets"
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Modelo</label>
                    <input value={form.model ?? ''} onChange={e => f('model', e.target.value)}
                      placeholder="Ex: BQ-200"
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">SKU / Código</label>
                    <input value={form.sku ?? ''} onChange={e => f('sku', e.target.value)}
                      placeholder="Ex: PRD-001"
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Categoria</label>
                    <select value={form.category_id ?? ''} onChange={e => f('category_id', e.target.value || null)}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Selecione...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Cor</label>
                    <input value={form.color ?? ''} onChange={e => f('color', e.target.value)}
                      placeholder="Ex: Preto fosco"
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              </div>

              {/* PREÇOS */}
              <div>
                <p className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3">Preços e Estoque</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Valor de Venda (R$) *</label>
                    <input type="number" min="0" step="0.01" value={form.unit_price ?? 0} onChange={e => f('unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Custo (R$)</label>
                    <input type="number" min="0" step="0.01" value={form.cost_price ?? 0} onChange={e => f('cost_price', parseFloat(e.target.value) || 0)}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Estoque</label>
                    <input type="number" min="0" value={form.stock_qty ?? 0} onChange={e => f('stock_qty', parseFloat(e.target.value) || 0)}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Unidade</label>
                    <select value={form.unit ?? 'UN'} onChange={e => f('unit', e.target.value)}
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500">
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">% Comissão Representante</label>
                    <input type="number" min="0" max="100" step="0.1" value={form.rep_commission_pct ?? 0}
                      onChange={e => f('rep_commission_pct', parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 5"
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              </div>

              {/* FISCAL */}
              <div>
                <p className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3">Dados Fiscais</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">Código FINAME</label>
                    <input value={form.finame_code ?? ''} onChange={e => f('finame_code', e.target.value)}
                      placeholder="Ex: 7310.29.00"
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1">NCM</label>
                    <input value={form.ncm_code ?? ''} onChange={e => f('ncm_code', e.target.value)}
                      placeholder="Ex: 8419.89.99"
                      className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              </div>

              {/* DESCRIÇÃO */}
              <div>
                <p className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3">Descrição</p>
                <textarea value={form.description ?? ''} onChange={e => f('description', e.target.value)}
                  rows={3} placeholder="Características técnicas, especificações..."
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>
            </div>

            <div className="p-6 border-t border-dark-700 flex gap-3 justify-end sticky bottom-0 bg-dark-800">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-dark-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={save} disabled={saving}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
