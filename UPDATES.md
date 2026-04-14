# UPDATES.md — VisitAgroPro
> Última atualização: 14/04/2026 — v0.9.4

---

## ✅ RESUMO EXECUTIVO — v0.9.4

Esta versão fecha as **correções críticas e de segurança** identificadas na auditoria
técnica completa realizada em 14/04/2026. Nenhuma funcionalidade foi removida ou
refatorada estruturalmente — todas as alterações são incrementais e preservam os
contratos de API existentes.

### Problemas resolvidos

| # | Severidade | Arquivo | Problema | Status |
|---|-----------|---------|----------|--------|
| 1 | 🔴 Crítico | `scripts/insert_admin.sql` | Sem seed de `workspaces`: todos os INSERTs falhavam com FK violation em instalação limpa | ✅ Corrigido |
| 2 | 🔴 Alto | `api/auth/login/route.ts` | `createClient` local, sem brute-force protection, sem `last_login` | ✅ Corrigido |
| 3 | 🔴 Alto | `api/admin/logs/route.ts` | Logs acessíveis por qualquer usuário autenticado (sem verificação de role) | ✅ Corrigido |
| 4 | 🟠 Alto | `api/auth/change-password/route.ts` | Sem validação de workspace no filtro do usuário | ✅ Corrigido |
| 5 | 🟠 Alto | `lib/supabaseAdmin.ts` | Sem `server-only`: risco de vazar `SERVICE_ROLE_KEY` no bundle cliente | ✅ Corrigido |
| 6 | 🟠 Alto | `lib/apiFetch.ts` | `Content-Type: application/json` forçado em FormData, corrompendo uploads | ✅ Corrigido |
| 7 | 🟡 Médio | `dashboard/clients/page.tsx` | DELETE silenciava erros, recarregava lista mesmo em falha | ✅ Corrigido |
| 8 | 🟡 Médio | `dashboard/referrals/page.tsx` | Mesmo problema do DELETE em clients | ✅ Corrigido |
| 9 | 🟡 Médio | `dashboard/commissions/page.tsx` | `confirmPayment()` sem verificação de resposta do PUT | ✅ Corrigido |
| 10 | 🟡 Médio | `dashboard/logs/page.tsx` | 403 e erros de carregamento silenciados | ✅ Corrigido |
| 11 | 🟡 Médio | `types/index.ts` | Interfaces desatualizadas; `pass_hash` exposto no tipo público `User` | ✅ Corrigido |

---

## 📦 ARQUIVOS ALTERADOS — v0.9.4

| Arquivo | Tipo de alteração | Risco |
|---------|------------------|-------|
| `scripts/insert_admin.sql` | Adição de seed (idempotente) | Nenhum |
| `src/app/api/auth/login/route.ts` | Substituição completa | Baixo — contrato preservado |
| `src/app/api/admin/logs/route.ts` | Adição de verificação de role | Baixo |
| `src/app/api/auth/change-password/route.ts` | Adição de workspace + auditLog | Baixo |
| `src/lib/supabaseAdmin.ts` | Adição de `import 'server-only'` | Nenhum |
| `src/lib/apiFetch.ts` | Reescrita interna (assinatura preservada) | Baixo |
| `src/app/dashboard/clients/page.tsx` | Patch localizado em `remove()` | Nenhum |
| `src/app/dashboard/referrals/page.tsx` | Patch localizado em `remove()` | Nenhum |
| `src/app/dashboard/commissions/page.tsx` | Patch localizado em `confirmPayment()` | Nenhum |
| `src/app/dashboard/logs/page.tsx` | Patch localizado em `load()` + JSX | Nenhum |
| `src/types/index.ts` | Reescrita completa (sem quebra de uso atual) | Baixo |

---

## 🔎 DETALHAMENTO TÉCNICO

### 1 — Seed de `workspaces` (bloqueante)

**Contexto:** O schema v0.9.x introduziu a tabela `workspaces` como dependência
central. Todas as tabelas operacionais possuem `FOREIGN KEY (workspace)
REFERENCES workspaces(id) NOT NULL`. O script de seed anterior não inseria a
row `'principal'`, causando violação de FK em qualquer INSERT em instalação limpa.

**Correção:**
```sql
INSERT INTO workspaces (id, name, slug, settings, created_at, updated_at)
VALUES ('principal', 'Principal', 'principal', '{}', now(), now())
ON CONFLICT (id) DO NOTHING;
```
Executada como **primeira instrução** de `scripts/insert_admin.sql`.

---

### 2 — Login com brute-force protection

**Antes:** criava `createClient` a cada request, não verificava `locked_until`,
não atualizava `failed_logins` nem `last_login`.

**Depois:** usa `getAdmin()` singleton, fluxo completo:
```
request recebido
  → busca user por username OU email (maybeSingle)
  → verifica locked_until (retorna 423 se bloqueado)
  → verifica pass_hash (verifyPassword)
  → se inválida: incrementa failed_logins, seta locked_until em >= 5 falhas
  → se válida: reseta failed_logins, atualiza last_login, gera JWT, auditLog
```

**Contrato de resposta:** `{ user, token }` — inalterado.
Campos removidos da resposta: `pass_hash`, `hash_algo`, `failed_logins`,
`locked_until`, `last_login`.

---

### 3 — Logs restritos a admin

**Antes:** `GET /api/admin/logs` sem nenhuma verificação de autorização.

**Depois:**
```typescript
const { role } = getRequestContext(req);
if (role !== 'admin') {
  return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
}
```

A página `logs/page.tsx` agora trata o 403 exibindo mensagem amigável.

---

### 4 — Change-password com workspace

**Antes:** buscava usuário apenas por `id`, sem `workspace` nem `active`.

**Depois:** filtra por `id + workspace + active = true` em ambos — SELECT e UPDATE.
Usa `getRequestContext()` para extrair `userId` e `workspace` do JWT.

---

### 5 — supabaseAdmin server-only

`import 'server-only'` adicionado como primeira linha. O Next.js lança erro de
build se esse módulo for importado em código client-side, protegendo a
`SUPABASE_SERVICE_ROLE_KEY`.

---

### 6 — apiFetch e FormData

**Antes:**
```typescript
headers: {
  'Content-Type': 'application/json',  // sempre, sem exceção
  ...
}
```

**Depois:**
```typescript
const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
if (!isFormData && !headers['Content-Type']) {
  headers['Content-Type'] = 'application/json';
}
```

Headers existentes no `init` são preservados; `Authorization` não sobrescreve
header já presente.

---

### 7–9 — Tratamento de erros em DELETE e PUT

Padrão aplicado:
```typescript
const r = await apiFetch(url, { method: 'DELETE' });
if (!r.ok) {
  const j = await r.json().catch(() => ({}));
  setError(j.error || 'Mensagem padrão de erro.');
  return;
}
await load();
```

---

### 10 — logs/page.tsx sem falha silenciosa

```typescript
const load = useCallback(async () => {
  setLoading(true);
  setLoadError('');
  try {
    const r = await apiFetch('/api/admin/logs');
    const j = await r.json().catch(() => ({}));
    if (r.status === 403) { setLoadError('Acesso restrito a administradores.'); return; }
    if (!r.ok) { setLoadError(j.error || `Erro ao carregar logs (HTTP ${r.status}).`); return; }
    setLogs(j.logs ?? []);
  } catch (e: any) {
    setLoadError('Falha de conexão ao carregar logs.');
  } finally {
    setLoading(false);
  }
}, []);
```

---

### 11 — types/index.ts

Resumo das adições por interface:

| Interface | Campos adicionados | Campo removido |
|-----------|-------------------|----------------|
| `User` | `name`, `workspace`, `company_id`, `last_login`, `updated_at` | `pass_hash` ✅ |
| `Client` | `tel2`, `category`, `maps_link`, `zip_code`, `obs`, `indicado`, `deleted_at` | — |
| `Product` | `cost_price`, `model`, `color`, `sku`, `finame_code`, `ncm_code`, `unit`, `deleted_at` | — |
| `Order` | `version`, `commission_value`, `commission_type`, `commission_pct`, `discount`, `environment_id`, `deleted_at`, `clients`, `referrals` | — |
| `Commission` | `workspace`, `referral_name`, `client_name`, `order_date`, `order_total`, `receipt_photo_ids` | — |

Novas interfaces: `OrderItem`, `Referral`, `Visit`, `Category`, `Company`
Novos tipos: `CommissionStatus`, `ActivityType`

---

## 🗺️ ROADMAP — O QUE AINDA ESTÁ PENDENTE

### Próxima prioridade — SQL

```sql
-- Trigger de optimistic locking em orders (sem isso, version não funciona no banco)
CREATE OR REPLACE FUNCTION enforce_order_version() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.version IS DISTINCT FROM OLD.version + 1 THEN
    RAISE EXCEPTION 'Order version mismatch: expected %, got %', OLD.version + 1, NEW.version
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_version_check
  BEFORE UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.version IS NOT NULL)
  EXECUTE FUNCTION enforce_order_version();
```

### Módulos ausentes com suporte confirmado no banco

| Módulo | Tabela | Prioridade |
|--------|--------|-----------|
| Comissões de representantes | `rep_commissions` | Alta |
| Controle de KM / veículos | `km_logs` | Média |
| Ambientes / talhões por cliente | `environments` | Média |
| Pré-cadastros / leads | `pre_registrations` | Média |
| Gerenciamento de workspaces | `workspaces` | Alta |

### Débitos técnicos restantes

- `dashboard/page.tsx`: Promise.all sem `.catch()` visível — erros silenciados
- `supabase.ts` (cliente público): não é usado por nenhuma rota, lança erro de
  build se `NEXT_PUBLIC_SUPABASE_ANON_KEY` não estiver presente
- `refresh_tokens`: tabela existe, nenhum fluxo de renovação de sessão implementado
- `geocode_cache`: tabela existe, CEP não usa cache de coordenadas

---

## 🧾 HISTÓRICO CONSOLIDADO

### v0.9.4 (14/04/2026)
- [x] FIX crítico: seed de `workspaces` em `scripts/insert_admin.sql`
- [x] FIX segurança: login com brute-force protection + `getAdmin()`
- [x] FIX segurança: logs restritos a `role = 'admin'`
- [x] FIX segurança: change-password com workspace + auditLog
- [x] FIX: `supabaseAdmin.ts` marcado como server-only
- [x] FIX: `apiFetch` não corrompe FormData
- [x] FIX: DELETE em clients/referrals sem falha silenciosa
- [x] FIX: `confirmPayment` em commissions sem falha silenciosa
- [x] FIX: logs/page trata 403 e erros de carregamento
- [x] MELHORIA: `types/index.ts` sincronizado com schema real

### v0.9.3 (10/04/2026)
- [x] FIX: criação de `src/app/api/visits/route.ts`
- [x] FIX: erro `<!DOCTYPE` no check-in
- [x] FIX: `products/page.tsx` formulário completo
- [x] FEAT: modal de check-in + agendamento no mapa
- [x] FEAT: `GpsPickerMap.tsx`
- [x] FEAT: categorias em Configurações

### v0.9.2 (09/04/2026)
- [x] FIX: assinatura HMAC-SHA256 no middleware
- [x] FIX: JWT_SECRET hardcoded removido
- [x] FIX: apiFetch em clients/referrals pages
- [x] FIX: hydration guard nas páginas

### v0.9.1 (08/04/2026)
- Versão inicial funcional
