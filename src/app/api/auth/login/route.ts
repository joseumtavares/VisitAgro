import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken } from '@/lib/auth';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body ?? {};

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Usuário/Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const clean = String(identifier).toLowerCase().trim();
    const admin = getAdmin();

    const { data: user, error: dbError } = await admin
      .from('users')
      .select(
        'id,username,email,pass_hash,hash_algo,role,active,workspace,failed_logins,locked_until,last_login'
      )
      .or(`username.eq.${clean},email.eq.${clean}`)
      .eq('active', true)
      .maybeSingle();

    if (dbError) {
      console.error('[login] Erro na busca do usuário:', dbError.message);
      await sleep(250);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    if (!user) {
      await sleep(300 + Math.random() * 200);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      return NextResponse.json(
        { error: 'Usuário temporariamente bloqueado. Tente novamente mais tarde.' },
        { status: 423 }
      );
    }

    if (!user.pass_hash) {
      console.error('[login] Usuário sem hash de senha:', clean);
      await sleep(250);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const validPassword = await verifyPassword(password, user.pass_hash);

    if (!validPassword) {
      const failed = Number(user.failed_logins ?? 0) + 1;
      const shouldLock = failed >= 5;
      const lockedUntil = shouldLock
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null;

      await admin
        .from('users')
        .update({
          failed_logins: failed,
          locked_until: lockedUntil,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      await sleep(300 + Math.random() * 200);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    await admin
      .from('users')
      .update({
        failed_logins: 0,
        locked_until: null,
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      workspace: user.workspace ?? 'principal',
    });

    const { pass_hash, hash_algo, failed_logins, locked_until, ...safeUser } = user;

    await auditLog(
      '[AUTH] Login realizado',
      { workspace: safeUser.workspace ?? 'principal' },
      user.id,
      user.username
    );

    return NextResponse.json({ user: safeUser, token });
  } catch (error: any) {
    console.error('[login] Erro inesperado:', error?.message ?? error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}