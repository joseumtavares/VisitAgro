/**
 * POST /api/auth/logout
 * Requer JWT válido (middleware valida antes de chegar aqui).
 * Registra o logout no audit log.
 *
 * Nota: JWT é stateless — não há invalidação server-side.
 * O cliente deve descartar o token do sessionStorage.
 * Para invalidação real, implemente uma blacklist (tabela
 * ou Redis) — deixada como evolução futura.
 */
import { auditLogout } from '../../../lib/audit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const userId   = req.headers['x-user-id']   || null;
  const username = req.headers['x-user-name'] || null;
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0].trim();

  await auditLogout(userId, username, ip);

  return res.status(200).json({ ok: true, message: 'Logout registrado.' });
}
