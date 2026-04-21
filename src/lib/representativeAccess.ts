import { getAdmin } from './supabaseAdmin';

export async function resolveUserAccess(userId: string | null) {
  if (!userId) {
    return { ok: false, error: 'Usuário não identificado' };
  }

  const admin = getAdmin();

  const { data: user, error } = await admin
    .from('users')
    .select('id, role, workspace, active')
    .eq('id', userId)
    .maybeSingle();

  if (error || !user || !user.active) {
    return { ok: false, error: 'Usuário inválido ou inativo' };
  }

  return {
    ok: true,
    user,
    role: user.role,
    workspace: user.workspace,
  };
}