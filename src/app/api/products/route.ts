import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data, error } = await getAdmin()
      .from('products')
      .select('id, name, description, unit_price, stock_qty, unit, active, category_id')
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
    const { data, error } = await getAdmin()
      .from('products')
      .insert([{ ...body, id: crypto.randomUUID() }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
