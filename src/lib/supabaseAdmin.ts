// src/lib/supabaseAdmin.ts
// Cliente server-only com service_role — usar apenas em /api/*
// getAdmin() usa a service role: o Postgres não aplica RLS a esse cliente.
// Rotas devem filtrar workspace (e soft-delete) explicitamente no application layer.
import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getAdmin(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase env vars missing');
    _client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

export async function auditLog(
  action: string,
  meta?: Record<string, unknown>,
  userId?: string,
  username?: string
) {
  try {
    await getAdmin().from('audit_log').insert([{
      action, meta: meta ?? null, user_id: userId ?? null,
      username: username ?? null, created_at: new Date().toISOString(),
    }]);
  } catch { /* audit não pode quebrar o fluxo */ }
}
