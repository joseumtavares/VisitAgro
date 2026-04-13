import type { SupabaseClient } from '@supabase/supabase-js';

export async function generateCommission(
  admin: SupabaseClient,
  order: any,
  amount: number
): Promise<void> {
  if (!order?.referral_id || !amount) {
    return;
  }

  const workspace = order.workspace || 'principal';

  const [{ data: ref }, { data: client }] = await Promise.all([
    admin
      .from('referrals')
      .select('name')
      .eq('id', order.referral_id)
      .eq('workspace', workspace)
      .is('deleted_at', null)
      .maybeSingle(),
    admin
      .from('clients')
      .select('name')
      .eq('id', order.client_id)
      .eq('workspace', workspace)
      .is('deleted_at', null)
      .maybeSingle(),
  ]);

  await admin.from('commissions').insert([
    {
      id: crypto.randomUUID(),
      workspace,
      referral_id: order.referral_id,
      referral_name: ref?.name ?? '',
      order_id: order.id,
      client_id: order.client_id,
      client_name: client?.name ?? '',
      amount,
      commission_type: order.commission_type ?? 'fixed',
      status: 'pendente',
      order_date: order.date ?? null,
      order_total: order.total ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
}
