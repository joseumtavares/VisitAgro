// src/app/api/visits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');
  try {
    let q = getAdmin()
      .from('visits')
      .select('id,client_id,user_id,activity_type,scheduled_date,visit_date,status,obs,lat,lng,created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (clientId) q = q.eq('client_id', clientId);
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ visits: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = req.headers.get('x-user-id') || '';

    if (!body.client_id) {
      return NextResponse.json({ error: 'client_id obrigatório' }, { status: 400 });
    }

    const isCheckin = body.checkin === true;
    const now = new Date().toISOString();

    // Monta payload apenas com colunas que existem na tabela visits
    const payload: Record<string, any> = {
      id: crypto.randomUUID(),
      workspace: 'principal',
      client_id: body.client_id,
      user_id: userId || null,
      activity_type: body.activity_type ?? 'Visita',
      status: isCheckin ? 'realizado' : (body.status ?? 'agendado'),
      obs: body.obs ?? null,
      created_at: now,
    };

    // GPS: só inclui se tiver coordenadas reais (não zeros)
    if (body.lat && body.lng && body.lat !== 0 && body.lng !== 0) {
      payload.lat = body.lat;
      payload.lng = body.lng;
    }

    if (isCheckin) {
      payload.visit_date = now;
      payload.scheduled_date = now;
    } else {
      if (body.visit_date) payload.visit_date = body.visit_date;
      if (body.scheduled_date) payload.scheduled_date = body.scheduled_date;
    }

    const { data, error } = await getAdmin()
      .from('visits')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    // Atualiza status do cliente se checkin com novo status
    if (isCheckin && body.client_status) {
      await getAdmin()
        .from('clients')
        .update({ status: body.client_status, updated_at: now })
        .eq('id', body.client_id);
    }

    // Cria registro de agendamento futuro se solicitado
    if (body.next_visit_date) {
      const nextPayload: Record<string, any> = {
        id: crypto.randomUUID(),
        workspace: 'principal',
        client_id: body.client_id,
        user_id: userId || null,
        activity_type: body.next_activity_type ?? 'Visita',
        scheduled_date: body.next_visit_date,
        status: 'agendado',
        obs: body.next_obs ?? null,
        created_at: now,
      };
      await getAdmin().from('visits').insert([nextPayload]);
    }

    await auditLog(
      isCheckin ? '[CHECKIN] Visita registrada' : '[VISITA] Agendamento criado',
      { client_id: body.client_id, visit_id: data.id, activity_type: payload.activity_type },
      userId
    );

    return NextResponse.json({ visit: data }, { status: 201 });
  } catch (e: any) {
    console.error('[visits POST]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
