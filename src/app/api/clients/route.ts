import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data, error } = await getAdmin()
      .from('clients')
      .select('*')
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
    const id = crypto.randomUUID();

    // Gera maps_link automaticamente se tiver lat/lng
    let maps_link = body.maps_link || null;
    if (!maps_link && body.lat && body.lng) {
      maps_link = `https://www.google.com/maps?q=${body.lat},${body.lng}`;
    }

    const { data, error } = await getAdmin()
      .from('clients')
      .insert([{ ...body, id, maps_link }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ client: data }, { status: 201 });
  } catch (e: any) {
    console.error('[clients POST]', e.message);
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}
