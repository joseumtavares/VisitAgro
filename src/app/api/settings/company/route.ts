// POST /api/settings/company — cria ou atualiza dados da empresa
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const admin = getAdmin();
    const { id, ...data } = body;

    let company;
    if (id) {
      const { data: updated, error } = await admin.from('companies')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id).select().single();
      if (error) throw error;
      company = updated;
    } else {
      const { data: created, error } = await admin.from('companies')
        .insert([{ ...data, id: crypto.randomUUID() }]).select().single();
      if (error) throw error;
      company = created;
      // Vincula ao settings
      await admin.from('settings')
        .update({ company_id: company.id })
        .eq('workspace', 'principal');
    }

    const uid = req.headers.get('x-user-id') || '';
    await auditLog('[SETTINGS] Empresa atualizada', { company_id: company?.id }, uid);
    return NextResponse.json({ company });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
