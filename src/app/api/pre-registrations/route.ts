import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

export async function GET(req: NextRequest) {
  try {
    const { workspace } = getRequestContext(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source');

    let q = getAdmin()
      .from('pre_registrations')
      .select(
        'id,workspace,name,tel,email,interest,source,status,obs,converted_client_id,referral_id,maps_link,lat,lng,point_reference,deleted_at,created_at,updated_at'
      )
      .eq('workspace', workspace)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (status) q = q.eq('status', status);
    if (source) q = q.eq('source', source);

    const { data, error } = await q;

    if (error) throw error;

    return NextResponse.json({ pre_registrations: data ?? [] });
  } catch (e: any) {
    console.error('[pre-registrations GET]', e.message);
    return NextResponse.json({ error: 'Erro ao buscar pré-cadastros' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspace } = getRequestContext(req);

    if (!body?.name?.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    }

    const now = new Date().toISOString();

    let maps_link = body.maps_link || null;
    if (!maps_link && body.lat && body.lng) {
      maps_link = `https://www.google.com/maps?q=${body.lat},${body.lng}`;
    }

    const payload = {
      id: crypto.randomUUID(),
      workspace,
      name: body.name.trim(),
      tel: body.tel || null,
      email: body.email || null,
      interest: body.interest || null,
      source: body.source || 'manual',
      status: body.status || 'novo',
      obs: body.obs || null,
      referral_id: body.referral_id || null,
      maps_link,
      lat: body.lat ? Number(body.lat) : null,
      lng: body.lng ? Number(body.lng) : null,
      point_reference: body.point_reference || null,
      converted_client_id: null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await getAdmin()
      .from('pre_registrations')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ pre_registration: data }, { status: 201 });
  } catch (e: any) {
    console.error('[pre-registrations POST]', e.message);
    return NextResponse.json({ error: 'Erro ao criar pré-cadastro' }, { status: 500 });
  }
}
