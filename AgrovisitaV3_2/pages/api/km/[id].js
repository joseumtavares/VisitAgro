/**
 * DELETE /api/km/:id — Remove um registro de KM
 */
import { supabase } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { id }   = req.query;
  const userId   = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

  // Verifica ownership antes de deletar
  const { data: existing } = await supabase
    .from('visitapro_km')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!existing) return res.status(404).json({ error: 'Registro não encontrado.' });

  if (userRole !== 'admin' && existing.user_id !== userId) {
    return res.status(403).json({ error: 'Sem permissão.' });
  }

  const { error } = await supabase.from('visitapro_km').delete().eq('id', id);

  if (error) {
    console.error('[km DELETE]', error.message);
    return res.status(500).json({ error: 'Erro ao remover registro.' });
  }

  return res.status(200).json({ ok: true });
}
