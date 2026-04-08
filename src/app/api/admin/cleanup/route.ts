import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

const ALLOWED_GROUPS: Record<string, string[]> = {
  clients:     ['clients'],
  orders:      ['order_items','orders','commissions','rep_commissions'],
  products:    ['order_items','products'],
  commissions: ['commissions','rep_commissions'],
  visits:      ['visits'],
  all:         ['visits','commissions','rep_commissions','order_items','orders','clients','products','categories'],
};

export async function POST(req: NextRequest) {
  const { pin, group } = await req.json();
  const admin = getAdmin();

  if (!group || !ALLOWED_GROUPS[group]) {
    return NextResponse.json({ error: 'Grupo inválido' }, { status: 400 });
  }

  // Verifica PIN
  const { data: settings } = await admin.from('settings').select('dev_pin_hash').eq('workspace','principal').maybeSingle();
  if (!settings?.dev_pin_hash) {
    return NextResponse.json({ error: 'PIN não configurado. Configure primeiro nas Configurações.' }, { status: 403 });
  }
  const hash = crypto.createHash('sha256').update(pin ?? '').digest('hex');
  if (hash !== settings.dev_pin_hash) {
    return NextResponse.json({ error: 'PIN inválido' }, { status: 403 });
  }

  const tables = ALLOWED_GROUPS[group];
  const results: Record<string, number> = {};

  for (const table of tables) {
    const { count } = await admin.from(table).select('*', { count: 'exact', head: true });
    await admin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // deleta tudo
    results[table] = count ?? 0;
  }

  await auditLog(`[LIMPEZA] Grupo "${group}" limpo`, { tables: results });
  return NextResponse.json({ ok: true, deleted: results });
}
