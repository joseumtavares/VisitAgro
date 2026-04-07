import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_dev_secret_change_in_prod'
);

// Rotas que não requerem autenticação
const publicRoutes = ['/login', '/api/auth/login'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Verifica se é rota pública
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verifica se é rota de API
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Obtém token dos cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Redireciona para login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verifica token JWT
    await jwtVerify(token, SECRET, { issuer: 'agrovisita-pro' });
    return NextResponse.next();
  } catch (e) {
    // Token inválido - limpa cookie e redireciona
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
