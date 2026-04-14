import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('[auth] JWT_SECRET não configurado. Defina a variável de ambiente.');
}

const SECRET = secret;
const EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '28800', 10);

export type AuthTokenPayload = {
  id: string;
  username: string;
  email?: string | null;
  role: string;
  workspace: string;
  iat?: number;
  exp?: number;
};

export async function verifyPassword(
  plaintext: string,
  stored: string
): Promise<boolean> {
  if (!plaintext || !stored) return false;

  try {
    if (stored.startsWith('sha256:')) {
      const [, saltHex, expected] = stored.split(':');
      if (!saltHex || !expected) return false;

      const saltBytes = Buffer.from(saltHex, 'hex');
      const dk = await pbkdf2Async(plaintext, saltBytes, 100000, 32, 'sha256');
      const a = Buffer.from(dk.toString('hex'));
      const b = Buffer.from(expected);

      return a.length === b.length && crypto.timingSafeEqual(a, b);
    }

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

export async function hashPassword(
  password: string
): Promise<{ hash: string; algo: 'bcrypt' | 'sha256' }> {
  const hash = await bcrypt.hash(password, 12);
  return { hash, algo: 'bcrypt' };
}

export function generateToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

function pbkdf2Async(
  password: string,
  salt: Buffer,
  iterations: number,
  keylen: number,
  digest: string
): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, dk) =>
      err ? reject(err) : resolve(dk)
    )
  );
}