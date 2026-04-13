import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await getAdmin().from('clients').select('*').eq('id', params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ client: data });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    // Recalcula maps_link se lat/lng mudou
    if ((body.lat || body.lng) && !body.maps_link) {
      body.maps_link = `https://www.google.com/maps?q=${body.lat},${body.lng}`;
    }

    const { data, error } = await getAdmin()
      .from('clients')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ client: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  // FIX #5: soft delete — preserva histórico de pedidos, visitas e comissões vinculados
  const { error } = await getAdmin()
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
