import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const admin = getAdmin();
    const workspace = req.headers.get('x-workspace') || 'principal';

    const { data: setting, error } = await admin
      .from('settings')
      .select('*,companies(*)')
      .eq('workspace', workspace)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      settings: setting ?? {},
      company: (setting as any)?.companies ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
