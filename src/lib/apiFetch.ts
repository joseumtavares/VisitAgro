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

function normalizeHeaders(initHeaders?: HeadersInit): Record<string, string> {
  if (!initHeaders) return {};

  if (initHeaders instanceof Headers) {
    return Object.fromEntries(initHeaders.entries());
  }

  if (Array.isArray(initHeaders)) {
    return Object.fromEntries(initHeaders);
  }

  return { ...initHeaders };
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers = normalizeHeaders(init.headers);

  const isFormData =
    typeof FormData !== 'undefined' && init.body instanceof FormData;

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export async function apiFetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(input, init);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error((data as any)?.error || `HTTP ${res.status}`);
  }

  return data as T;
}