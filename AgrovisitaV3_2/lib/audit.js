/**
 * lib/audit.js — Registro de eventos de segurança
 *
 * Registra na tabela audit_log do Supabase:
 *   - Logins (sucesso e falha)
 *   - Logouts
 *   - Acessos negados (401/403)
 *   - Operações críticas (sync, delete em massa)
 */
import { supabase } from './supabase.js';

const TABLE = 'visitapro_audit_log';

/**
 * @param {object} event
 * @param {string} event.action     - 'login_ok' | 'login_fail' | 'logout' | 'access_denied' | 'sync_up' | 'sync_down' | 'delete'
 * @param {string} [event.userId]   - ID do usuário (se autenticado)
 * @param {string} [event.username] - Nome do usuário
 * @param {string} [event.ip]       - IP da requisição
 * @param {string} [event.ua]       - User-Agent
 * @param {object} [event.meta]     - Dados adicionais (JSON)
 */
export async function audit(event) {
  try {
    await supabase.from(TABLE).insert({
      action:    event.action,
      user_id:   event.userId   || null,
      username:  event.username || null,
      ip:        event.ip       || null,
      user_agent: event.ua      || null,
      meta:      event.meta     || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Auditoria nunca deve quebrar o fluxo principal
    console.error('[audit] falha ao registrar evento:', err.message);
  }
}

/** Helpers semânticos */
export const auditLoginOk   = (username, ip, ua, meta) => audit({ action: 'login_ok',      username, ip, ua, meta });
export const auditLoginFail = (username, ip, ua, meta) => audit({ action: 'login_fail',     username, ip, ua, meta });
export const auditLogout    = (userId, username, ip)   => audit({ action: 'logout',         userId, username, ip });
export const auditDenied    = (username, ip, ua, path) => audit({ action: 'access_denied',  username, ip, ua, meta: { path } });
export const auditSync      = (userId, username, dir, count) => audit({ action: `sync_${dir}`, userId, username, meta: { count } });
