/**
 * src/lib/apiFetch.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Helper autenticado para todas as chamadas fetch() das páginas do dashboard.
 * Injeta automaticamente Authorization: Bearer <token> em todas as requisições.
 * O token vem do Zustand store (visitagropro-auth-v1 no localStorage).
 *
 * Content-Type: application/json é injetado apenas quando o body NÃO for
 * FormData, evitando corromper uploads multipart.
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

/** Normaliza qualquer formato de HeadersInit em objeto plano */
function normalizeHeaders(initHeaders?: HeadersInit): Record<string, string> {
  if (!initHeaders) return {};
  if (initHeaders instanceof Headers) {
    return Object.fromEntries(initHeaders.entries());
  }
  if (Array.isArray(initHeaders)) {
    return Object.fromEntries(initHeaders);
  }
  return { ...(initHeaders as Record<string, string>) };
}

/**
 * apiFetch — wrapper autenticado sobre fetch().
 * - Injeta Authorization: Bearer <token>
 * - Injeta Content-Type: application/json apenas quando o body não é FormData
 * - Parâmetros idênticos ao fetch() nativo
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers = normalizeHeaders(init.headers);

  // Não sobrescrever Content-Type quando o body for FormData
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
    throw new Error((data as any)?.error || `HTTP ${res.status}`);
  }
  return data as T;
}
