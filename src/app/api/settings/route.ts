// GET /api/settings — retorna config e dados da empresa
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const admin = getAdmin();
    const { data: setting } = await admin
      .from('settings').select('*,companies(*)').eq('workspace','principal').maybeSingle();
    return NextResponse.json({
      settings: setting ?? {},
      company:  (setting as any)?.companies ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
