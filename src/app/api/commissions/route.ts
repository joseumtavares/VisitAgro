import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const workspace = req.headers.get('x-workspace') || 'principal';

  const { data, error } = await getAdmin()
    .from('commissions')
    .select(
      'id,workspace,referral_id,referral_name,order_id,client_id,client_name,amount,commission_type,status,paid_at,order_date,order_total,receipt_photo_ids,created_at,updated_at'
    )
    .eq('workspace', workspace)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ commissions: data ?? [] });
}
