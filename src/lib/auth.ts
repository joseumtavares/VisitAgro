// src/lib/auth.ts — autenticação JWT + bcrypt
// bcryptjs agora está no package.json como dependência formal
import bcrypt  from 'bcryptjs';
import jwt     from 'jsonwebtoken';
import crypto  from 'crypto';

const _secret = process.env.JWT_SECRET;
if (!_secret) throw new Error('[auth] JWT_SECRET não configurado. Defina a variável de ambiente.');
const SECRET     = _secret;
const EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '28800', 10);

// ── Verificação de senha — suporta bcrypt E sha256 ────────────
export async function verifyPassword(
  plaintext: string,
  stored: string
): Promise<boolean> {
  if (!plaintext || !stored) return false;
  try {
    // Formato sha256:salt:hash (gerado pelo script standalone)
    if (stored.startsWith('sha256:')) {
      const [, saltHex, expected] = stored.split(':');
      if (!saltHex || !expected) return false;
      const saltBytes = Buffer.from(saltHex, 'hex');
      const dk = await pbkdf2Async(plaintext, saltBytes, 100000, 32, 'sha256');
      const a  = Buffer.from(dk.toString('hex'));
      const b  = Buffer.from(expected);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    }
    // Formato bcrypt ($2a$ / $2b$)
    if (stored.startsWith('$2')) {
      return bcrypt.compare(plaintext, stored);
    }
    console.error('[auth] Formato de hash desconhecido:', stored.slice(0, 15));
    return false;
  } catch (err) {
    console.error('[auth] Erro ao verificar senha:', err);
    return false;
  }
}

// ── Hash de senha ──────────────────────────────────────────────
export async function hashPassword(
  password: string
): Promise<{ hash: string; algo: 'bcrypt' | 'sha256' }> {
  const hash = await bcrypt.hash(password, 12);
  return { hash, algo: 'bcrypt' };
}

// ── JWT ───────────────────────────────────────────────────────
export function generateToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    return jwt.verify(token, SECRET) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ── PBKDF2 promisificado ──────────────────────────────────────
function pbkdf2Async(
  password: string,
  salt: Buffer,
  iterations: number,
  keylen: number,
  digest: string
): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    crypto.pbkdf2(password, salt, iterations, keylen, digest,
      (err, dk) => err ? reject(err) : resolve(dk))
  );
}
