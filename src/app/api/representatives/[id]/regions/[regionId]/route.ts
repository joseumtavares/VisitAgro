import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';
import { resolveUserAccess } from '@/lib/representativeAccess';

// ── DELETE /api/representatives/[id]/regions/[regionId] ───────
// Remove uma região de um representante.
// Apenas admin/manager.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; regionId: string } }
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

  const { error } = await getAdmin()
    .from('rep_regions')
    .delete()
    .eq('id', params.regionId)
    .eq('rep_id', params.id)
    .eq('workspace', workspace);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog(
    '[REPRESENTANTE] Região removida',
    { rep_id: params.id, region_id: params.regionId, workspace },
    userId
  );

  return NextResponse.json({ ok: true });
}
