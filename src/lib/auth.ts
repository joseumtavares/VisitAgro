// src/lib/auth.ts
import jwt  from 'jsonwebtoken';
import crypto from 'crypto';

// bcryptjs é opcional — funciona sem ele se o hash for pbkdf2
let bcrypt: any = null;
try { bcrypt = require('bcryptjs'); } catch { /* não instalado ainda */ }

const SECRET     = process.env.JWT_SECRET || 'fallback-TROQUE-EM-PRODUCAO-min-32-chars!!';
const EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '28800', 10);

// ── Hash ──────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  if (bcrypt) return bcrypt.hash(password, 12);
  // Fallback PBKDF2 (sem bcryptjs instalado)
  const salt = crypto.randomBytes(16).toString('hex');
  const dk   = await pbkdf2Async(password, salt, 100000, 64, 'sha512');
  return `pbkdf2:sha512:100000:${salt}:${dk.toString('hex')}`;
}

// ── Verificação — suporta bcrypt E pbkdf2 ────────────────────

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  if (!password || !stored) return false;

  try {
    // Formato PBKDF2: "pbkdf2:sha512:100000:<salt>:<hex>"
    if (stored.startsWith('pbkdf2:')) {
      const parts = stored.split(':');
      // partes: ['pbkdf2', 'sha512', '100000', salt, hash]
      if (parts.length !== 5) return false;
      const [, digest, iters, salt, expected] = parts;
      const dk = await pbkdf2Async(password, salt, parseInt(iters, 10), 64, digest);
      return crypto.timingSafeEqual(Buffer.from(dk.toString('hex')), Buffer.from(expected));
    }

    // Formato bcrypt: "$2a$..." ou "$2b$..."
    if (stored.startsWith('$2')) {
      if (bcrypt) return bcrypt.compare(password, stored);
      console.error('[auth] Hash bcrypt encontrado mas bcryptjs não está instalado. Rode npm install.');
      return false;
    }

    console.error('[auth] Formato de hash desconhecido:', stored.substring(0, 10));
    return false;
  } catch (err) {
    console.error('[auth] Erro ao verificar senha:', err);
    return false;
  }
}

// ── JWT ───────────────────────────────────────────────────────

export function generateToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try { return jwt.verify(token, SECRET) as Record<string, unknown>; }
  catch { return null; }
}

// ── Utilitário ────────────────────────────────────────────────

function pbkdf2Async(
  password: string, salt: string,
  iterations: number, keylen: number, digest: string
): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, dk) =>
      err ? reject(err) : resolve(dk)
    )
  );
}
