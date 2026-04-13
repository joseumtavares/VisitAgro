import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { workspace } = getRequestContext(req);
  const body = await req.json();
  const { data, error } = await getAdmin()
    .from('referrals')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('workspace', workspace)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ referral: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { workspace } = getRequestContext(req);
  const now = new Date().toISOString();
  const { error } = await getAdmin()
    .from('referrals')
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq('id', params.id)
    .eq('workspace', workspace);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
