import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const workspace = req.headers.get('x-workspace') || 'principal';

  const { data, error } = await getAdmin()
    .from('referrals')
    .select(
      'id,name,document,tel,email,commission_type,commission_pct,commission,active,bank_name,bank_agency,bank_account,bank_pix,created_at'
    )
    .eq('workspace', workspace)
    .eq('active', true)
    .is('deleted_at', null)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ referrals: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const workspace = req.headers.get('x-workspace') || 'principal';
  const userId = req.headers.get('x-user-id') || '';

  if (!body.name) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data, error } = await getAdmin()
    .from('referrals')
    .insert([{
      ...body,
      id: crypto.randomUUID(),
      workspace,
      active: true,
      created_at: now,
      updated_at: now,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog('[CADASTRO] Indicador criado', { name: body.name, workspace }, userId);

  return NextResponse.json({ referral: data }, { status: 201 });
}
