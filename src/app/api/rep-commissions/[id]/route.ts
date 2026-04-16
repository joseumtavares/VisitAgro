import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

type RepCommissionStatus = 'pendente' | 'paga' | 'cancelada';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { workspace, userId, role } = getRequestContext(req);
  const body = await req.json();

  const nextStatus = body.status as RepCommissionStatus | undefined;

  if (!nextStatus || !['pendente', 'paga', 'cancelada'].includes(nextStatus)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  }

  // Apenas admin/manager pode alterar status
  if (role !== 'admin' && role !== 'manager') {
    return NextResponse.json(
      { error: 'Acesso restrito a administradores e gerentes.' },
      { status: 403 }
    );
  }

  const update: Record<string, unknown> = {
    status:     nextStatus,
    updated_at: new Date().toISOString(),
  };

  if (nextStatus === 'paga') {
    update.paid_at = new Date().toISOString();
  } else {
    update.paid_at = null;
  }

  const { data, error } = await getAdmin()
    .from('rep_commissions')
    .update(update)
    .eq('id', params.id)
    .eq('workspace', workspace)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog(
    '[COMISSÃO REP] Status atualizado',
    { id: params.id, status: nextStatus, workspace },
    userId
  );

  return NextResponse.json({ rep_commission: data });
}
