import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { workspace } = getRequestContext(req);

  const { data, error } = await getAdmin()
    .from('pre_registrations')
    .select('*')
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ pre_registration: data });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { workspace, userId } = getRequestContext(req);

    if (!body?.name?.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    }

    let maps_link = body.maps_link || null;
    if (!maps_link && body.lat && body.lng) {
      maps_link = `https://www.google.com/maps?q=${body.lat},${body.lng}`;
    }

    const { id: _id, workspace: _ws, created_at: _ca, deleted_at: _da, ...rest } = body;

    const payload = {
      ...rest,
      maps_link,
      lat: body.lat ? Number(body.lat) : null,
      lng: body.lng ? Number(body.lng) : null,
      referral_id: body.referral_id || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await getAdmin()
      .from('pre_registrations')
      .update(payload)
      .eq('id', params.id)
      .eq('workspace', workspace)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;

    await auditLog('[PRÉ-CADASTRO] Atualizado', { id: params.id, workspace }, userId);

    return NextResponse.json({ pre_registration: data });
  } catch (e: any) {
    console.error('[pre-registrations PUT]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { workspace, userId } = getRequestContext(req);

  const { error } = await getAdmin()
    .from('pre_registrations')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog('[PRÉ-CADASTRO] Removido', { id: params.id, workspace }, userId);

  return NextResponse.json({ ok: true });
}
