import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { workspace } = getRequestContext(req);
  const { data, error } = await getAdmin()
    .from('commissions')
    .select('id,referral_id,referral_name,order_id,client_name,amount,commission_type,status,paid_at,order_date,order_total,receipt_photo_ids,created_at')
    .eq('workspace', workspace)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ commissions: data ?? [] });
}
