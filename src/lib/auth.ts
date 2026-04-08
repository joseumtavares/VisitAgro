// src/lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '28800'; // 8h em segundos

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET não configurado. Defina a variável de ambiente.');
}

const SECRET = JWT_SECRET || 'fallback-secret-TROQUE-EM-PRODUCAO-use-32-chars-min';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (!password || !hashedPassword) return false;
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (err) {
    console.error('[auth] Erro ao verificar senha:', err);
    return false;
  }
}

export function generateToken(payload: Record<string, unknown>): string {
  // BUG CORRIGIDO: jwt.sign expiresIn aceita número (segundos) ou string como '8h'
  // Antes: parseInt(JWT_EXPIRES_IN) + 's' → '3600s' (string inválida para jwt)
  // Agora: parseInt(JWT_EXPIRES_IN) → 3600 (número correto)
  const expiresIn = parseInt(JWT_EXPIRES_IN, 10) || 28800;
  return jwt.sign(payload, SECRET, { expiresIn });
}

export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    return jwt.verify(token, SECRET) as Record<string, unknown>;
  } catch {
    return null;
  }
}
