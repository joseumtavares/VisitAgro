'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Plus, Search, Package } from 'lucide-react';

interface Product {
  id: string; name: string; description?: string | null;
  unit_price: number; stock_qty: number; unit: string; active: boolean;
}

const EMPTY: Partial<Product> = { name: '', description: '', unit_price: 0, stock_qty: 0, unit: 'UN', active: true };

export default function ProductsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState<Partial<Product>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => { if (!isAuthenticated) router.push('/auth/login'); }, [isAuthenticated, router]);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/products');
    const j = await r.json();
    setProducts(j.products ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name?.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!r.ok) { const j = await r.json(); throw new Error(j.error); }
      await load(); setShowModal(false); setForm(EMPTY);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const f = (k: keyof Product, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Produtos</h1>
            <p className="text-dark-400 text-sm mt-1">{products.length} produtos cadastrados</p>
          </div>
          <button onClick={() => { setForm(EMPTY); setError(''); setShowModal(true); }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-dark-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full bg-dark-800 border border-dark-700 rounded-lg py-2 pl-9 pr-4 text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-dark-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700 text-dark-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Produto</th>
                    <th className="text-left px-4 py-3">Preço Unit.</th>
                    <th className="text-left px-4 py-3">Estoque</th>
                    <th className="text-left px-4 py-3">Unidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-dark-750 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-white font-medium text-sm">{p.name}</div>
                        {p.description && <div className="text-dark-500 text-xs mt-0.5 truncate max-w-[240px]">{p.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-white text-sm">
                        {Number(p.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${Number(p.stock_qty) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {p.stock_qty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-dark-300 text-sm">{p.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-md">
            <div className="p-6 border-b border-dark-700 flex justify-between items-center">
              <h2 className="text-white font-semibold">Novo Produto</h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>}
              <div>
                <label className="block text-xs text-dark-400 mb-1">Nome *</label>
                <input value={form.name ?? ''} onChange={e => f('name', e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-1">Descrição</label>
                <textarea value={form.description ?? ''} onChange={e => f('description', e.target.value)}
                  rows={2} className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Preço</label>
                  <input value={form.unit_price ?? 0} onChange={e => f('unit_price', parseFloat(e.target.value) || 0)}
                    type="number" step="0.01" min="0"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Estoque</label>
                  <input value={form.stock_qty ?? 0} onChange={e => f('stock_qty', parseInt(e.target.value) || 0)}
                    type="number" min="0"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Unidade</label>
                  <select value={form.unit ?? 'UN'} onChange={e => f('unit', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    {['UN', 'KG', 'L', 'CX', 'SC', 'T'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-dark-700 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-dark-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={save} disabled={saving}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
