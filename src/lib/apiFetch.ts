/**
 * src/lib/apiFetch.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Helper autenticado para todas as chamadas fetch() das páginas do dashboard.
 *
 * PROBLEMA RAIZ CORRIGIDO:
 *   Todos os fetch('/api/...') nas páginas do dashboard não enviavam o header
 *   Authorization. O middleware interceptava e retornava 401, fazendo a página
 *   redirecionar para /auth/login — dando a impressão de que o login não funcionava.
 *
 * SOLUÇÃO:
 *   Centralizar todas as chamadas em apiFetch(), que injeta automaticamente:
 *     Authorization: Bearer <token>
 *   O token vem do Zustand store (visitagropro-auth-v1 no localStorage).
 *
 * USO:
 *   import { apiFetch } from '@/lib/apiFetch';
 *   const data = await apiFetch('/api/clients').then(r => r.json());
 * ──────────────────────────────────────────────────────────────────────────
 */

/** Lê o token JWT do store Zustand persistido no localStorage */
function getToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem('visitagropro-auth-v1');
    if (!raw) return '';
    const store = JSON.parse(raw);
    return store?.state?.token ?? '';
  } catch {
    return '';
  }
}

/**
 * apiFetch — wrapper autenticado sobre fetch().
 * Injeta Authorization: Bearer <token> em todas as requisições.
 * Parâmetros idênticos ao fetch() nativo.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  return fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
}

/**
 * apiFetchJson — apiFetch que já faz .json() e lança erro se !res.ok
 * Útil para chamadas simples de leitura.
 */
export async function apiFetchJson<T = any>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(input, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data as T;
}
