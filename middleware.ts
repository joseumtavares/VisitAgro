import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/api/auth/login', '/api/health'];

function base64urlToBytes(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

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

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[middleware] JWT_SECRET não configurado');
    return NextResponse.json({ error: 'Configuração interna inválida.' }, { status: 500 });
  }

  try {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signingInput = encoder.encode(`${parts[0]}.${parts[1]}`);
    const signature = base64urlToBytes(parts[2]);

    const valid = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signature.buffer as ArrayBuffer,
      signingInput.buffer as ArrayBuffer
    );

    if (!valid) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
  }

  let payload: Record<string, any>;
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', String(payload.id ?? payload.userId ?? payload.sub ?? ''));
  requestHeaders.set('x-user-name', String(payload.username ?? ''));
  requestHeaders.set('x-user-role', String(payload.role ?? 'user'));
  requestHeaders.set('x-workspace', String(payload.workspace ?? 'principal'));

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/api/:path*'],
};
