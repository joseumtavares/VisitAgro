// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data, error } = await getAdmin()
      .from('products')
      .select('id, name, description, unit_price, cost_price, stock_qty, unit, active, category_id, sku, model, color, finame_code, ncm_code, rep_commission_pct, created_at')
      .eq('active', true)
      .order('name');
    if (error) throw error;
    return NextResponse.json({ products: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    }
    const { data, error } = await getAdmin()
      .from('products')
      .insert([{
        id: crypto.randomUUID(),
        name: body.name,
        description: body.description ?? null,
        unit_price: Number(body.unit_price) || 0,
        cost_price: Number(body.cost_price) || 0,
        stock_qty: Number(body.stock_qty) || 0,
        unit: body.unit ?? 'UN',
        sku: body.sku ?? null,
        model: body.model ?? null,
        color: body.color ?? null,
        finame_code: body.finame_code ?? '',
        ncm_code: body.ncm_code ?? '',
        rep_commission_pct: Number(body.rep_commission_pct) || 0,
        category_id: body.category_id ?? null,
        workspace: 'principal',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
