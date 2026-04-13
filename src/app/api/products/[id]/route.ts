import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const workspace = req.headers.get('x-workspace') || 'principal';

  const { data, error } = await getAdmin()
    .from('products')
    .select('*')
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ product: data });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const workspace = req.headers.get('x-workspace') || 'principal';
  const userId = req.headers.get('x-user-id') || undefined;
  const body = await req.json();

  const payload = {
    ...body,
    category_id: body.category_id || null,
    unit_price: Number(body.unit_price ?? 0),
    cost_price: Number(body.cost_price ?? 0),
    stock_qty: Number(body.stock_qty ?? 0),
    rep_commission_pct: Number(body.rep_commission_pct ?? 0),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await getAdmin()
    .from('products')
    .update(payload)
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog(
    '[CADASTRO] Produto atualizado',
    { product_id: params.id, workspace },
    userId
  );

  return NextResponse.json({ product: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const workspace = req.headers.get('x-workspace') || 'principal';
  const userId = req.headers.get('x-user-id') || undefined;

  const { error } = await getAdmin()
    .from('products')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active: false,
    })
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog(
    '[CADASTRO] Produto removido',
    { product_id: params.id, workspace },
    userId
  );

  return NextResponse.json({ ok: true });
}
