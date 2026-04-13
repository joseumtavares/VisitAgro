import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const workspace = req.headers.get('x-workspace') || 'principal';

    const { data, error } = await getAdmin()
      .from('products')
      .select(
        'id,workspace,category_id,name,description,sku,finame_code,ncm_code,unit_price,cost_price,stock_qty,unit,rep_commission_pct,active,model,color,deleted_at,created_at,updated_at'
      )
      .eq('workspace', workspace)
      .is('deleted_at', null)
      .order('name');

    if (error) {
      throw error;
    }

    return NextResponse.json({ products: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspace = req.headers.get('x-workspace') || 'principal';
    const userId = req.headers.get('x-user-id') || undefined;

    if (!body?.name) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const payload = {
      id: crypto.randomUUID(),
      workspace,
      category_id: body.category_id || null,
      name: body.name,
      description: body.description || null,
      sku: body.sku || null,
      finame_code: body.finame_code || '',
      ncm_code: body.ncm_code || '',
      unit_price: Number(body.unit_price ?? 0),
      cost_price: Number(body.cost_price ?? 0),
      stock_qty: Number(body.stock_qty ?? 0),
      unit: body.unit || 'UN',
      rep_commission_pct: Number(body.rep_commission_pct ?? 0),
      active: body.active ?? true,
      model: body.model || null,
      color: body.color || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await getAdmin()
      .from('products')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    await auditLog(
      '[CADASTRO] Produto criado',
      { product_id: data.id, workspace },
      userId
    );

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
