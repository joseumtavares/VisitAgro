import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const workspace = req.headers.get('x-workspace') || 'principal';

    const { data, error } = await getAdmin()
      .from('clients')
      .select('*')
      .eq('workspace', workspace)
      .is('deleted_at', null)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ clients: data ?? [] });
  } catch (e: any) {
    console.error('[clients GET]', e.message);
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspace = req.headers.get('x-workspace') || 'principal';

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    let maps_link = body.maps_link || null;
    if (!maps_link && body.lat && body.lng) {
      maps_link = `https://www.google.com/maps?q=${body.lat},${body.lng}`;
    }

    const payload = {
      ...body,
      id,
      workspace,
      maps_link,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await getAdmin()
      .from('clients')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ client: data }, { status: 201 });
  } catch (e: any) {
    console.error('[clients POST]', e.message);
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}
