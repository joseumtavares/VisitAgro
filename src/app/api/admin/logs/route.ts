import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

export async function GET(req: NextRequest) {
  const { role } = getRequestContext(req);

  if (role !== 'admin') {
    return NextResponse.json(
      { error: 'Acesso restrito a administradores.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const rawLimit = Number(searchParams.get('limit') || 200);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 500)
    : 200;

  const { data, error } = await getAdmin()
    .from('audit_log')
    .select('id,action,user_id,username,ip,user_agent,meta,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}
