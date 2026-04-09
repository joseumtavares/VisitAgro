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

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  // Soft delete
  const { error } = await getAdmin().from('categories')
    .update({ active: false }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (!body.id || !body.name) return NextResponse.json({ error: 'ID e nome obrigatórios' }, { status: 400 });
  const { data, error } = await getAdmin().from('categories')
    .update({ name: body.name, description: body.description ?? null })
    .eq('id', body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}
