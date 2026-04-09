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
      .limit(50);
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

    if (!body.client_id) return NextResponse.json({ error: 'client_id obrigatório' }, { status: 400 });

    // Se for checkin, marca visit_date como agora e status realizado
    const isCheckin = body.checkin === true;
    const now = new Date().toISOString();

    const payload = {
      id: crypto.randomUUID(),
      workspace: 'principal',
      client_id: body.client_id,
      user_id: userId || null,
      activity_type: body.activity_type ?? 'Visita',
      scheduled_date: body.scheduled_date ?? (isCheckin ? now : null),
      visit_date: isCheckin ? now : (body.visit_date ?? null),
      status: isCheckin ? 'realizado' : (body.status ?? 'agendado'),
      obs: body.obs ?? null,
      lat: body.lat ?? 0,
      lng: body.lng ?? 0,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await getAdmin().from('visits').insert([payload]).select().single();
    if (error) throw error;

    // Se checkin, atualiza status do cliente
    if (isCheckin && body.client_status) {
      await getAdmin().from('clients')
        .update({ status: body.client_status, updated_at: now })
        .eq('id', body.client_id);
    }

    await auditLog(isCheckin ? '[CHECKIN] Visita registrada' : '[VISITA] Agendamento criado', {
      client_id: body.client_id,
      visit_id: data.id,
    }, userId);

    return NextResponse.json({ visit: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
