import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_dev_secret_change_in_prod');

// Rotas públicas que não precisam de JWT
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/health',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Deixa passar rotas públicas e tudo que não é /api
  if (!pathname.startsWith('/api/') || PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Extrai JWT do header Authorization: Bearer <token>
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: 'Não autenticado.' },
      { status: 401 }
    );
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Injeta claims do JWT nos headers para os handlers lerem
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id',   payload.sub   || '');
    requestHeaders.set('x-user-name', payload.user  || '');
    requestHeaders.set('x-user-role', payload.role  || 'user');

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (err) {
    return NextResponse.json(
      { error: 'Token inválido ou expirado.' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: '/api/:path*',
};
