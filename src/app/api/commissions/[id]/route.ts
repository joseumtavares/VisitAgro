import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const update: Record<string, any> = { status: body.status, updated_at: new Date().toISOString() };
  if (body.status === 'paga') update.paid_at = new Date().toISOString();
  const { data, error } = await getAdmin().from('commissions')
    .update(update).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await auditLog('[COMISSÃO] Status atualizado', { id: params.id, status: body.status });
  return NextResponse.json({ commission: data });
}
