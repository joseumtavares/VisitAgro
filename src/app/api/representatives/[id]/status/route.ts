import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

// ── PATCH /api/representatives/[id]/status ────────────────────
// Ativa ou desativa um representante.
// Apenas admin/manager podem usar este endpoint.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { workspace, role, userId } = getRequestContext(req);

  if (role !== 'admin' && role !== 'manager') {
    return NextResponse.json(
      { error: 'Acesso restrito a administradores e gerentes.' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { active } = body;

  if (typeof active !== 'boolean') {
    return NextResponse.json(
      { error: 'Campo "active" (boolean) é obrigatório.' },
      { status: 400 }
    );
  }

  const { data, error } = await getAdmin()
    .from('users')
    .update({
      active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('workspace', workspace)
    .eq('role', 'representative')
    .select('id,name,username,active')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Representante não encontrado.' },
      { status: 404 }
    );
  }

  await auditLog(
    active
      ? '[REPRESENTANTE] Ativado'
      : '[REPRESENTANTE] Desativado',
    { rep_id: params.id, active, workspace },
    userId
  );

  return NextResponse.json({ representative: data });
}
