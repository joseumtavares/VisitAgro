/**
 * GET  /api/km  — Lista registros de KM do usuário autenticado
 * POST /api/km  — Cria ou atualiza um registro de KM
 */
import { supabase } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  const userId   = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  // ── GET ───────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    let query = supabase
      .from('visitapro_km')
      .select('*')
      .order('data', { ascending: false });

    if (userRole !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[km GET]', error.message);
      return res.status(500).json({ error: 'Erro ao buscar registros de KM.' });
    }

    return res.status(200).json({ km: data || [] });
  }

  // ── POST — upsert ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body;

    if (!body?.id || !body?.data || body?.km_ini == null || body?.km_fim == null) {
      return res.status(400).json({ error: 'Campos obrigatórios: id, data, km_ini, km_fim.' });
    }

    if (Number(body.km_fim) < Number(body.km_ini)) {
      return res.status(400).json({ error: 'km_fim deve ser maior ou igual a km_ini.' });
    }

    const percorrido  = Number(body.km_fim) - Number(body.km_ini);
    const litros      = body.consumo ? percorrido / Number(body.consumo) : null;
    const custo_por_km = (body.combustivel && percorrido > 0)
      ? Number(body.combustivel) / percorrido
      : null;

    const row = {
      id:          String(body.id),
      user_id:     userId,
      data:        String(body.data),
      veiculo:     body.veiculo   ? String(body.veiculo).trim().substring(0, 100) : null,
      km_ini:      Number(body.km_ini),
      km_fim:      Number(body.km_fim),
      percorrido,
      combustivel: body.combustivel ? Number(body.combustivel)  : 0,
      consumo:     body.consumo     ? Number(body.consumo)      : null,
      litros,
      custo_por_km,
      obs:         body.obs ? String(body.obs).trim().substring(0, 1000) : null,
      updated_at:  new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('visitapro_km')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[km POST]', error.message);
      return res.status(500).json({ error: 'Erro ao salvar registro de KM.' });
    }

    return res.status(200).json({ km: data });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
