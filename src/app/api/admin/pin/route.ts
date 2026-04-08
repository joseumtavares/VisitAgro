import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const { pin_hash } = await req.json();
  if (!pin_hash) return NextResponse.json({ error: 'PIN hash obrigatório' }, { status: 400 });

  const admin = getAdmin();
  const { error } = await admin
    .from('settings')
    .update({ dev_pin_hash: pin_hash })
    .eq('workspace', 'principal');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await auditLog('[SEGURANÇA] PIN de manutenção atualizado');
  return NextResponse.json({ ok: true });
}
