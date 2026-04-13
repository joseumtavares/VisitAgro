// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data, error } = await getAdmin()
      .from('products')
      .select(
        'id,workspace,category_id,name,description,sku,model,color,' +
        'finame_code,ncm_code,unit_price,cost_price,stock_qty,unit,' +
        'rep_commission_pct,active,created_at,updated_at'
      )
      .eq('active', true)
      .order('name');
    if (error) throw error;
    return NextResponse.json({ products: data ?? [] });
  } catch (e: any) {
    console.error('[products GET]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    }

    const userId = req.headers.get('x-user-id') || null;

    const { data, error } = await getAdmin()
      .from('products')
      .insert([{
        ...body,
        id: crypto.randomUUID(),
        workspace: 'principal',
        active: true,
      }])
      .select()
      .single();

    if (error) throw error;

    await auditLog(
      '[CADASTRO] Produto criado',
      { name: body.name, id: data.id },
      userId ?? undefined
    );

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (e: any) {
    console.error('[products POST]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
