// POST /api/auth/change-password — troca senha do usuário autenticado
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin }                  from '@/lib/supabaseAdmin';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { currentPassword, newPassword } = await req.json();
    const userId = req.headers.get('x-user-id') || '';
    if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: 'Informe a senha atual e a nova.' }, { status: 400 });
    if (newPassword.length < 6)
      return NextResponse.json({ error: 'Nova senha deve ter pelo menos 6 caracteres.' }, { status: 400 });

    const admin = getAdmin();
    const { data: user } = await admin.from('users')
      .select('pass_hash').eq('id', userId).maybeSingle();
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

    const valid = await verifyPassword(currentPassword, user.pass_hash);
    if (!valid) return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 });

    const { hash, algo } = await hashPassword(newPassword);
    await admin.from('users')
      .update({ pass_hash: hash, hash_algo: algo, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
