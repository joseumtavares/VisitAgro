import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

// ── GET /api/representatives/[id]/regions ─────────────────────
// Lista as regiões (estado + cidade) de um representante.
// Admin/manager: veem qualquer um.
// Representative: só vê as próprias regiões.
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
    .from('rep_regions')
    .select('id,workspace,rep_id,state,city,created_at,updated_at')
    .eq('rep_id', params.id)
    .eq('workspace', workspace)
    .order('state')
    .order('city');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ regions: data ?? [] });
}

// ── POST /api/representatives/[id]/regions ────────────────────
// Adiciona uma nova região ao representante.
// Apenas admin/manager.
export async function POST(
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
  const { state, city } = body;

  if (!state?.trim() || state.trim().length < 2) {
    return NextResponse.json(
      { error: 'Estado (UF) é obrigatório e deve ter 2 letras.' },
      { status: 400 }
    );
  }
  if (!city?.trim()) {
    return NextResponse.json(
      { error: 'Cidade é obrigatória.' },
      { status: 400 }
    );
  }

  // Verificar que representante existe no workspace
  const { data: rep } = await getAdmin()
    .from('users')
    .select('id')
    .eq('id', params.id)
    .eq('workspace', workspace)
    .eq('role', 'representative')
    .maybeSingle();

  if (!rep) {
    return NextResponse.json(
      { error: 'Representante não encontrado.' },
      { status: 404 }
    );
  }

  const now = new Date().toISOString();

  const { data, error } = await getAdmin()
    .from('rep_regions')
    .insert([
      {
        workspace,
        rep_id:     params.id,
        state:      state.trim().toUpperCase().slice(0, 2),
        city:       city.trim(),
        created_at: now,
        updated_at: now,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog(
    '[REPRESENTANTE] Região adicionada',
    { rep_id: params.id, state, city, workspace },
    userId
  );

  return NextResponse.json({ region: data }, { status: 201 });
}
