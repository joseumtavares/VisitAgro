'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, MapPin, Key, UserCheck, UserX, X } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import type { Representative, RepRegion } from '@/types';

// ── UF list ───────────────────────────────────────────────────
const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

// ── Helpers ───────────────────────────────────────────────────
const inp =
  'w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-primary-500';

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border text-white text-sm font-medium shadow-lg ${
        type === 'success'
          ? 'bg-green-900/90 border-green-600'
          : 'bg-red-900/90 border-red-600'
      }`}
    >
      {msg}
    </div>
  );
}

// ── Types for form state ──────────────────────────────────────
interface RepForm {
  name: string;
  username: string;
  email: string;
  password: string;
}

interface RegionForm {
  state: string;
  city: string;
}

const EMPTY_FORM: RepForm = { name: '', username: '', email: '', password: '' };
const EMPTY_REGION: RegionForm = { state: 'SC', city: '' };

// ── RegionsModal ──────────────────────────────────────────────
function RegionsModal({
  rep,
  onClose,
  showToast,
}: {
  rep: Representative;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [regions, setRegions] = useState<RepRegion[]>([]);
  const [regionForm, setRegionForm] = useState<RegionForm>(EMPTY_REGION);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [savingRegion, setSavingRegion] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadRegions = useCallback(async () => {
    setLoadingRegions(true);
    try {
      const r = await apiFetch(`/api/representatives/${rep.id}/regions`);
      const j = await r.json();
      setRegions(j.regions ?? []);
    } catch {
      // silently ignore
    } finally {
      setLoadingRegions(false);
    }
  }, [rep.id]);

  useEffect(() => { loadRegions(); }, [loadRegions]);

  const addRegion = async () => {
    if (!regionForm.state || !regionForm.city.trim()) {
      showToast('Preencha estado e cidade.', 'error');
      return;
    }
    setSavingRegion(true);
    try {
      const r = await apiFetch(`/api/representatives/${rep.id}/regions`, {
        method: 'POST',
        body: JSON.stringify(regionForm),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setRegionForm(EMPTY_REGION);
      await loadRegions();
      showToast('Região adicionada!', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSavingRegion(false);
    }
  };

  const removeRegion = async (regionId: string) => {
    setRemovingId(regionId);
    try {
      const r = await apiFetch(
        `/api/representatives/${rep.id}/regions/${regionId}`,
        { method: 'DELETE' }
      );
      if (!r.ok) {
        const j = await r.json();
        throw new Error(j.error);
      }
      await loadRegions();
      showToast('Região removida.', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="p-5 border-b border-dark-700 flex items-center justify-between sticky top-0 bg-dark-800">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-400" />
              Regiões — {rep.name || rep.username}
            </h3>
            <p className="text-xs text-dark-400 mt-0.5">
              Cidades atendidas por este representante
            </p>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Add region form */}
          <div className="bg-dark-900 rounded-lg p-4 border border-dark-700">
            <p className="text-xs text-dark-400 uppercase font-semibold mb-3">
              Adicionar região
            </p>
            <div className="grid grid-cols-3 gap-2 items-end">
              <div>
                <label className="block text-xs text-dark-400 mb-1">Estado (UF)</label>
                <select
                  value={regionForm.state}
                  onChange={e =>
                    setRegionForm(f => ({ ...f, state: e.target.value }))
                  }
                  className={inp}
                >
                  {UF_LIST.map(uf => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-1">Cidade</label>
                <input
                  value={regionForm.city}
                  onChange={e =>
                    setRegionForm(f => ({ ...f, city: e.target.value }))
                  }
                  placeholder="Ex: Araranguá"
                  onKeyDown={e => e.key === 'Enter' && addRegion()}
                  className={inp}
                />
              </div>
              <button
                onClick={addRegion}
                disabled={savingRegion}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {savingRegion ? '...' : 'Add'}
              </button>
            </div>
          </div>

          {/* Regions list */}
          {loadingRegions ? (
            <p className="text-dark-400 text-sm text-center py-4">
              Carregando regiões...
            </p>
          ) : regions.length === 0 ? (
            <p className="text-dark-500 text-sm text-center py-4">
              Nenhuma região cadastrada ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {regions.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2 px-3 bg-dark-900 rounded-lg border border-dark-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold bg-primary-600/20 text-primary-300 border border-primary-500/30">
                      {r.state}
                    </span>
                    <span className="text-sm text-white">{r.city}</span>
                  </div>
                  <button
                    onClick={() => removeRegion(r.id)}
                    disabled={removingId === r.id}
                    className="text-dark-500 hover:text-red-400 p-1 rounded disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PasswordModal ─────────────────────────────────────────────
function PasswordModal({
  rep,
  onClose,
  showToast,
}: {
  rep: Representative;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (pwd.length < 6) {
      showToast('Senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }
    if (pwd !== confirm) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }
    setSaving(true);
    try {
      const r = await apiFetch(
        `/api/representatives/${rep.id}/password`,
        { method: 'POST', body: JSON.stringify({ password: pwd }) }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      showToast('Senha atualizada!', 'success');
      onClose();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-sm">
        <div className="p-5 border-b border-dark-700 flex items-center justify-between">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Key className="w-4 h-4 text-primary-400" />
            Redefinir Senha — {rep.name || rep.username}
          </h3>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs text-dark-400 mb-1">Nova Senha</label>
            <input
              type="password"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={inp}
            />
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">Confirmar Senha</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repita a senha"
              className={inp}
            />
          </div>
        </div>
        <div className="p-5 border-t border-dark-700 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-dark-400 hover:text-white text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar senha'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── RepresentativesTab (main export) ─────────────────────────
export default function RepresentativesTab() {
  const [reps, setReps] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Representative | null>(null);
  const [form, setForm] = useState<RepForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'error';
  } | null>(null);
  const [regionsRep, setRegionsRep] = useState<Representative | null>(null);
  const [passwordRep, setPasswordRep] = useState<Representative | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch('/api/representatives');
      const j = await r.json();
      setReps(j.representatives ?? []);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (rep: Representative) => {
    setEditing(rep);
    setForm({
      name:     rep.name ?? '',
      username: rep.username,
      email:    rep.email ?? '',
      password: '',
    });
    setError('');
    setShowModal(true);
  };

  const f = (k: keyof RepForm, v: string) =>
    setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    if (!form.username.trim()) {
      setError('Usuário (login) é obrigatório.');
      return;
    }
    if (!editing && (!form.password || form.password.length < 6)) {
      setError('Senha inicial deve ter pelo menos 6 caracteres.');
      return;
    }

    setSaving(true);
    try {
      const url    = editing
        ? `/api/representatives/${editing.id}`
        : '/api/representatives';
      const method = editing ? 'PUT' : 'POST';
      const payload: Record<string, string> = {
        name:     form.name,
        username: form.username,
        email:    form.email,
      };
      if (!editing) payload.password = form.password;

      const r = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);

      showToast(
        editing
          ? 'Representante atualizado!'
          : 'Representante criado com sucesso!'
      );
      setShowModal(false);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (rep: Representative) => {
    const next = !rep.active;
    const label = next ? 'Ativar' : 'Desativar';
    if (
      !confirm(
        `${label} o representante "${rep.name || rep.username}"?`
      )
    )
      return;

    try {
      const r = await apiFetch(
        `/api/representatives/${rep.id}/status`,
        { method: 'PATCH', body: JSON.stringify({ active: next }) }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      showToast(
        next ? '✅ Representante ativado.' : 'Representante desativado.'
      );
      await load();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Modais */}
      {regionsRep && (
        <RegionsModal
          rep={regionsRep}
          onClose={() => setRegionsRep(null)}
          showToast={showToast}
        />
      )}
      {passwordRep && (
        <PasswordModal
          rep={passwordRep}
          onClose={() => setPasswordRep(null)}
          showToast={showToast}
        />
      )}

      {/* Header */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary-400" />
              Representantes
            </h2>
            <p className="text-xs text-dark-400 mt-0.5">
              Usuários com acesso de representante comercial
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Representante
          </button>
        </div>

        {loading ? (
          <p className="text-dark-400 text-sm py-4 text-center">
            Carregando...
          </p>
        ) : reps.length === 0 ? (
          <div className="text-center py-8 text-dark-500">
            <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum representante cadastrado</p>
            <button
              onClick={openNew}
              className="mt-2 text-primary-400 hover:text-primary-300 text-xs"
            >
              + Cadastrar primeiro representante
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {reps.map(rep => (
              <div
                key={rep.id}
                className={`flex items-center justify-between py-3 px-4 rounded-lg border transition-colors ${
                  rep.active
                    ? 'bg-dark-900 border-dark-700'
                    : 'bg-dark-950 border-dark-800 opacity-60'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">
                      {rep.name || rep.username}
                    </span>
                    {!rep.active && (
                      <span className="text-xs bg-dark-700 text-dark-400 px-1.5 py-0.5 rounded">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="text-dark-500 text-xs mt-0.5">
                    @{rep.username}
                    {rep.email && (
                      <span className="ml-2">· {rep.email}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <button
                    onClick={() => setRegionsRep(rep)}
                    title="Gerenciar regiões"
                    className="text-dark-400 hover:text-primary-400 p-1.5 rounded hover:bg-dark-700 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPasswordRep(rep)}
                    title="Redefinir senha"
                    className="text-dark-400 hover:text-yellow-400 p-1.5 rounded hover:bg-dark-700 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(rep)}
                    title="Editar dados"
                    className="text-dark-400 hover:text-white p-1.5 rounded hover:bg-dark-700 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleStatus(rep)}
                    title={rep.active ? 'Desativar' : 'Ativar'}
                    className={`p-1.5 rounded hover:bg-dark-700 transition-colors ${
                      rep.active
                        ? 'text-dark-400 hover:text-red-400'
                        : 'text-dark-400 hover:text-green-400'
                    }`}
                  >
                    {rep.active ? (
                      <UserX className="w-3.5 h-3.5" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-md">
            <div className="p-5 border-b border-dark-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">
                {editing ? 'Editar Representante' : 'Novo Representante'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-dark-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-dark-400 mb-1">
                  Nome completo *
                </label>
                <input
                  value={form.name}
                  onChange={e => f('name', e.target.value)}
                  placeholder="Ex: João da Silva"
                  className={inp}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-dark-400 mb-1">
                  Usuário (login) *
                </label>
                <input
                  value={form.username}
                  onChange={e =>
                    f('username', e.target.value.toLowerCase().replace(/\s/g, ''))
                  }
                  placeholder="Ex: joao.silva"
                  className={inp}
                  disabled={!!editing}
                />
                {editing && (
                  <p className="text-xs text-dark-500 mt-1">
                    O usuário não pode ser alterado após o cadastro.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-dark-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => f('email', e.target.value)}
                  placeholder="Ex: joao@empresa.com"
                  className={inp}
                />
              </div>

              {!editing && (
                <div>
                  <label className="block text-xs text-dark-400 mb-1">
                    Senha inicial *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => f('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={inp}
                  />
                  <p className="text-xs text-dark-500 mt-1">
                    Poderá ser alterada depois na opção "Redefinir Senha".
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-dark-700 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-dark-400 hover:text-white text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving
                  ? 'Salvando...'
                  : editing
                  ? 'Salvar'
                  : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
