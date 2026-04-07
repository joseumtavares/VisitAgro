/**
 * PUT    /api/clients/:id  — Atualiza um cliente
 * DELETE /api/clients/:id  — Remove um cliente
 *
 * Proteção: JWT obrigatório + verificação de ownership
 */
import { supabase } from '../../../lib/supabase.js';
import { audit } from '../../../lib/audit.js';

const VALID_STATUS = ['interessado','visitado','agendado','comprou','naointeressado','retornar','outro'];

export default async function handler(req, res) {
  const { id }   = req.query;
  const userId   = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];
  const username = req.headers['x-user-name'];
  const ip       = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();

  if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

  // ── Verifica ownership ───────────────────────────────────────────
  const { data: existing } = await supabase
    .from('visitapro_clients')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  // Usuário comum só pode modificar seus próprios registros
  if (userRole !== 'admin' && existing.user_id !== userId) {
    await audit({ action: 'access_denied', userId, username, ip, meta: { clientId: id, method: req.method } });
    return res.status(403).json({ error: 'Sem permissão para este cliente.' });
  }

  // ── PUT — atualiza ────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const body = req.body;
    if (!body || !body.nome) {
      return res.status(400).json({ error: 'Campo nome é obrigatório.' });
    }

    const row = {
      nome:      String(body.nome).trim().substring(0, 200),
      tel:       body.tel       ? String(body.tel).trim().substring(0, 30)   : null,
      estudas:   body.estudas   ? String(body.estudas).trim().substring(0, 20)  : null,
      status:    VALID_STATUS.includes(body.status) ? body.status : 'interessado',
      endereco:  body.endereco  ? String(body.endereco).trim().substring(0, 500)  : null,
      indicado:  body.indicado  ? String(body.indicado).trim().substring(0, 200)  : null,
      obs:       body.obs       ? String(body.obs).trim().substring(0, 2000)      : null,
      maps_link: body.mapsLink  ? String(body.mapsLink).trim().substring(0, 2000) : null,
      lat:       isFinite(body.lat) ? Number(body.lat) : null,
      lng:       isFinite(body.lng) ? Number(body.lng) : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('visitapro_clients')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[clients PUT]', error.message);
      return res.status(500).json({ error: 'Erro ao atualizar cliente.' });
    }

    return res.status(200).json({ client: data });
  }

  // ── DELETE — remove ───────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('visitapro_clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[clients DELETE]', error.message);
      return res.status(500).json({ error: 'Erro ao remover cliente.' });
    }

    await audit({
      action: 'delete', userId, username, ip,
      meta: { clientId: id, clientName: existing?.nome },
    });

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
