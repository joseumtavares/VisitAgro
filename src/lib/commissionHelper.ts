// src/lib/commissionHelper.ts
// Helper server-side para geração de comissões — importável em qualquer API route
import type { SupabaseClient } from '@supabase/supabase-js';

export async function generateCommission(
  admin: SupabaseClient,
  order: any,
  amount: number
): Promise<void> {
  if (!order.referral_id || !amount) return;

  const [{ data: ref }, { data: client }] = await Promise.all([
    admin.from('referrals').select('name').eq('id', order.referral_id).maybeSingle(),
    admin.from('clients').select('name').eq('id', order.client_id).maybeSingle(),
  ]);

  await admin.from('commissions').insert([{
    id: crypto.randomUUID(),
    workspace: 'principal',
    referral_id:   order.referral_id,
    referral_name: ref?.name ?? '',
    order_id:      order.id,
    client_id:     order.client_id,
    client_name:   client?.name ?? '',
    amount,
    commission_type: order.commission_type ?? 'fixed',
    status:          'pendente',
    order_date:      order.date,
    order_total:     order.total,
    created_at:      new Date().toISOString(),
  }]);
}
