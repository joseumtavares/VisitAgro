import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await getAdmin()
    .from('commissions')
    .select('id,referral_id,referral_name,order_id,client_name,amount,commission_type,status,paid_at,order_date,order_total,receipt_photo_ids,created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ commissions: data ?? [] });
}
