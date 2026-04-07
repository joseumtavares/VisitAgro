/**
 * lib/auth.js — Geração e verificação de JWT HS256
 * Usa a biblioteca `jose` compatível com Edge Runtime.
 */
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_dev_secret_change_in_prod'
);
const EXPIRES = parseInt(process.env.JWT_EXPIRES_IN || '28800', 10); // 8 horas

/**
 * Gera um JWT com claims do usuário.
 * @param {{ id: string, username: string, role: string }} user
 * @returns {Promise<string>} token JWT
 */
export async function signJwt(user) {
  return new SignJWT({
    user: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES}s`)
    .setIssuer('agrovisita-pro')
    .sign(SECRET);
}

/**
 * Verifica e decodifica um JWT.
 * @param {string} token
 * @returns {Promise<import('jose').JWTPayload>} payload decodificado
 * @throws {Error} se o token for inválido ou expirado
 */
export async function verifyJwt(token) {
  const { payload } = await jwtVerify(token, SECRET, {
    issuer: 'agrovisita-pro',
  });
  return payload;
}

/**
 * Extrai token JWT dos cookies ou headers
 */
export function getTokenFromRequest(req) {
  // Next.js App Router (Request nativo)
  if (req.headers && typeof req.headers.get === 'function') {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    // Cookies
    const cookie = req.headers.get('cookie');
    if (cookie) {
      const match = cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
      if (match) return match[1];
    }
  }
  // Pages Router (NextRequest ou req.cookies)
  if (req.cookies) {
    return req.cookies.auth_token?.value || req.cookies.get('auth_token')?.value;
  }
  return null;
}

/**
 * Middleware para proteger rotas API
 */
export async function requireAuth(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    const err = new Error('Não autorizado');
    err.status = 401;
    throw err;
  }
  
  try {
    const payload = await verifyJwt(token);
    return payload;
  } catch (e) {
    const err = new Error('Token inválido ou expirado');
    err.status = 401;
    throw err;
  }
}
