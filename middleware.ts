// middleware.ts — Protege todas as rotas /api/* com JWT
// Rotas públicas: /api/auth/login, /api/health
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/health',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Só protege rotas de API
  if (!pathname.startsWith('/api/')) return NextResponse.next();

  // Rotas públicas passam direto
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Verifica header Authorization
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return NextResponse.json(
      { error: 'Não autenticado. Faça login primeiro.' },
      { status: 401 }
    );
  }

  // Verificação JWT leve no Edge (sem bcrypt — só decode do payload)
  try {
    const parts  = token.split('.');
    if (parts.length !== 3) throw new Error('Token malformado');

    // Decode do payload (base64url → JSON)
    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload    = JSON.parse(atob(payloadB64));

    // Verificação de expiração
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return NextResponse.json(
        { error: 'Sessão expirada. Faça login novamente.' },
        { status: 401 }
      );
    }

    // Injeta dados do usuário nos headers para os handlers
    const response = NextResponse.next();
    response.headers.set('x-user-id',    payload.userId || payload.sub || '');
    response.headers.set('x-user-name',  payload.username || '');
    response.headers.set('x-user-role',  payload.role || 'user');
    response.headers.set('x-workspace',  payload.workspace || 'principal');
    return response;

  } catch {
    return NextResponse.json(
      { error: 'Token inválido.' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
