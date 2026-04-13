// POST /api/settings/company — cria ou atualiza dados da empresa
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const admin = getAdmin();
    const { workspace, userId } = getRequestContext(req);
    const { id, ...data } = body;
    const now = new Date().toISOString();

    let company;
    if (id) {
      const { data: updated, error } = await admin.from('companies')
        .update({ ...data, updated_at: now })
        .eq('id', id).select().single();
      if (error) throw error;
      company = updated;
    } else {
      const { data: created, error } = await admin.from('companies')
        .insert([{ ...data, id: crypto.randomUUID() }]).select().single();
      if (error) throw error;
      company = created;

      const { data: existing } = await admin
        .from('settings')
        .select('id')
        .eq('workspace', workspace)
        .maybeSingle();

      if (existing) {
        await admin.from('settings')
          .update({ company_id: company.id, updated_at: now })
          .eq('workspace', workspace);
      } else {
        await admin.from('settings').insert([{
          id: crypto.randomUUID(),
          workspace,
          company_id: company.id,
          config: {},
          updated_at: now,
        }]);
      }
    }

    await auditLog('[SETTINGS] Empresa atualizada', { company_id: company?.id }, userId);
    return NextResponse.json({ company });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
