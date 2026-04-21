import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

// ── GET /api/representatives/[id] ────────────────────────────
// Representative pode ver a si mesmo; admin/manager veem qualquer um.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { workspace, role, userId } = getRequestContext(req);

  const isAdminOrManager = role === 'admin' || role === 'manager';
  const isSelf          = userId === params.id;

  if (!isAdminOrManager && !isSelf) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }

  const { data, error } = await getAdmin()
    .from('users')
    .select(
      'id,name,username,email,role,active,workspace,company_id,created_at,updated_at'
    )
    .eq('id', params.id)
    .eq('workspace', workspace)
    .eq('role', 'representative')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Representante não encontrado.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ representative: data });
}

// ── PUT /api/representatives/[id] ────────────────────────────
// Atualiza nome, email e username. Apenas admin/manager.
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  import { resolveUserAccess } from '@/lib/representativeAccess';

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
  const { name, email, username } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    name:       name.trim(),
    email:      email?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (username?.trim()) {
    update.username = username.trim().toLowerCase();
  }

  const { data, error } = await getAdmin()
    .from('users')
    .update(update)
    .eq('id', params.id)
    .eq('workspace', workspace)
    .eq('role', 'representative')
    .select(
      'id,name,username,email,role,active,workspace,created_at,updated_at'
    )
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Usuário ou e-mail já cadastrado neste workspace.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog(
    '[REPRESENTANTE] Atualizado',
    { rep_id: params.id, workspace },
    userId
  );

  return NextResponse.json({ representative: data });
}
