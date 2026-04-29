// src/app/api/km-logs/[id]/route.ts
// Lote: L040.1 — Controle de KM
//
// AI-CONTEXT: Segue o padrão de src/app/api/orders/[id]/route.ts.
// Soft delete via deleted_at. Representative só altera próprios registros.
//
// CRITICAL: Buscar sempre com .eq('workspace', workspace) + .is('deleted_at', null).
// CRITICAL: representative não pode editar/remover registro de outro user_id.

import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

const ALLOWED_ROLES = ['admin', 'manager', 'representative'];

// ---------------------------------------------------------------------------
// PUT /api/km-logs/[id]
// Body: campos parciais a atualizar (data?, veiculo?, km_ini?, km_fim?, ...)
// ---------------------------------------------------------------------------
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { workspace, userId, role } = getRequestContext(request);
  const { id } = params;

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  // Buscar registro existente no workspace (não deletado)
  const { data: existing, error: fetchError } = await getAdmin()
    .from('km_logs')
    .select('*')
    .eq('id', id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    console.error('[PUT /api/km-logs/[id]]', fetchError.message);
    return NextResponse.json({ error: 'Erro ao buscar registro.' }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
  }

  // AI-RULE: representative só pode editar seu próprio registro.
  if (role === 'representative' && existing.user_id !== userId) {
    return NextResponse.json({ error: 'Sem permissão para editar este registro.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  // Mesclar valores — usar existente quando não informado
  const km_ini_new = body.km_ini != null ? Number(body.km_ini) : existing.km_ini;
  const km_fim_new = body.km_fim != null ? Number(body.km_fim) : existing.km_fim;

  // CRITICAL: recalcular km_fim >= km_ini antes de persistir.
  if (km_fim_new < km_ini_new) {
    return NextResponse.json(
      { error: 'KM final não pode ser menor que KM inicial.' },
      { status: 400 }
    );
  }

  // Recalcular campos derivados — backend é fonte de verdade
  const percorrido    = km_fim_new - km_ini_new;
  const litros_new    = body.litros      !== undefined ? (body.litros      ?? null) as number | null : existing.litros;
  const comb_new      = body.combustivel !== undefined ? (body.combustivel ?? null) as number | null : existing.combustivel;
  const consumo       = litros_new && Number(litros_new) > 0 ? percorrido / Number(litros_new) : null;
  const custo_por_km  = comb_new   && percorrido > 0         ? Number(comb_new) / percorrido   : null;

  const updatePayload: Record<string, unknown> = {
    km_ini:      km_ini_new,
    km_fim:      km_fim_new,
    percorrido,
    litros:      litros_new,
    combustivel: comb_new,
    consumo,
    custo_por_km,
  };

  if (body.data    !== undefined) updatePayload.data    = body.data;
  if (body.veiculo !== undefined) updatePayload.veiculo = body.veiculo;
  if (body.obs     !== undefined) updatePayload.obs     = body.obs ?? null;

  const { data: updated, error: updateError } = await getAdmin()
    .from('km_logs')
    .update(updatePayload)
    .eq('id', id)
    .eq('workspace', workspace)
    .select()
    .single();

  if (updateError) {
    console.error('[PUT /api/km-logs/[id]]', updateError.message);
    return NextResponse.json({ error: 'Erro ao atualizar registro.' }, { status: 500 });
  }

  // DEPENDE DE: auditLog — seguir padrão das rotas irmãs quando disponível
  // auditLog(workspace, userId, 'km_log_update', { id });

  return NextResponse.json({ km_log: updated });
}

// ---------------------------------------------------------------------------
// DELETE /api/km-logs/[id]
// Soft delete: atualiza deleted_at — não remove o registro do banco.
// ---------------------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { workspace, userId, role } = getRequestContext(request);
  const { id } = params;

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  // Buscar registro existente
  const { data: existing, error: fetchError } = await getAdmin()
    .from('km_logs')
    .select('id, user_id')
    .eq('id', id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    console.error('[DELETE /api/km-logs/[id]]', fetchError.message);
    return NextResponse.json({ error: 'Erro ao buscar registro.' }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
  }

  // AI-RULE: representative só pode remover seu próprio registro.
  if (role === 'representative' && existing.user_id !== userId) {
    return NextResponse.json({ error: 'Sem permissão para remover este registro.' }, { status: 403 });
  }

  // CRITICAL: soft delete — nunca DELETE físico.
  const { error: deleteError } = await getAdmin()
    .from('km_logs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace', workspace);

  if (deleteError) {
    console.error('[DELETE /api/km-logs/[id]]', deleteError.message);
    return NextResponse.json({ error: 'Erro ao remover registro.' }, { status: 500 });
  }

  // DEPENDE DE: auditLog — seguir padrão das rotas irmãs quando disponível
  // auditLog(workspace, userId, 'km_log_delete', { id });

  return NextResponse.json({ success: true });
}
