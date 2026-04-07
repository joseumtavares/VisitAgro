/**
 * POST /api/km/migrate
 *
 * Migra registros de KM do localStorage para o servidor.
 * Chamado uma única vez após o primeiro login com Supabase ativo.
 *
 * Body: { records: KmRecord[] }
 * Retorna: { migrated: number, skipped: number }
 */
import { supabase } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const userId = req.headers['x-user-id'];
  const { records = [] } = req.body || {};

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(200).json({ migrated: 0, skipped: 0 });
  }

  let migrated = 0;
  let skipped  = 0;

  for (const r of records) {
    if (!r.id || r.km_ini == null || r.km_fim == null) { skipped++; continue; }

    const percorrido   = Number(r.km_fim) - Number(r.km_ini);
    const litros       = r.consumo ? percorrido / Number(r.consumo) : null;
    const custo_por_km = (r.combustivel && percorrido > 0)
      ? Number(r.combustivel) / percorrido : null;

    const { error } = await supabase
      .from('visitapro_km')
      .upsert({
        id:          String(r.id),
        user_id:     userId,
        data:        r.data || new Date().toISOString().split('T')[0],
        veiculo:     r.veiculo     ? String(r.veiculo).substring(0, 100)   : null,
        km_ini:      Number(r.km_ini),
        km_fim:      Number(r.km_fim),
        percorrido,
        combustivel: r.combustivel ? Number(r.combustivel) : 0,
        consumo:     r.consumo     ? Number(r.consumo)     : null,
        litros,
        custo_por_km,
        obs:         r.obs ? String(r.obs).substring(0, 1000) : null,
        updated_at:  new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: true });

    if (error) { console.error('[km migrate]', error.message); skipped++; }
    else        { migrated++; }
  }

  return res.status(200).json({ migrated, skipped });
}
