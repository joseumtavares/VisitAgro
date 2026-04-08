// src/lib/auth.ts
import jwt    from 'jsonwebtoken';
import crypto from 'crypto';

// bcryptjs é carregado dinamicamente se disponível (após npm install)
let _bcrypt: any = null;
try { _bcrypt = require('bcryptjs'); } catch { /* não instalado — usa sha256 */ }

const SECRET     = process.env.JWT_SECRET || 'fallback-TROQUE-EM-PRODUCAO-min-32-chars!!';
const EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '28800', 10);

// ── Verificação de senha — suporta bcrypt E sha256 ────────────
//
// Formatos aceitos pelo banco (coluna hash_algo):
//   'bcrypt' → hash começa com $2a$ ou $2b$  (bcryptjs)
//   'sha256' → hash formato "sha256:<salt_hex>:<pbkdf2_hex>"

export async function verifyPassword(
  plaintext: string,
  stored: string
): Promise<boolean> {
  if (!plaintext || !stored) return false;

  try {
    // ── Formato sha256 (gerado pelo script standalone) ───────
    if (stored.startsWith('sha256:')) {
      const parts = stored.split(':');
      if (parts.length !== 3) return false;
      const [, saltHex, expected] = parts;
      const saltBytes = Buffer.from(saltHex, 'hex');
      const dk = await pbkdf2(plaintext, saltBytes, 100000, 32, 'sha256');
      // timingSafeEqual evita timing attacks
      const a = Buffer.from(dk.toString('hex'));
      const b = Buffer.from(expected);
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    }

    // ── Formato bcrypt ($2a$ / $2b$) ─────────────────────────
    if (stored.startsWith('$2')) {
      if (_bcrypt) return _bcrypt.compare(plaintext, stored);
      console.error('[auth] Hash bcrypt no banco mas bcryptjs não instalado. Execute npm install na raiz do projeto.');
      return false;
    }

    console.error('[auth] Formato de hash desconhecido:', stored.slice(0, 15));
    return false;
  } catch (err) {
    console.error('[auth] Erro ao verificar senha:', err);
    return false;
  }
}

// ── Geração de hash (para novos usuários via API) ─────────────

export async function hashPassword(password: string): Promise<{ hash: string; algo: 'bcrypt' | 'sha256' }> {
  if (_bcrypt) {
    return { hash: await _bcrypt.hash(password, 12), algo: 'bcrypt' };
  }
  // Fallback sem bcryptjs
  const saltBytes = crypto.randomBytes(16);
  const dk = await pbkdf2(password, saltBytes, 100000, 32, 'sha256');
  return {
    hash: `sha256:${saltBytes.toString('hex')}:${dk.toString('hex')}`,
    algo: 'sha256',
  };
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

function pbkdf2(
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
