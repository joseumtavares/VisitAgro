import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { workspace } = getRequestContext(req);
  const { data, error } = await getAdmin()
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .eq('workspace', workspace)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ client: data });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspace } = getRequestContext(req);
    const body = await req.json();

    if ((body.lat || body.lng) && !body.maps_link) {
      body.maps_link = `https://www.google.com/maps?q=${body.lat},${body.lng}`;
    }

    const { data, error } = await getAdmin()
      .from('clients')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('workspace', workspace)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ client: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { workspace } = getRequestContext(req);
  const { error } = await getAdmin()
    .from('clients')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('workspace', workspace);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
