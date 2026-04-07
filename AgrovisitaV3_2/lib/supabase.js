/**
 * lib/supabase.js — Cliente Supabase do SERVIDOR
 * Usa a service_role key — NUNCA importar no browser.
 * A chave nunca é enviada ao cliente; fica apenas nas
 * serverless functions da Vercel.
 */
import { createClient } from '@supabase/supabase-js';

const url  = process.env.SUPABASE_URL;
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.\n' +
    'Configure as variáveis de ambiente na Vercel ou em .env.local'
  );
}

// createClient é singleton por módulo no Next.js serverless
export const supabase = createClient(url, key, {
  auth: {
    // Service role ignora RLS — atenção: use com cuidado
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Cliente com a anon key — usado APENAS para chamar RPCs
 * SECURITY DEFINER (como visitapro_verify_pass) que precisam
 * do contexto de permissão anon, mas executam como superuser.
 */
export const supabaseAnon = createClient(
  url,
  process.env.SUPABASE_ANON_KEY || key,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
