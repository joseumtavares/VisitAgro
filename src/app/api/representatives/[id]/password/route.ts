import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';
import { hashPassword } from '@/lib/auth';
import { resolveUserAccess } from '@/lib/representativeAccess';

// ── POST /api/representatives/[id]/password ───────────────────
// Redefine a senha de um representante.
// Apenas admin/manager podem usar este endpoint.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  
const { userId } = getRequestContext(req);

const access = await resolveUserAccess(userId);

if (!access.ok) {
  return NextResponse.json({ error: access.error }, { status: 401 });
}

if (access.role !== 'admin' && access.role !== 'manager') {
  return NextResponse.json(
    { error: 'Acesso restrito a administradores e gerentes.' },
    { status: 403 }
  );
}

const workspace = access.workspace;

  const body = await req.json();
  const { password } = body;

  if (!password || String(password).length < 6) {
    return NextResponse.json(
      { error: 'A nova senha deve ter pelo menos 6 caracteres.' },
      { status: 400 }
    );
  }

  // Verificar que o usuário existe e é realmente representante no workspace
  const { data: rep, error: findErr } = await getAdmin()
    .from('users')
    .select('id')
    .eq('id', params.id)
    .eq('workspace', workspace)
    .eq('role', 'representative')
    .maybeSingle();

  if (findErr || !rep) {
    return NextResponse.json(
      { error: 'Representante não encontrado.' },
      { status: 404 }
    );
  }

  const { hash, algo } = await hashPassword(String(password));

  const { error } = await getAdmin()
    .from('users')
    .update({
      pass_hash:  hash,
      hash_algo:  algo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('workspace', workspace)
    .eq('role', 'representative');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog(
    '[SEGURANÇA] Senha de representante redefinida',
    { rep_id: params.id, workspace },
    userId
  );

  return NextResponse.json({ ok: true });
}
