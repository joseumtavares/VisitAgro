import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data, error } = await getAdmin()
      .from('clients')
      // FIX #10: campos explícitos — exclui document_*_path e residence_proof_path
      .select(
        'id,workspace,name,document,tel,tel2,email,status,category,' +
        'address,city,state,zip_code,lat,lng,maps_link,obs,' +
        'indicado,user_id,created_at,updated_at'
      )
      // FIX #5: soft delete — ocultar clientes com deleted_at preenchido
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
    const id = crypto.randomUUID();

    // Gera maps_link automaticamente se tiver lat/lng
    let maps_link = body.maps_link || null;
    if (!maps_link && body.lat && body.lng) {
      maps_link = `https://www.google.com/maps?q=${body.lat},${body.lng}`;
    }

    // FIX #6: campos explícitos — evita injeção de campos arbitrários via body spread
    const { data, error } = await getAdmin()
      .from('clients')
      .insert([{
        id,
        workspace:  'principal',
        name:       body.name.trim(),
        document:   body.document   ?? null,
        tel:        body.tel        ?? null,
        tel2:       body.tel2       ?? null,
        email:      body.email      ?? null,
        status:     body.status     ?? 'interessado',
        category:   body.category   ?? 'geral',
        address:    body.address    ?? null,
        city:       body.city       ?? null,
        state:      body.state      ?? null,
        zip_code:   body.zip_code   ?? null,
        lat:        body.lat        ?? null,
        lng:        body.lng        ?? null,
        maps_link,
        obs:        body.obs        ?? null,
        indicado:   body.indicado   ?? null,
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
