/**
 * GET /api/health — Status do backend (rota pública)
 * Útil para monitoramento e para o frontend saber se o
 * backend está disponível antes de tentar login.
 */
import { supabase } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  // Testa conectividade com o Supabase (query leve)
  let dbOk = false;
  let dbLatencyMs = null;
  try {
    const t0 = Date.now();
    const { error } = await supabase
      .from('visitapro_clients')
      .select('id', { count: 'exact', head: true });
    dbLatencyMs = Date.now() - t0;
    dbOk = !error;
  } catch (_) {
    dbOk = false;
  }

  const status = dbOk ? 200 : 503;

  return res.status(status).json({
    ok:        dbOk,
    version:   '3.2.0',
    timestamp: new Date().toISOString(),
    db: {
      connected:  dbOk,
      latency_ms: dbLatencyMs,
    },
    env: {
      supabase_url_set:      !!process.env.SUPABASE_URL,
      service_key_set:       !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwt_secret_set:        !!process.env.JWT_SECRET,
    },
  });
}
