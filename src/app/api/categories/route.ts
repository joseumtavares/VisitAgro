import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { data, error } = await getAdmin().from('categories').select('id,name,description,active').eq('active', true).order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
  const { data, error } = await getAdmin().from('categories')
    .insert([{ id: crypto.randomUUID(), name: body.name, description: body.description ?? null, workspace: 'principal' }])
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data }, { status: 201 });
}
