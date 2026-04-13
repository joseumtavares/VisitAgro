import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

type CommissionStatus = 'pendente' | 'paga' | 'cancelada';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const workspace = req.headers.get('x-workspace') || 'principal';
  const userId = req.headers.get('x-user-id') || '';

  const nextStatus = body.status as CommissionStatus | undefined;

  if (!nextStatus || !['pendente', 'paga', 'cancelada'].includes(nextStatus)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  }

  const update: Record<string, any> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };

  if (nextStatus === 'paga') {
    update.paid_at = new Date().toISOString();
  }

  if (nextStatus !== 'paga') {
    update.paid_at = null;
  }

  const { data, error } = await getAdmin()
    .from('commissions')
    .update(update)
    .eq('id', params.id)
    .eq('workspace', workspace)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog(
    '[COMISSÃO] Status atualizado',
    { id: params.id, status: nextStatus, workspace },
    userId
  );

  return NextResponse.json({ commission: data });
}
