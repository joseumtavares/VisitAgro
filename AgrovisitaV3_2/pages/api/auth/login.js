/**
 * POST /api/auth/login
 *
 * Body: { username: string, password: string }
 *
 * Fluxo:
 *   1. Rate limit duplo: IP (20 req/min) + usuário (5 req/min)
 *   2. Chama RPC visitapro_verify_pass no Supabase (bcrypt no servidor)
 *   3. Em caso de sucesso: emite JWT HS256 + registra audit log
 *   4. Em caso de falha: registra audit log + retorna erro genérico
 *
 * A anon key é usada SOMENTE aqui (no servidor), para chamar a RPC.
 * O browser NUNCA a recebe.
 */
import { rateLimitDouble } from '../../../lib/rateLimit.js';
import { supabaseAnon, supabase } from '../../../lib/supabase.js';
import { signJwt } from '../../../lib/auth.js';
import { auditLoginOk, auditLoginFail } from '../../../lib/audit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  // ── Coleta IP real (Vercel injeta x-forwarded-for) ──────────────
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0].trim();
  const ua = req.headers['user-agent'] || '';

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  const user = username.toLowerCase().trim();

  // ── Rate limiting duplo ─────────────────────────────────────────
  const rl = await rateLimitDouble(ip, user, {
    ipLimit:    20, ipWindow:   60,   // 20 req/min por IP
    userLimit:  5,  userWindow: 60,   // 5 req/min por usuário
  });

  if (!rl.allowed) {
    await auditLoginFail(user, ip, ua, { reason: 'rate_limited' });
    // Header padrão RFC 6585
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      error: 'Muitas tentativas. Aguarde 1 minuto e tente novamente.',
    });
  }

  // ── Verificação de credenciais via Supabase RPC (bcrypt) ─────────
  let verified = false;
  let userRecord = null;

  try {
    // Chama a função SQL SECURITY DEFINER — senha verificada pelo pgcrypto no servidor
    const { data, error } = await supabaseAnon.rpc('visitapro_verify_pass', {
      p_username: user,
      p_password: password,
    });

    if (error) {
      console.error('[login] RPC error:', error.message);
      // Tenta fallback no service_role para admin local de bootstrap
      verified = await verifyAdminBootstrap(user, password);
    } else {
      verified = data === true;
    }
  } catch (err) {
    console.error('[login] unexpected error:', err);
    verified = false;
  }

  if (!verified) {
    await auditLoginFail(user, ip, ua, { reason: 'wrong_credentials' });
    // Delay artificial anti-timing para não revelar se o usuário existe
    await sleep(300 + Math.random() * 200);
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  // ── Busca dados completos do usuário ─────────────────────────────
  try {
    const { data: rows } = await supabase
      .from('visitapro_users')
      .select('id, username, role, active')
      .eq('username', user)
      .eq('active', true)
      .limit(1);

    userRecord = rows?.[0] || { id: 'local-admin', username: user, role: 'admin' };
  } catch (_) {
    userRecord = { id: 'local-admin', username: user, role: 'admin' };
  }

  // ── Emite JWT ─────────────────────────────────────────────────────
  const token = await signJwt(userRecord);

  await auditLoginOk(user, ip, ua, { userId: userRecord.id, role: userRecord.role });

  return res.status(200).json({
    token,
    user: {
      id:       userRecord.id,
      username: userRecord.username,
      role:     userRecord.role,
    },
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '28800', 10),
  });
}

/** Verifica admin de bootstrap (sem RPC — para primeira execução) */
async function verifyAdminBootstrap(user, password) {
  if (user !== 'admin') return false;
  // Verifica direto no banco com service_role (sem RPC)
  try {
    const { data } = await supabase
      .from('visitapro_users')
      .select('pass_hash, hash_algo, active')
      .eq('username', 'admin')
      .eq('active', true)
      .limit(1);

    if (!data?.length) return false;

    const row = data[0];
    if (row.hash_algo === 'bcrypt') {
      // Chama pgcrypto diretamente
      const { data: ok } = await supabase.rpc('visitapro_verify_pass', {
        p_username: 'admin', p_password: password,
      });
      return ok === true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
