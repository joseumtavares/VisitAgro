import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const admin = getAdmin();
    const workspace = req.headers.get('x-workspace') || 'principal';
    const uid = req.headers.get('x-user-id') || '';
    const { id, ...data } = body;

    let company: any;

    if (id) {
      const { data: updated, error } = await admin
        .from('companies')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      company = updated;
    } else {
      const { data: created, error } = await admin
        .from('companies')
        .insert([{
          ...data,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      company = created;
    }

    const { data: existingSetting } = await admin
      .from('settings')
      .select('id')
      .eq('workspace', workspace)
      .maybeSingle();

    if (existingSetting?.id) {
      const { error: settingsUpdateError } = await admin
        .from('settings')
        .update({
          company_id: company.id,
          updated_at: new Date().toISOString(),
        })
        .eq('workspace', workspace);

      if (settingsUpdateError) throw settingsUpdateError;
    } else {
      const { error: settingsInsertError } = await admin
        .from('settings')
        .insert([{
          id: crypto.randomUUID(),
          workspace,
          company_id: company.id,
          config: {},
          updated_at: new Date().toISOString(),
        }]);

      if (settingsInsertError) throw settingsInsertError;
    }

    await auditLog('[SETTINGS] Empresa atualizada', { company_id: company?.id, workspace }, uid);

    return NextResponse.json({ company });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
