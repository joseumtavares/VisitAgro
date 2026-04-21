import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';
import { hashPassword } from '@/lib/auth';

// ── GET /api/representatives ──────────────────────────────────
// Retorna todos os representantes do workspace.
// Acesso restrito: admin e manager.
export async function GET(req: NextRequest) {
  const { workspace, role } = getRequestContext(req);

  if (role !== 'admin' && role !== 'manager') {
    return NextResponse.json(
      { error: 'Acesso restrito a administradores e gerentes.' },
      { status: 403 }
    );
  }

  const { data, error } = await getAdmin()
    .from('users')
    .select(
      'id,name,username,email,role,active,workspace,company_id,created_at,updated_at'
    )
    .eq('workspace', workspace)
    .eq('role', 'representative')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ representatives: data ?? [] });
}

// ── POST /api/representatives ─────────────────────────────────
// Cria um novo representante (usuário com role='representative').
// Acesso restrito: admin e manager.
export async function POST(req: NextRequest) {
  const { workspace, role, userId } = getRequestContext(req);

  if (role !== 'admin' && role !== 'manager') {
    return NextResponse.json(
      { error: 'Acesso restrito a administradores e gerentes.' },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, username, email, password } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });
  }
  if (!username?.trim()) {
    return NextResponse.json(
      { error: 'Nome de usuário é obrigatório.' },
      { status: 400 }
    );
  }
  if (!password || String(password).length < 6) {
    return NextResponse.json(
      { error: 'Senha deve ter pelo menos 6 caracteres.' },
      { status: 400 }
    );
  }

  const { hash, algo } = await hashPassword(String(password));
  const now = new Date().toISOString();

  const { data, error } = await getAdmin()
    .from('users')
    .insert([
      {
        id:         crypto.randomUUID(),
        workspace,
        name:       name.trim(),
        username:   username.trim().toLowerCase(),
        email:      email?.trim() || null,
        pass_hash:  hash,
        hash_algo:  algo,
        role:       'representative',
        active:     true,
        created_at: now,
        updated_at: now,
      },
    ])
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
    '[REPRESENTANTE] Criado',
    { rep_id: data.id, username: data.username, workspace },
    userId
  );

  return NextResponse.json({ representative: data }, { status: 201 });
}
