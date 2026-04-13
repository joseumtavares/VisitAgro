import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { pin_hash } = await req.json();
  if (!pin_hash) return NextResponse.json({ error: 'PIN hash obrigatório' }, { status: 400 });

  const { workspace } = getRequestContext(req);
  const admin = getAdmin();
  const now = new Date().toISOString();

  const { error } = await admin
    .from('settings')
    .update({ dev_pin_hash: pin_hash, updated_at: now })
    .eq('workspace', workspace);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await auditLog('[SEGURANÇA] PIN de manutenção atualizado');
  return NextResponse.json({ ok: true });
}
