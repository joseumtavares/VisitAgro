import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';
import { getRequestContext } from '@/lib/requestContext';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { role } = getRequestContext(req);

  if (role !== 'admin') {
    return NextResponse.json(
      { error: 'Acesso restrito a administradores.' },
      { status: 403 }
    );
  }

  const { data, error } = await getAdmin()
    .from('audit_log')
    .select('id,action,user_id,username,ip,meta,created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}
