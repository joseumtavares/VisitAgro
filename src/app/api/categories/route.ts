import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const workspace = req.headers.get('x-workspace') || 'principal';

  const { data, error } = await getAdmin()
    .from('categories')
    .select('id,workspace,name,description,active,created_at,updated_at')
    .eq('workspace', workspace)
    .eq('active', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const workspace = req.headers.get('x-workspace') || 'principal';

  if (!body.name) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data, error } = await getAdmin()
    .from('categories')
    .insert([{
      id: crypto.randomUUID(),
      workspace,
      name: body.name,
      description: body.description ?? null,
      active: true,
      created_at: now,
      updated_at: now,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const workspace = req.headers.get('x-workspace') || 'principal';

  if (!body.id || !body.name) {
    return NextResponse.json({ error: 'ID e nome obrigatórios' }, { status: 400 });
  }

  const { data, error } = await getAdmin()
    .from('categories')
    .update({
      name: body.name,
      description: body.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .eq('workspace', workspace)
    .eq('active', true)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}

export async function DELETE(req: NextRequest) {
  const workspace = req.headers.get('x-workspace') || 'principal';
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }

  const { error } = await getAdmin()
    .from('categories')
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('workspace', workspace)
    .eq('active', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
