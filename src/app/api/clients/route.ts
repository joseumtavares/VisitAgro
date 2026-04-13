import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { workspace } = getRequestContext(req);
    const { data, error } = await getAdmin()
      .from('clients')
      .select(
        'id,workspace,name,document,tel,tel2,email,status,category,' +
        'address,city,state,zip_code,lat,lng,maps_link,obs,' +
        'indicado,user_id,created_at,updated_at'
      )
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
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    }
    const { workspace } = getRequestContext(req);
    const id = crypto.randomUUID();

    let maps_link = body.maps_link || null;
    if (!maps_link && body.lat && body.lng) {
      maps_link = `https://www.google.com/maps?q=${body.lat},${body.lng}`;
    }

    const { data, error } = await getAdmin()
      .from('clients')
      .insert([{
        id,
        workspace,
        name: body.name.trim(),
        document: body.document ?? null,
        tel: body.tel ?? null,
        tel2: body.tel2 ?? null,
        email: body.email ?? null,
        status: body.status ?? 'interessado',
        category: body.category ?? 'geral',
        address: body.address ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        zip_code: body.zip_code ?? null,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        maps_link,
        obs: body.obs ?? null,
        indicado: body.indicado ?? null,
      }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ client: data }, { status: 201 });
  } catch (e: any) {
    console.error('[clients POST]', e.message);
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}
