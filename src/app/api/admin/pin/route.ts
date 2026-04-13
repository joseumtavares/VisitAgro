import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const { pin_hash } = await req.json();

  if (!pin_hash) {
    return NextResponse.json({ error: 'PIN hash obrigatório' }, { status: 400 });
  }

  const admin = getAdmin();
  const workspace = req.headers.get('x-workspace') || 'principal';
  const userId = req.headers.get('x-user-id') || '';

  const { data: existingSetting } = await admin
    .from('settings')
    .select('id')
    .eq('workspace', workspace)
    .maybeSingle();

  let error: any = null;

  if (existingSetting?.id) {
    const result = await admin
      .from('settings')
      .update({
        dev_pin_hash: pin_hash,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace', workspace);

    error = result.error;
  } else {
    const result = await admin
      .from('settings')
      .insert([{
        id: crypto.randomUUID(),
        workspace,
        config: {},
        dev_pin_hash: pin_hash,
        updated_at: new Date().toISOString(),
      }]);

    error = result.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog('[SEGURANÇA] PIN de manutenção atualizado', { workspace }, userId);

  return NextResponse.json({ ok: true });
}
