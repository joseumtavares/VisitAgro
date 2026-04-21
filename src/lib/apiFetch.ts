/**
 * src/lib/apiFetch.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Helper autenticado para todas as chamadas fetch() das páginas do dashboard.
 *
 * Responsabilidades:
 * - Injeta Authorization: Bearer <token>
 * - Injeta headers de contexto para o backend:
 *   - x-user-id
 *   - x-user-name
 *   - x-user-role
 *   - x-workspace
 *
 * Esses headers são consumidos por getRequestContext(req) no backend.
 *
 * O token vem do Zustand store (visitagropro-auth-v1 no localStorage).
 *
 * Content-Type: application/json é injetado apenas quando o body NÃO for
 * FormData, evitando corromper uploads multipart.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** Estrutura esperada do Zustand persistido */
type AuthState = {
  token?: string;
  user?: {
    id?: string;
    username?: string;
    name?: string;
    role?: string;
    workspace?: string;
  };
};

/**
 * Lê o estado completo do auth do localStorage.
 * NÃO lançar erro — sempre retornar objeto vazio em caso de falha.
 */
function getAuthState(): AuthState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('visitagropro-auth-v1');
    if (!raw) return {};
    const store = JSON.parse(raw);
    return store?.state ?? {};
  } catch {
    return {};
  }
}

/** Lê apenas o token JWT */
function getToken(): string {
  const state = getAuthState();
  return state?.token ?? '';
}

/** Lê o usuário atual do store */
function getCurrentUser() {
  const state = getAuthState();
  return state?.user ?? {};
}

/**
 * Normaliza qualquer formato de HeadersInit em objeto plano
 * para facilitar manipulação.
 */
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
 * apiFetch — wrapper autenticado sobre fetch()
 *
 * Injeta automaticamente:
 * - Authorization: Bearer <token>
 * - x-user-id
 * - x-user-name
 * - x-user-role
 * - x-workspace
 *
 * IMPORTANTE:
 * Esses headers são necessários porque o backend NÃO lê o JWT diretamente.
 * Ele depende desses headers via getRequestContext(req).
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const user = getCurrentUser();
  const headers = normalizeHeaders(init.headers);

  // Não sobrescrever Content-Type quando o body for FormData
  const isFormData =
    typeof FormData !== 'undefined' && init.body instanceof FormData;

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Injeta token JWT
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Injeta contexto do usuário
   * ──────────────────────────
   * Esses headers são usados pelo backend (getRequestContext).
   * Se não forem enviados, a API perde:
   * - userId
   * - role
   * - workspace
   * e começa a falhar (ex: 403 indevido).
   */

  if (user?.id && !headers['x-user-id']) {
    headers['x-user-id'] = String(user.id);
  }

  const userName = user?.name || user?.username || '';
  if (userName && !headers['x-user-name']) {
    headers['x-user-name'] = String(userName);
  }

  if (user?.role && !headers['x-user-role']) {
    headers['x-user-role'] = String(user.role);
  }

  if (user?.workspace && !headers['x-workspace']) {
    headers['x-workspace'] = String(user.workspace);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

/**
 * apiFetchJson — apiFetch que já faz .json()
 * e lança erro automaticamente se !res.ok
 *
 * Ideal para chamadas simples de leitura.
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