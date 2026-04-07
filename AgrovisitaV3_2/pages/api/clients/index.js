/**
 * GET  /api/clients        — Lista clientes do usuário autenticado
 * POST /api/clients        — Cria ou atualiza um único cliente (upsert)
 *
 * Proteção: JWT obrigatório (middleware.js valida na Edge)
 * Admin vê todos; user comum vê apenas os próprios.
 */
import { supabase } from '../../../lib/supabase.js';
import { auditSync } from '../../../lib/audit.js';

export default async function handler(req, res) {
  const userId   = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  const username = req.headers['x-user-name'];

  // ── GET — lista clientes ──────────────────────────────────────────
  if (req.method === 'GET') {
    let query = supabase
      .from('visitapro_clients')
      .select('*')
      .order('updated_at', { ascending: false });

    // Usuário comum: filtra apenas os seus
    if (userRole !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[clients GET]', error.message);
      return res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }

    return res.status(200).json({ clients: data || [] });
  }

  // ── POST — upsert único cliente ───────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body;

    if (!body || !body.id || !body.nome) {
      return res.status(400).json({ error: 'Campos obrigatórios: id, nome.' });
    }

    const row = sanitizeClient(body, userId);

    const { data, error } = await supabase
      .from('visitapro_clients')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[clients POST]', error.message);
      return res.status(500).json({ error: 'Erro ao salvar cliente.' });
    }

    await auditSync(userId, username, 'up', 1);

    return res.status(200).json({ client: data });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}

/** Sanitiza e normaliza os campos do cliente */
function sanitizeClient(body, userId) {
  return {
    id:         String(body.id),
    nome:       String(body.nome).trim().substring(0, 200),
    tel:        body.tel        ? String(body.tel).trim().substring(0, 30)  : null,
    estudas:    body.estudas    ? String(body.estudas).trim().substring(0, 20) : null,
    status:     VALID_STATUS.includes(body.status) ? body.status : 'interessado',
    endereco:   body.endereco   ? String(body.endereco).trim().substring(0, 500) : null,
    indicado:   body.indicado   ? String(body.indicado).trim().substring(0, 200) : null,
    obs:        body.obs        ? String(body.obs).trim().substring(0, 2000)    : null,
    maps_link:  body.mapsLink   ? String(body.mapsLink).trim().substring(0, 2000) : null,
    lat:        isFinite(body.lat) ? Number(body.lat) : null,
    lng:        isFinite(body.lng) ? Number(body.lng) : null,
    updated_at: body.updatedAt  || new Date().toISOString(),
    user_id:    userId,
  };
}

const VALID_STATUS = [
  'interessado', 'visitado', 'agendado',
  'comprou', 'naointeressado', 'retornar', 'outro',
];
