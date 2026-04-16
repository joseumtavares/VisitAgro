import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

export async function GET(req: NextRequest) {
  const { workspace, role, userId } = getRequestContext(req);
  const { searchParams } = new URL(req.url);

  const status = searchParams.get('status');
  const repId  = searchParams.get('rep_id');

  let query = getAdmin()
    .from('rep_commissions')
    .select(
      'id,workspace,rep_id,rep_name,order_id,order_item_id,order_date,' +
      'client_id,client_name,product_id,product_name,qty,unit_price,' +
      'rep_commission_pct,amount,order_total,status,paid_at,' +
      'receipt_photo_ids,reprocessed_at,created_at,updated_at'
    )
    .eq('workspace', workspace)
    .order('created_at', { ascending: false });

  // Representante não-admin vê apenas as próprias comissões
  if (role !== 'admin' && role !== 'manager') {
    query = query.eq('rep_id', userId);
  } else if (repId) {
    query = query.eq('rep_id', repId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rep_commissions: data ?? [] });
}
