// POST /api/auth/change-password — troca senha do usuário autenticado
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { getRequestContext } from '@/lib/requestContext';

export async function POST(req: NextRequest) {
  try {
    const { currentPassword, newPassword } = await req.json();
    const { userId, workspace } = getRequestContext(req);

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Informe a senha atual e a nova.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Nova senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'A nova senha deve ser diferente da senha atual.' },
        { status: 400 }
      );
    }

    const admin = getAdmin();

    const { data: user, error: userError } = await admin
      .from('users')
      .select('id,pass_hash')
      .eq('id', userId)
      .eq('workspace', workspace)
      .eq('active', true)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.pass_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 });
    }

    const { hash, algo } = await hashPassword(newPassword);

    const { error: updateError } = await admin
      .from('users')
      .update({
        pass_hash: hash,
        hash_algo: algo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('workspace', workspace)
      .eq('active', true);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await auditLog('[SEGURANÇA] Senha alterada', { workspace }, userId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
