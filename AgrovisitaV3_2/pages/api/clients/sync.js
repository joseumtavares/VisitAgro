/**
 * POST /api/clients/sync
 *
 * Sincronização completa bidirecional com reconciliação de órfãos.
 *
 * Body: {
 *   clients: Client[],           // todos os clientes locais
 *   lastSyncAt?: string (ISO),   // timestamp da última sync
 *   deleteOrphans?: boolean      // remove do servidor IDs não enviados (default: false)
 * }
 *
 * Retorna: {
 *   upserted: number,            // registros enviados ao servidor
 *   received: Client[],          // registros novos/atualizados vindo do servidor
 *   deleted:  number,            // órfãos removidos (se deleteOrphans=true)
 * }
 */
import { supabase } from '../../../lib/supabase.js';
import { auditSync } from '../../../lib/audit.js';

const VALID_STATUS = ['interessado','visitado','agendado','comprou','naointeressado','retornar','outro'];
const BATCH_SIZE   = 100; // Supabase aceita até 500, usamos 100 para segurança

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const userId   = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  const username = req.headers['x-user-name'];

  const { clients = [], lastSyncAt, deleteOrphans = false } = req.body || {};

  if (!Array.isArray(clients)) {
    return res.status(400).json({ error: 'Campo clients deve ser um array.' });
  }

  // ── 1. Upsert em lotes ───────────────────────────────────────────
  let upsertedCount = 0;
  const rows = clients.map(c => sanitizeClient(c, userId));

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('visitapro_clients')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error('[sync upsert batch]', error.message);
      return res.status(500).json({ error: 'Erro ao sincronizar dados.' });
    }
    upsertedCount += batch.length;
  }

  // ── 2. Busca registros atualizados desde lastSyncAt ──────────────
  let query = supabase
    .from('visitapro_clients')
    .select('*')
    .order('updated_at', { ascending: false });

  if (userRole !== 'admin') {
    query = query.eq('user_id', userId);
  }

  if (lastSyncAt) {
    query = query.gt('updated_at', lastSyncAt);
  }

  const { data: received, error: recErr } = await query;

  if (recErr) {
    console.error('[sync receive]', recErr.message);
    return res.status(500).json({ error: 'Erro ao buscar atualizações.' });
  }

  // ── 3. Reconciliação de órfãos (opcional e apenas para admin) ────
  let deletedCount = 0;
  if (deleteOrphans && userRole === 'admin' && clients.length > 0) {
    const sentIds = new Set(clients.map(c => c.id));

    // Busca IDs que existem no servidor mas não foram enviados
    const { data: allIds } = await supabase
      .from('visitapro_clients')
      .select('id');

    const orphanIds = (allIds || [])
      .map(r => r.id)
      .filter(id => !sentIds.has(id));

    if (orphanIds.length > 0) {
      const { error: delErr } = await supabase
        .from('visitapro_clients')
        .delete()
        .in('id', orphanIds);

      if (!delErr) deletedCount = orphanIds.length;
    }
  }

  await auditSync(userId, username, 'up', upsertedCount);

  return res.status(200).json({
    ok:        true,
    upserted:  upsertedCount,
    received:  received || [],
    deleted:   deletedCount,
    syncedAt:  new Date().toISOString(),
  });
}

function sanitizeClient(body, userId) {
  return {
    id:        String(body.id),
    nome:      String(body.nome || '').trim().substring(0, 200),
    tel:       body.tel       ? String(body.tel).trim().substring(0, 30)   : null,
    estudas:   body.estudas   ? String(body.estudas).trim().substring(0, 20)  : null,
    status:    VALID_STATUS.includes(body.status) ? body.status : 'interessado',
    endereco:  body.endereco  ? String(body.endereco).trim().substring(0, 500)  : null,
    indicado:  body.indicado  ? String(body.indicado).trim().substring(0, 200)  : null,
    obs:       body.obs       ? String(body.obs).trim().substring(0, 2000)      : null,
    maps_link: body.mapsLink  ? String(body.mapsLink).trim().substring(0, 2000) : null,
    lat:       isFinite(body.lat) ? Number(body.lat) : null,
    lng:       isFinite(body.lng) ? Number(body.lng) : null,
    updated_at: body.updatedAt || new Date().toISOString(),
    user_id:   userId,
  };
}
