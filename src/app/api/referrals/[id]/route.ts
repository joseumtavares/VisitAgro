import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const workspace = req.headers.get('x-workspace') || 'principal';
  const body = await req.json();

  const { data, error } = await getAdmin()
    .from('referrals')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ referral: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const workspace = req.headers.get('x-workspace') || 'principal';

  const { error } = await getAdmin()
    .from('referrals')
    .update({
      active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
