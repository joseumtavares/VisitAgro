import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

type CleanupGroup = 'clients' | 'orders' | 'products' | 'commissions' | 'visits' | 'all';

const ALLOWED_GROUPS: CleanupGroup[] = [
  'clients',
  'orders',
  'products',
  'commissions',
  'visits',
  'all',
];

async function getIdsByWorkspace(
  table: 'clients' | 'orders' | 'products',
  workspace: string
): Promise<string[]> {
  const { data, error } = await getAdmin()
    .from(table)
    .select('id')
    .eq('workspace', workspace);

  if (error) throw error;

  return (data ?? []).map((row: any) => row.id);
}

async function countByWorkspace(table: string, workspace: string): Promise<number> {
  const { count, error } = await getAdmin()
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('workspace', workspace);

  if (error) throw error;
  return count ?? 0;
}

async function countByIn(table: string, column: string, ids: string[]): Promise<number> {
  if (!ids.length) return 0;

  const { count, error } = await getAdmin()
    .from(table)
    .select('*', { count: 'exact', head: true })
    .in(column, ids);

  if (error) throw error;
  return count ?? 0;
}

async function deleteByWorkspace(table: string, workspace: string): Promise<number> {
  const count = await countByWorkspace(table, workspace);
  if (!count) return 0;

  const { error } = await getAdmin()
    .from(table)
    .delete()
    .eq('workspace', workspace);

  if (error) throw error;
  return count;
}

async function deleteByIds(table: string, column: string, ids: string[]): Promise<number> {
  if (!ids.length) return 0;

  const count = await countByIn(table, column, ids);

  if (!count) return 0;

  const { error } = await getAdmin()
    .from(table)
    .delete()
    .in(column, ids);

  if (error) throw error;

  return count;
}

export async function POST(req: NextRequest) {
  try {
    const { pin, group } = await req.json();
    const workspace = req.headers.get('x-workspace') || 'principal';
    const userId = req.headers.get('x-user-id') || '';

    if (!group || !ALLOWED_GROUPS.includes(group)) {
      return NextResponse.json({ error: 'Grupo inválido' }, { status: 400 });
    }

    const { data: settings } = await getAdmin()
      .from('settings')
      .select('dev_pin_hash')
      .eq('workspace', workspace)
      .maybeSingle();

    if (!settings?.dev_pin_hash) {
      return NextResponse.json(
        { error: 'PIN não configurado. Configure primeiro nas Configurações.' },
        { status: 403 }
      );
    }

    const hash = crypto.createHash('sha256').update(pin ?? '').digest('hex');
    if (hash !== settings.dev_pin_hash) {
      return NextResponse.json({ error: 'PIN inválido' }, { status: 403 });
    }

    const results: Record<string, number> = {};

    if (group === 'visits') {
      results.visits = await deleteByWorkspace('visits', workspace);
    }

    if (group === 'commissions') {
      results.rep_commissions = await deleteByWorkspace('rep_commissions', workspace);
      results.commissions = await deleteByWorkspace('commissions', workspace);
    }

    if (group === 'orders') {
      const orderIds = await getIdsByWorkspace('orders', workspace);

      results.rep_commissions = await deleteByWorkspace('rep_commissions', workspace);
      results.commissions = await deleteByWorkspace('commissions', workspace);
      results.order_items = await deleteByIds('order_items', 'order_id', orderIds);
      results.orders = await deleteByWorkspace('orders', workspace);
    }

    if (group === 'products') {
      const productIds = await getIdsByWorkspace('products', workspace);

      results.rep_commissions = await deleteByIds('rep_commissions', 'product_id', productIds);
      results.order_items = await deleteByIds('order_items', 'product_id', productIds);
      results.products = await deleteByWorkspace('products', workspace);
    }

    if (group === 'clients') {
      const clientIds = await getIdsByWorkspace('clients', workspace);

      const orderIds = await getIdsByWorkspace('orders', workspace);

      results.visits = await deleteByIds('visits', 'client_id', clientIds);
      results.rep_commissions = await deleteByIds('rep_commissions', 'client_id', clientIds);
      results.commissions = await deleteByIds('commissions', 'client_id', clientIds);
      results.order_items = await deleteByIds('order_items', 'order_id', orderIds);
      results.orders = await deleteByWorkspace('orders', workspace);
      results.clients = await deleteByWorkspace('clients', workspace);
    }

    if (group === 'all') {
      const clientIds = await getIdsByWorkspace('clients', workspace);
      const orderIds = await getIdsByWorkspace('orders', workspace);
      const productIds = await getIdsByWorkspace('products', workspace);

      results.visits = await deleteByWorkspace('visits', workspace);
      results.rep_commissions = await deleteByWorkspace('rep_commissions', workspace);
      results.commissions = await deleteByWorkspace('commissions', workspace);
      results.order_items_by_order = await deleteByIds('order_items', 'order_id', orderIds);
      results.order_items_by_product = await deleteByIds('order_items', 'product_id', productIds);
      results.orders = await deleteByWorkspace('orders', workspace);
      results.clients = await deleteByWorkspace('clients', workspace);
      results.products = await deleteByWorkspace('products', workspace);
      results.categories = await deleteByWorkspace('categories', workspace);
      results.referrals = await deleteByWorkspace('referrals', workspace);
    }

    await auditLog(
      `[LIMPEZA] Grupo "${group}" limpo`,
      { workspace, deleted: results },
      userId
    );

    return NextResponse.json({ ok: true, deleted: results });
  } catch (e: any) {
    console.error('[cleanup POST]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
