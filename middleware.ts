// middleware.ts — Protege todas as rotas /api/* com JWT
// Executa no Edge Runtime (sem Node.js full) — usa Web Crypto API nativa
// Rotas públicas: /api/auth/login, /api/health
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/health',
];

// Decodifica base64url para Uint8Array (compatível com Edge Runtime)
function base64urlToBytes(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const binary  = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Só protege rotas de API
  if (!pathname.startsWith('/api/')) return NextResponse.next();

  // Rotas públicas passam direto
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Extrai Bearer token
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return NextResponse.json(
      { error: 'Não autenticado. Faça login primeiro.' },
      { status: 401 }
    );
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return NextResponse.json({ error: 'Token malformado.' }, { status: 401 });
  }

  // ── 1. Verifica assinatura HMAC-SHA256 via Web Crypto API ─────────────────
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[middleware] JWT_SECRET não configurado');
    return NextResponse.json({ error: 'Configuração interna inválida.' }, { status: 500 });
  }

  try {
    const encoder   = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signingInput = encoder.encode(`${parts[0]}.${parts[1]}`);
    const signature    = base64urlToBytes(parts[2]);

    const valid = await crypto.subtle.verify(
    'HMAC',
    cryptoKey,
    signature.buffer as ArrayBuffer,   // ← cast para ArrayBuffer puro
    signingInput.buffer as ArrayBuffer  // ← idem
);

    if (!valid) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
  }

  // ── 2. Verifica expiração ─────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return NextResponse.json({ error: 'Token malformado.' }, { status: 401 });
  }

  if (payload.exp && typeof payload.exp === 'number' && Date.now() / 1000 > payload.exp) {
    return NextResponse.json(
      { error: 'Sessão expirada. Faça login novamente.' },
      { status: 401 }
    );
  }

  // ── 3. Injeta contexto do usuário nos headers para os route handlers ───────
  const response = NextResponse.next();
  response.headers.set('x-user-id',   String(payload.id   ?? payload.userId ?? payload.sub ?? ''));
  response.headers.set('x-user-name', String(payload.username ?? ''));
  response.headers.set('x-user-role', String(payload.role ?? 'user'));
  response.headers.set('x-workspace', String(payload.workspace ?? 'principal'));
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
