'use client';
// src/app/dashboard/products/page.tsx  (PATCH V2)
// CRUD de produtos — inclui produto composto (v0.9.5)
//
// GARANTIAS:
//   - is_composite lido como Boolean(p.is_composite) — seguro para dados antigos (null/undefined → false)
//   - componentes carregados via GET /api/products/[id] somente ao abrir edição
//   - preview de custo calculado localmente para feedback imediato
//   - validações locais antes de enviar ao backend
//   - mensagens de erro do backend exibidas diretamente ao usuário

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Plus, Search, Package, Pencil, Trash2, Tag, Layers } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import type { Product, ProductComponent } from '@/types';

interface Category { id: string; name: string; }

// Tipo local para item de composição no formulário
interface ComponentFormItem {
  component_product_id: string;
  quantity: number;
}

// Tipo local do formulário (extends Product com components tipados)
type ProductForm = Omit<Partial<Product>, 'components'> & {
  components: ComponentFormItem[];
};

const UNITS = ['UN', 'KG', 'L', 'M', 'M²', 'M³', 'CX', 'PCT', 'PC', 'PAR', 'SC', 'T', 'G', 'ML'];

const FORM_EMPTY: ProductForm = {
  name: '', description: '', unit_price: 0, cost_price: 0,
  stock_qty: 0, unit: 'UN', sku: '', model: '', color: '',
  finame_code: '', ncm_code: '', rep_commission_pct: 0,
  category_id: null, active: true,
  is_composite: false, components: [],
};

const cur = (v: number) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Normaliza is_composite para boolean — seguro para dados antigos
const normalizeProduct = (p: any): Product => ({
  ...p,
  is_composite: Boolean(p.is_composite),
});

export default function ProductsPage() {
  const router         = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editing, setEditing]       = useState<Product | null>(null);
  const [form, setForm]             = useState<ProductForm>(FORM_EMPTY);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [compCostPreview, setCompCostPreview] = useState<number | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) router.push('/auth/login');
  }, [hydrated, isAuthenticated, router]);

  // ── Carregar produtos e categorias ───────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rp, rc] = await Promise.all([
        apiFetch('/api/products').then(r => r.json()),
        apiFetch('/api/categories').then(r => r.json()),
      ]);
      setProducts((rp.products ?? []).map(normalizeProduct));
      setCategories(rc.categories ?? []);
    } catch (e) {
      console.error('[products] load:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Preview de custo calculado ────────────────────────────

  const recalcCostPreview = useCallback(
    (comps: ComponentFormItem[]) => {
      const total = comps.reduce((acc, comp) => {
        if (!comp.component_product_id) return acc;
        const prod = products.find(p => p.id === comp.component_product_id);
        if (!prod) return acc;
        return acc + Number(prod.cost_price ?? 0) * Number(comp.quantity || 0);
      }, 0);
      setCompCostPreview(total);
    },
    [products]
  );

  // ── Modal helpers ─────────────────────────────────────────

  const openNew = () => {
    setEditing(null);
    setForm(FORM_EMPTY);
    setError('');
    setCompCostPreview(null);
    setShowModal(true);
  };

  const openEdit = async (p: Product) => {
    setEditing(p);
    setError('');
    setCompCostPreview(null);

    if (p.is_composite) {
      setLoadingEdit(true);
      setShowModal(true);
      try {
        const r = await apiFetch(`/api/products/${p.id}`);
        const j = await r.json();
        const comps: ComponentFormItem[] = (j.product?.components ?? []).map(
          (c: ProductComponent) => ({
            component_product_id: c.component_product_id,
            quantity: c.quantity,
          })
        );
        setForm({ ...p, is_composite: true, components: comps });
        recalcCostPreview(comps);
      } catch {
        setForm({ ...p, is_composite: true, components: [] });
      } finally {
        setLoadingEdit(false);
      }
    } else {
      setForm({ ...p, is_composite: false, components: [] });
      setShowModal(true);
    }
  };

  const f = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // ── Salvar ────────────────────────────────────────────────

  const save = async () => {
    setError('');

    if (!form.name?.trim()) {
      setError('Nome obrigatório.');
      return;
    }

    if (form.is_composite) {
      if (!form.components || form.components.length === 0) {
        setError('Produto composto deve ter ao menos um componente.');
        return;
      }
      const hasInvalid = form.components.some(
        c => !c.component_product_id || Number(c.quantity) <= 0
      );
      if (hasInvalid) {
        setError('Todos os componentes devem ter produto selecionado e quantidade maior que zero.');
        return;
      }
    }

    setSaving(true);
    try {
      const url    = editing ? `/api/products/${editing.id}` : '/api/products';
      const method = editing ? 'PUT' : 'POST';
      const r      = await apiFetch(url, { method, body: JSON.stringify(form) });
      const j      = await r.json();

      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);

      await load();
      setShowModal(false);
      setCompCostPreview(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Desativar ─────────────────────────────────────────────

  const remove = async (id: string, isComposite: boolean) => {
    const msg = isComposite
      ? 'Desativar este produto composto? Os vínculos de composição serão removidos.'
      : 'Desativar este produto?';
    if (!confirm(msg)) return;

    const r = await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Erro ao desativar produto.');
      return;
    }
    setError('');
    await load();
  };

  // ── Filtro ────────────────────────────────────────────────

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.model ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const catName = (id?: string | null) =>
    categories.find(c => c.id === id)?.name ?? '—';

  // Produtos elegíveis como componente: ativos, não compostos, não o produto sendo editado
  const eligibleComponents = products.filter(
    p => !p.is_composite && p.id !== editing?.id && p.active
  );

  const inp =
    'w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500';

  // ── Render ────────────────────────────────────────────────

  return (
    <DashboardShell>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Produtos</h1>
            <p className="text-dark-400 text-sm mt-1">{products.length} cadastrados</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>

        {error && !showModal && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-dark-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, modelo ou SKU..."
            className="w-full bg-dark-800 border border-dark-700 rounded-lg py-2 pl-9 pr-4 text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="text-center py-12 text-dark-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum produto encontrado</p>
            <button onClick={openNew} className="mt-3 text-primary-400 hover:text-primary-300 text-sm">
              + Cadastrar primeiro produto
            </button>
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
                    <th className="text-right px-4 py-3">Venda</th>
                    <th className="text-right px-4 py-3">Custo</th>
                    <th className="text-right px-4 py-3">Estoque</th>
                    <th className="text-right px-4 py-3">Comissão Rep.</th>
                    <th className="text-right px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-dark-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-medium text-sm">{p.name}</span>
                          {/* Badge só renderiza se is_composite for exatamente true */}
                          {p.is_composite === true && (
                            <span className="inline-flex items-center gap-1 text-xs bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded-full">
                              <Layers className="w-3 h-3" />Composto
                            </span>
                          )}
                        </div>
                        {p.model && <div className="text-dark-500 text-xs mt-0.5">Modelo: {p.model}</div>}
                        {p.color && <div className="text-dark-500 text-xs">Cor: {p.color}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-dark-300">
                          <Tag className="w-3 h-3" />{catName(p.category_id)}
                        </span>
                      </td>                      <td className="px-4 py-3 text-xs text-dark-400 font-mono">{p.sku || '—'}</td>
                      <td className="px-4 py-3 text-right text-sm text-white font-medium">
                        {cur(p.unit_price ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        <span className="text-dark-400">
                          {p.cost_price != null ? cur(p.cost_price) : '—'}
                        </span>
                        {p.is_composite === true && p.cost_price != null ? (
                          <div className="text-cyan-500/60 text-xs">calculado</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${
                          Number(p.stock_qty) <= 0 ? 'text-red-400'
                          : Number(p.stock_qty) < 10 ? 'text-yellow-400'
                          : 'text-green-400'
                        }`}>
                          {p.stock_qty} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-dark-400">
                        {p.rep_commission_pct ? `${p.rep_commission_pct}%` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="text-dark-400 hover:text-white p-1.5 rounded hover:bg-dark-700 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => remove(p.id, p.is_composite === true)}
                            className="text-dark-400 hover:text-red-400 p-1.5 rounded hover:bg-dark-700 transition-colors"
                            title="Desativar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="p-6 border-b border-dark-700 flex justify-between items-center sticky top-0 bg-dark-800 z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-white font-semibold text-lg">
                  {editing ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                {form.is_composite && (
                  <span className="inline-flex items-center gap-1 text-xs bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                    <Layers className="w-3 h-3" /> Composto
                  </span>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white text-xl">✕</button>
            </div>

            {loadingEdit ? (
              <div className="p-12 text-center text-dark-400">Carregando dados do produto...</div>
            ) : (
              <div className="p-6 space-y-6">

                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                {/* IDENTIFICAÇÃO */}
                <div>
                  <p className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3">Identificação</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-dark-400 mb-1">Nome *</label>
                      <input
                        value={form.name ?? ''}
                        onChange={e => f('name', e.target.value)}
                        placeholder="Ex: Kit Defensivo Soja"
                        className={inp}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Modelo</label>
                      <input value={form.model ?? ''} onChange={e => f('model', e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">SKU / Código</label>
                      <input value={form.sku ?? ''} onChange={e => f('sku', e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Categoria</label>
                      <select value={form.category_id ?? ''} onChange={e => f('category_id', e.target.value || null)} className={inp}>
                        <option value="">Selecione...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Cor</label>
                      <input value={form.color ?? ''} onChange={e => f('color', e.target.value)} className={inp} />
                    </div>
                  </div>
                </div>

                {/* PREÇOS E ESTOQUE */}
                <div>
                  <p className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3">Preços e Estoque</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Valor de Venda (R$) *</label>
                      <input type="number" min="0" step="0.01"
                        value={form.unit_price ?? 0}
                        onChange={e => f('unit_price', parseFloat(e.target.value) || 0)}
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">
                        Custo (R$)
                        {form.is_composite && (
                          <span className="ml-1 text-cyan-500 text-xs">(calculado pelos componentes)</span>
                        )}
                      </label>
                      <input
                        type="number" min="0" step="0.01"
                        value={form.is_composite && compCostPreview !== null
                          ? compCostPreview
                          : (form.cost_price ?? 0)}
                        readOnly={form.is_composite === true}
                        onChange={e => !form.is_composite && f('cost_price', parseFloat(e.target.value) || 0)}
                        className={`${inp} ${form.is_composite ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Estoque</label>
                      <input type="number" min="0" step="0.01"
                        value={form.stock_qty ?? 0}
                        onChange={e => f('stock_qty', parseFloat(e.target.value) || 0)}
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Unidade</label>
                      <select value={form.unit ?? 'UN'} onChange={e => f('unit', e.target.value)} className={inp}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">% Comissão Representante</label>
                      <input type="number" min="0" max="100" step="0.1"
                        value={form.rep_commission_pct ?? 0}
                        onChange={e => f('rep_commission_pct', parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 5"
                        className={inp}
                      />
                      {form.is_composite && (
                        <p className="text-xs text-cyan-400 mt-1">
                          ℹ️ Usado em vendas — percentuais dos componentes são ignorados.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* PRODUTO COMPOSTO */}
                <div className="border-t border-dark-700 pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="is_composite"
                      checked={form.is_composite === true}
                      onChange={e => {
                        const checked = e.target.checked;
                        f('is_composite', checked);
                        if (!checked) {
                          f('components', []);
                          setCompCostPreview(null);
                        }
                      }}
                      className="w-4 h-4 accent-primary-600 cursor-pointer"
                    />
                    <label htmlFor="is_composite" className="flex items-center gap-2 text-sm font-medium text-white cursor-pointer select-none">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      Este é um produto composto (formado por outros produtos)
                    </label>
                  </div>

                  {form.is_composite && (
                    <div className="border border-dark-600 rounded-lg p-4 bg-dark-900 space-y-3">

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-dark-400 uppercase tracking-wider font-semibold">Componentes</p>
                        <button
                          type="button"
                          onClick={() => {
                            const updated: ComponentFormItem[] = [
                              ...form.components,
                              { component_product_id: '', quantity: 1 },
                            ];
                            f('components', updated);
                            recalcCostPreview(updated);
                          }}
                          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Adicionar componente
                        </button>
                      </div>

                      {form.components.length === 0 && (
                        <p className="text-dark-600 text-xs text-center py-3">
                          Nenhum componente adicionado. Adicione ao menos um produto.
                        </p>
                      )}

                      {form.components.map((comp, idx) => {
                        const compProduct = products.find(p => p.id === comp.component_product_id);
                        const lineTotal = compProduct && comp.quantity
                          ? Number(compProduct.cost_price ?? 0) * Number(comp.quantity)
                          : null;

                        return (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-7">
                              <label className="block text-xs text-dark-500 mb-1">Produto componente</label>
                              <select
                                value={comp.component_product_id}
                                onChange={e => {
                                  const updated = [...form.components];
                                  updated[idx] = { ...updated[idx], component_product_id: e.target.value };
                                  f('components', updated);
                                  recalcCostPreview(updated);
                                }}
                                className={inp}
                              >
                                <option value="">Selecione...</option>
                                {eligibleComponents.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-3">
                              <label className="block text-xs text-dark-500 mb-1">Qtd.</label>
                              <input
                                type="number" min="0.001" step="0.001"
                                value={comp.quantity}
                                onChange={e => {
                                  const updated = [...form.components];
                                  updated[idx] = { ...updated[idx], quantity: parseFloat(e.target.value) || 1 };
                                  f('components', updated);
                                  recalcCostPreview(updated);
                                }}
                                className={inp}
                              />
                            </div>
                            <div className="col-span-2 flex flex-col items-end gap-1 pb-1">
                              {lineTotal !== null && (
                                <span className="text-xs text-dark-400 text-right leading-tight">
                                  {cur(lineTotal)}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = form.components.filter((_, i) => i !== idx);
                                  f('components', updated);
                                  recalcCostPreview(updated);
                                }}
                                className="text-dark-500 hover:text-red-400"
                                title="Remover componente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Preview de custo total */}
                      {compCostPreview !== null && form.components.length > 0 && (
                        <div className="flex items-center justify-between pt-3 border-t border-dark-700">
                          <span className="text-xs text-dark-400">Custo calculado (Σ componentes):</span>
                          <span className="text-sm font-bold text-amber-400">{cur(compCostPreview)}</span>
                        </div>
                      )}

                      {/* Aviso sobre comissão */}
                      <div className="mt-2 pt-3 border-t border-dark-700">
                        <p className="text-xs text-cyan-400 flex items-start gap-1.5">
                          <span className="flex-shrink-0 mt-0.5">ℹ️</span>
                          <span>
                            A <strong className="text-white">comissão do representante</strong> em vendas
                            usa exclusivamente o campo <strong className="text-white">% Comissão Representante</strong> acima.
                            Os percentuais dos componentes individuais <strong className="text-white">não são utilizados</strong>.
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* DADOS FISCAIS */}
                <div>
                  <p className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3">Dados Fiscais (opcional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Código FINAME</label>
                      <input value={form.finame_code ?? ''} onChange={e => f('finame_code', e.target.value)} placeholder="Ex: 7310.29.00" className={inp} />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">NCM</label>
                      <input value={form.ncm_code ?? ''} onChange={e => f('ncm_code', e.target.value)} placeholder="Ex: 8419.89.99" className={inp} />
                    </div>
                  </div>
                </div>

                {/* DESCRIÇÃO */}
                <div>
                  <p className="text-xs text-dark-500 uppercase tracking-wider font-semibold mb-3">Descrição</p>
                  <textarea
                    value={form.description ?? ''}
                    onChange={e => f('description', e.target.value)}
                    rows={3}
                    placeholder="Características técnicas, especificações..."
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            {!loadingEdit && (
              <div className="p-6 border-t border-dark-700 flex gap-3 justify-end sticky bottom-0 bg-dark-800">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-dark-400 hover:text-white text-sm">
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
