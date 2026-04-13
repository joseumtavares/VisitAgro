import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { workspace } = getRequestContext(req);
  const body = await req.json();
  const update: Record<string, unknown> = { status: body.status, updated_at: new Date().toISOString() };
  if (body.status === 'paga') update.paid_at = new Date().toISOString();
  const { data, error } = await getAdmin()
    .from('commissions')
    .update(update)
    .eq('id', params.id)
    .eq('workspace', workspace)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await auditLog('[COMISSÃO] Status atualizado', { id: params.id, status: body.status });
  return NextResponse.json({ commission: data });
}
