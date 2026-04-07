/**
 * lib/auth.js — Geração e verificação de JWT HS256
 * Usa a biblioteca `jose` compatível com Edge Runtime.
 */
import { SignJWT, jwtVerify } from 'jose';

const SECRET   = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_dev_secret_change_in_prod'
);
const EXPIRES  = parseInt(process.env.JWT_EXPIRES_IN || '28800', 10); // segundos

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
    .setIssuer('visitapro')
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
    issuer: 'visitapro',
  });
  return payload;
}
