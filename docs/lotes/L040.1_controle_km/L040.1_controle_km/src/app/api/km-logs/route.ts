// src/app/api/km-logs/route.ts
// Lote: L040.1 — Controle de KM
//
// AI-CONTEXT: Segue exatamente o padrão de src/app/api/orders/route.ts (L036-A).
// getRequestContext extrai workspace, userId e role do JWT injetado pelo middleware.
// getAdmin() usa service_role — RLS não aplica; filtros são OBRIGATÓRIOS na aplicação.
//
// CRITICAL: Toda query de leitura deve incluir .is('deleted_at', null).
// CRITICAL: Toda query deve incluir .eq('workspace', workspace).

import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

// AI-RULE: representative vê apenas seus próprios registros.
//          admin e manager veem todo o workspace e podem filtrar por ?user_id=.
//          Qualquer outro role (ex: 'user') recebe 403.
const ALLOWED_ROLES = ['admin', 'manager', 'representative'];

// ---------------------------------------------------------------------------
// GET /api/km-logs
// Query params: from (date), to (date), user_id? (admin/manager only)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { workspace, userId, role } = getRequestContext(request);

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from   = searchParams.get('from');
  const to     = searchParams.get('to');
  const filterUserId = searchParams.get('user_id');

  // CRITICAL: workspace sempre filtrado — sem exceção.
  let query = getAdmin()
    .from('km_logs')
    .select('*')
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false });

  // AI-RULE: representative só vê os próprios registros — user_id do token, não da query.
  if (role === 'representative') {
    query = query.eq('user_id', userId);
  } else if (filterUserId) {
    // admin/manager podem filtrar por representante específico
    query = query.eq('user_id', filterUserId);
  }

  if (from) query = query.gte('data', from);
  if (to)   query = query.lte('data', to);

  const { data, error } = await query;

  if (error) {
    console.error('[GET /api/km-logs]', error.message);
    return NextResponse.json({ error: 'Erro ao buscar registros de KM.' }, { status: 500 });
  }

  // Totais do período para exibição no dashboard
  const kmLogs = data ?? [];
  const total_percorrido  = kmLogs.reduce((s, r) => s + (r.percorrido  ?? 0), 0);
  const total_litros      = kmLogs.reduce((s, r) => s + (r.litros      ?? 0), 0);
  const total_combustivel = kmLogs.reduce((s, r) => s + (r.combustivel ?? 0), 0);

  return NextResponse.json({ km_logs: kmLogs, total_percorrido, total_litros, total_combustivel });
}

// ---------------------------------------------------------------------------
// POST /api/km-logs
// Body: { data, veiculo, km_ini, km_fim, litros?, combustivel?, obs? }
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const { workspace, userId, role } = getRequestContext(request);

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  const { data: dataStr, veiculo, km_ini, km_fim, litros, combustivel, obs } = body as {
    data: string; veiculo: string; km_ini: number; km_fim: number;
    litros?: number; combustivel?: number; obs?: string;
  };

  // Validação de campos obrigatórios
  if (!dataStr || !veiculo || km_ini == null || km_fim == null) {
    return NextResponse.json({ error: 'Campos obrigatórios: data, veiculo, km_ini, km_fim.' }, { status: 400 });
  }

  // CRITICAL: km_fim deve ser >= km_ini — backend é fonte de verdade.
  if (Number(km_fim) < Number(km_ini)) {
    return NextResponse.json(
      { error: 'KM final não pode ser menor que KM inicial.' },
      { status: 400 }
    );
  }

  // Verificar duplicidade diária ativa (workspace + user_id + data)
  const { data: existing, error: checkError } = await getAdmin()
    .from('km_logs')
    .select('id')
    .eq('workspace', workspace)
    .eq('user_id', userId)
    .eq('data', dataStr)
    .is('deleted_at', null)
    .maybeSingle();

  if (checkError) {
    console.error('[POST /api/km-logs] check duplicidade', checkError.message);
    return NextResponse.json({ error: 'Erro ao verificar duplicidade.' }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json(
      { error: 'Já existe um registro ativo de KM para esta data.' },
      { status: 409 }
    );
  }

  // Cálculos — backend é fonte de verdade
  const percorrido   = Number(km_fim) - Number(km_ini);
  const consumo      = litros && Number(litros) > 0 ? percorrido / Number(litros) : null;
  const custo_por_km = combustivel && percorrido > 0 ? Number(combustivel) / percorrido : null;

  const { data: inserted, error: insertError } = await getAdmin()
    .from('km_logs')
    .insert({
      workspace,
      user_id:     userId,
      data:        dataStr,
      veiculo:     String(veiculo),
      km_ini:      Number(km_ini),
      km_fim:      Number(km_fim),
      percorrido,
      litros:      litros      != null ? Number(litros)      : null,
      combustivel: combustivel != null ? Number(combustivel) : null,
      consumo,
      custo_por_km,
      obs:         obs ?? null,
    })
    .select()
    .single();

  if (insertError) {
    // Captura violação de unique constraint (race condition)
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'Já existe um registro ativo de KM para esta data.' },
        { status: 409 }
      );
    }
    console.error('[POST /api/km-logs]', insertError.message);
    return NextResponse.json({ error: 'Erro ao criar registro de KM.' }, { status: 500 });
  }

  // DEPENDE DE: auditLog — seguir padrão das rotas irmãs quando disponível
  // auditLog(workspace, userId, 'km_log_create', { id: inserted.id, data: dataStr });

  return NextResponse.json({ km_log: inserted }, { status: 201 });
}
