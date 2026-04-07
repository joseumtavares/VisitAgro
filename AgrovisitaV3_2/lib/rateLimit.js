/**
 * lib/rateLimit.js — Rate limiting via tabela Supabase
 *
 * Por que tabela em vez de Redis?
 * Serverless functions na Vercel são stateless e podem rodar em
 * múltiplas instâncias simultâneas. O Redis (ex: Upstash) seria
 * ideal, mas requer setup extra. Usar o próprio Supabase como
 * storage de rate limit funciona sem infraestrutura adicional
 * e é suficiente para o volume deste sistema.
 *
 * Estratégia: janela deslizante simplificada (sliding window lite)
 * — conta requisições dos últimos N segundos por chave (IP/user).
 */
import { supabase } from './supabase.js';

const TABLE = 'visitapro_rate_limits';

/**
 * Verifica e registra uma tentativa de acesso.
 *
 * @param {string}  key       - Chave única: 'ip:1.2.3.4' ou 'user:admin'
 * @param {number}  limit     - Máximo de requisições na janela
 * @param {number}  windowSec - Tamanho da janela em segundos
 * @returns {Promise<{ allowed: boolean, remaining: number, resetAt: Date }>}
 */
export async function rateLimit(key, limit = 10, windowSec = 60) {
  const now    = new Date();
  const since  = new Date(now.getTime() - windowSec * 1000);

  try {
    // 1. Limpa entradas antigas (fire-and-forget — não bloqueia resposta)
    supabase
      .from(TABLE)
      .delete()
      .lt('created_at', since.toISOString())
      .then(() => {});

    // 2. Conta tentativas na janela atual
    const { count, error: countErr } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', since.toISOString());

    if (countErr) {
      // Falha silenciosa — não bloqueia o usuário se o DB falhar
      console.error('[rateLimit] count error:', countErr.message);
      return { allowed: true, remaining: limit, resetAt: new Date(now.getTime() + windowSec * 1000) };
    }

    const current = count || 0;

    if (current >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(since.getTime() + windowSec * 1000),
      };
    }

    // 3. Registra esta tentativa
    await supabase.from(TABLE).insert({ key, created_at: now.toISOString() });

    return {
      allowed: true,
      remaining: limit - current - 1,
      resetAt: new Date(now.getTime() + windowSec * 1000),
    };
  } catch (err) {
    console.error('[rateLimit] unexpected error:', err);
    // Fail open — não bloqueia em caso de erro de infraestrutura
    return { allowed: true, remaining: limit, resetAt: now };
  }
}

/**
 * Rate limit duplo: por IP e por usuário.
 * Ambos devem passar para a requisição ser permitida.
 */
export async function rateLimitDouble(ip, user, { ipLimit = 20, ipWindow = 60, userLimit = 10, userWindow = 60 } = {}) {
  const [byIp, byUser] = await Promise.all([
    rateLimit(`ip:${ip}`,    ipLimit,   ipWindow),
    rateLimit(`user:${user}`, userLimit, userWindow),
  ]);

  return {
    allowed: byIp.allowed && byUser.allowed,
    byIp,
    byUser,
  };
}
