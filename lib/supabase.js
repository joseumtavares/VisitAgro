/**
 * lib/supabase.js
 * Cliente Supabase para Next.js App Router
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Cliente para uso no browser (anon)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente para uso server-side com privilégios totais (service_role)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Cria cliente Supabase com token JWT do usuário
 * @param {string} jwt - Token JWT do usuário
 */
export function createClientWithToken(jwt) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

/**
 * HTTP client para API REST do Supabase (server-side)
 */
export async function sb(path, opts = {}) {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
  }
  
  const fullUrl = `${supabaseUrl}${path}`;
  const body = opts.body ? JSON.stringify(opts.body) : undefined;

  const res = await fetch(fullUrl, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey,
      'Accept': 'application/json',
      ...(opts.headers || {}),
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`[supabase] ${res.status} ${res.statusText} — ${path}`);
    err.status = res.status;
    err.details = text;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

/**
 * Upsert em lotes (chunks de 200 rows)
 */
export async function upsertTable(table, rows, conflictCol = 'id') {
  if (!rows || !rows.length) return;
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await sb(`/rest/v1/${table}?on_conflict=${conflictCol}`, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: rows.slice(i, i + CHUNK),
    });
  }
}

/**
 * Sanitiza nome do workspace
 */
export function sanitizeWorkspace(ws) {
  return String(ws || 'principal').trim().toLowerCase()
    .replace(/[^a-z0-9_-]/g, '').slice(0, 80) || 'principal';
}
