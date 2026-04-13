import { NextResponse } from 'next/server';

/** Rota pública — listada em `middleware.ts` como PUBLIC_PATHS. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
