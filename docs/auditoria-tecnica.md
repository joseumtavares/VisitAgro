# 🛡️ Auditoria Técnica

> Resumo executivo da situação técnica do projeto após os ajustes aplicados.

---

## 1. Resumo Executivo

### Visão geral

VisitAgro Pro é um SaaS voltado ao agronegócio para gestão de visitas comerciais, clientes, vendas, produtos, comissões e indicadores (referrals). A operação é centrada em representantes de campo que fazem check-in geolocalizado via mapa Leaflet, registram pedidos e acompanham comissões.

### Stack identificada

| Camada | Tecnologia | Versão (package.json do repo) |
|--------|-----------|-------------------------------|
| Framework | Next.js App Router | 14.2.35 |
| UI | React | 18.x |
| Estilo | Tailwind CSS | 3.x |
| Banco | Supabase (PostgreSQL) | supabase-js v2 |
| Auth | JWT HS256 próprio + bcrypt | jsonwebtoken + bcryptjs |
| Estado cliente | Zustand com persist | 4.x |
| Mapa | Leaflet + react-leaflet | dinâmico |
| Deploy | Vercel | Node 20.x (engines) |
| Runtime server | `server-only` + service_role | — |

### Principais riscos identificados

- **Crítico resolvido:** `src/app/api/products/route.ts` continha código de `visits`, tornando toda a tela de produtos não funcional.
- **Crítico resolvido:** `middleware.ts` injetava contexto em *response headers* em vez de *request headers*, impedindo que rotas recebessem `x-workspace` e `x-user-id`.
- **Alta — pendente de validação:** `refresh_tokens` existe no banco mas não é usado pelo app; token JWT em `localStorage` sem revogação.
- **Alta — pendente:** `audit_log` não tem coluna `workspace`; logs são globais, não por tenant.
- **Média:** `pre_registrations` tem tabela completa no banco mas sem rota API nem página no dashboard.
- **Média:** `km_logs` tem tabela com `deleted_at` mas sem CRUD exposto no app.
- **Média:** `geocode_cache` existe no banco mas `/api/cep/[cep]` ainda chama ViaCEP diretamente sem cachear.
- **Oportunidade:** Base multi-tenant (`workspaces` + FKs) está no banco; o app já propaga `x-workspace` após os patches; expansão para novos tenants é viável sem reescrita.

---

## 2. Análise da Stack e Arquitetura

### Configurações de build

- **`next.config.mjs`**: `reactStrictMode: true`. Não há configuração de `output: 'standalone'`, o que é padrão adequado para Vercel.
- **`vercel.json`**: `framework: "nextjs"` sem customizações. Deploy funcional sem configuração extra.
- **`tsconfig.json`**: path alias `@/*` apontando para `./src/*`. Consistente com todos os imports do projeto.
- **`middleware.ts`**: Intercepta `'/api/:path*'`, valida JWT via Web Crypto API (Edge Runtime), propaga contexto via request headers após os patches do Pacote 1.

### Organização de pastas

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          login, change-password
│   │   ├── clients/       GET, POST, [id] GET/PUT/DELETE
│   │   ├── products/      GET, POST, [id] GET/PUT/DELETE
│   │   ├── categories/    GET, POST, PUT, DELETE
│   │   ├── orders/        GET, POST, [id] GET/PUT/DELETE
│   │   ├── referrals/     GET, POST, [id] PUT/DELETE
│   │   ├── commissions/   GET, [id] PUT
│   │   ├── visits/        GET, POST
│   │   ├── settings/      GET; company/ POST
│   │   ├── admin/         logs, pin, reprocess, cleanup
│   │   └── cep/[cep]/     GET (ViaCEP proxy)
│   ├── auth/login/
│   ├── dashboard/
│   │   ├── page.tsx        (cards agregados)
│   │   ├── clients/
│   │   ├── products/
│   │   ├── referrals/
│   │   ├── sales/
│   │   ├── commissions/
│   │   ├── settings/
│   │   ├── maintenance/
│   │   ├── logs/
│   │   └── map/
│   └── visits/            (re-export para /api/visits após Pacote 3)
├── lib/
│   ├── supabaseAdmin.ts   singleton service_role (server-only)
│   ├── auth.ts            verifyPassword, hashPassword, generateToken, verifyToken
│   ├── apiFetch.ts        helper client-side com Authorization injetado
│   ├── commissionHelper.ts generateCommission(admin, order, amount)
│   └── requestContext.ts  getRequestContext(req) — novo no Pacote 5
├── store/
│   └── authStore.ts       Zustand persist (key: visitagropro-auth-v1)
└── components/
    ├── layout/
    │   └── DashboardShell.tsx
    └── map/
        └── InteractiveMap.tsx  (Leaflet, check-in, geolocalização)
```

### Padrões de camadas

| Camada | Padrão |
|--------|--------|
| Autenticação | JWT HS256 próprio; bcrypt 12 rounds para senhas novas; legado sha256+PBKDF2 mantido para migração |
| Acesso ao banco | `getAdmin()` singleton com `SUPABASE_SERVICE_ROLE_KEY`; bypassa RLS intencionalmente |
| Isolamento tenant | `workspace` TEXT com FK para `public.workspaces`; propagado via `x-workspace` header |
| Contexto request | `getRequestContext(req)` → `{ userId, username, role, workspace }` |
| Soft delete | `deleted_at TIMESTAMPTZ` em clients, products, referrals, orders, visits, km_logs, pre_registrations |
| Auditoria | `auditLog(action, meta, userId, username)` → INSERT em `audit_log` sem quebrar fluxo |

---

## 3. Problemas Encontrados

### P-01 — `src/app/api/products/route.ts` implementava `visits`

| Campo | Conteúdo |
|-------|----------|
| **Severidade** | Crítica |
| **Descrição** | O arquivo da rota de produtos continha código que operava a tabela `visits`, com retorno `{ visits: [...] }`. |
| **Impacto** | Listagem de produtos vazia em `/dashboard/products`; seletor de produtos em vendas sem dados; card "Produtos" do dashboard com valor zero. |
| **Localização** | `src/app/api/products/route.ts` — todo o handler `GET` e `POST` |
| **Correção** | **Aplicada no Pacote 1.** Rota reescrita para operar `products` com filtro `workspace` e `deleted_at IS NULL`. |

---

### P-02 — `middleware.ts` injetava contexto em response headers

| Campo | Conteúdo |
|-------|----------|
| **Severidade** | Crítica |
| **Descrição** | `NextResponse.next()` seguido de `response.headers.set(...)` não propaga headers para a *request* downstream em Next.js App Router. |
| **Impacto** | `req.headers.get('x-user-id')` e `req.headers.get('x-workspace')` retornavam `null` em todas as rotas autenticadas. Troca de senha, visitas e settings operavam sem contexto de usuário/tenant. |
| **Localização** | `middleware.ts` — bloco de set de headers |
| **Correção** | **Aplicada no Pacote 1.** Substituído por `NextResponse.next({ request: { headers: requestHeaders } })`. |

---

### P-03 — `orders` recebia `payment_type` inexistente no contrato-base

| Campo | Conteúdo |
|-------|----------|
| **Severidade** | Crítica |
| **Descrição** | `src/app/api/orders/route.ts` extraía `payment_type` do body e tentava gravar na tabela `orders`. A migration-base não incluiu essa coluna inicialmente. |
| **Impacto** | Criação de pedidos falhava com erro de coluna inexistente. |
| **Localização** | `src/app/api/orders/route.ts` — INSERT de orders; `src/app/dashboard/sales/page.tsx` — estado `payment_type` |
| **Correção** | **Nota:** O schema `v0.9.4` confirmado mostra que `orders.payment_type` **existe** (`DEFAULT 'avista'`). A coluna foi mantida. O patch do Pacote 1 removeu o envio desnecessário do frontend, mas a coluna está presente. Se for reativar o campo na UI, é seguro fazê-lo. |

---

### P-04 — `audit_log` sem coluna `workspace`

| Campo | Conteúdo |
|-------|----------|
| **Severidade** | Alta |
| **Descrição** | `audit_log` não possui coluna `workspace`. Logs são globais, qualquer admin de qualquer tenant pode ler todos os registros via `/api/admin/logs`. |
| **Impacto** | Violação de isolamento de dados em cenário multi-tenant real. |
| **Localização** | `schema_atual_v094.sql` — tabela `audit_log`; `src/app/api/admin/logs/route.ts` |
| **Correção** | Migration futura: `ALTER TABLE public.audit_log ADD COLUMN workspace TEXT NOT NULL DEFAULT 'principal'`. Adicionar FK e índice. Atualizar `auditLog()` em `src/lib/supabaseAdmin.ts` para receber e gravar `workspace`. |

---

### P-05 — `refresh_tokens` no banco sem uso no app

| Campo | Conteúdo |
|-------|----------|
| **Severidade** | Alta |
| **Descrição** | A tabela `refresh_tokens` existe com `token_hash`, `expires_at`, `revoked`. O fluxo de auth atual usa JWT em `localStorage` sem renovação nem revogação. |
| **Impacto** | Tokens roubados não podem ser invalidados; sessão não expira antes do `exp` do JWT; `refresh_tokens` ocupa espaço sem utilidade. |
| **Localização** | `schema_atual_v094.sql` — tabela `refresh_tokens`; `src/lib/auth.ts`; `src/store/authStore.ts` |
| **Correção** | Decidir entre dois caminhos: (A) implementar refresh token com endpoint `/api/auth/refresh` e cookie `HttpOnly`; (B) aumentar rotação do JWT secret + expiração curta e abandonar a tabela. |

---

### P-06 — `pre_registrations` sem rota API nem página

| Campo | Conteúdo |
|-------|----------|
| **Severidade** | Média |
| **Descrição** | A tabela `pre_registrations` tem schema completo (status, geolocalização, referral_id, soft delete), mas não existe `src/app/api/pre-registrations/` nem `src/app/dashboard/leads/`. |
| **Impacto** | Funcionalidade planejada inacessível. |
| **Localização** | `schema_atual_v094.sql` — tabela `pre_registrations` |
| **Correção** | Criar rota API e página seguindo o padrão de `clients`. Ver Seção 5 para scaffold sugerido. |

---

### P-07 — `km_logs` sem CRUD exposto

| Campo | Conteúdo |
|-------|----------|
| **Severidade** | Média |
| **Descrição** | `km_logs` tem schema funcional (km_ini, km_fim, percorrido, combustivel, checks, soft delete), mas nenhuma rota API ou página no dashboard. |
| **Impacto** | Funcionalidade de controle de quilometragem não acessível. |
| **Localização** | `schema_atual_v094.sql` — tabela `km_logs` |
| **Correção** | Criar `/api/km-logs/` e `/dashboard/km/` quando for prioridade. |

---

### P-08 — `geocode_cache` sem uso real

| Campo | Conteúdo |
|-------|----------|
| **Severidade** | Baixa |
| **Descrição** | `/api/cep/[cep]/route.ts` chama ViaCEP diretamente sem cachear resultado. A tabela `geocode_cache` existe mas armazena lat/lng de CEP, não endereço. São contratos diferentes. |
| **Impacto** | Chamadas repetidas ao ViaCEP; `geocode_cache` inutilizada. |
| **Localização** | `src/app/api/cep/[cep]/route.ts`; `schema_atual_v094.sql` — `geocode_cache` |
| **Correção** | Quando a rota de CEP retornar coordenadas (ex: via Google Geocoding), cachear em `geocode_cache`. Por ora, manter `next: { revalidate: 86400 }` no fetch do ViaCEP como mitigação. |

---

### P-09 — `rate_limits` sem lógica de consumo

| Campo | Conteúdo |
|-------|----------|
| **Severidade** | Baixa |
| **Descrição** | A tabela `rate_limits(key, created_at)` existe mas nenhuma rota API a utiliza para throttling. |
| **Impacto** | Endpoint de login sem rate limit baseado em banco; proteção existente é apenas via `locked_until` em `users`. |
| **Localização** | `schema_atual_v094.sql` — `rate_limits` |
| **Correção** | Implementar helper de rate limit por IP/username na rota de login, usando a tabela existente com DELETE periódico de entradas antigas. |

---

### P-10 — `environments` sem CRUD completo

| Campo | Conteúdo |
|-------|----------|
| **Severidade** | Baixa |
| **Descrição** | `environments` tem tabela com área, coordenadas, drawing JSONB e FK para `clients`. `orders.environment_id` referencia essa tabela. Não há rota API nem UI para gerenciar ambientes. |
| **Impacto** | Relacionamento de pedido ↔ ambiente não utilizável na interface. |
| **Localização** | `schema_atual_v094.sql` — `environments`; `orders.environment_id` |
| **Correção** | Futuro: criar `/api/environments/` e componente de seleção na tela de vendas. |

---

## 4. Melhorias Propostas

### M-01 — Implementar `workspace` em `audit_log`

**Justificativa:** Multi-tenant real exige isolamento nos logs.  
**Prioridade:** Alta.  
**Impacto:** Logs administrativos passam a ser por tenant; `/api/admin/logs` pode filtrar por workspace.  
**Risco:** Migration simples com `DEFAULT 'principal'`; sem impacto em registros existentes.

---

### M-02 — Criar módulo de Leads (`pre_registrations`)

**Justificativa:** Tabela completa no banco; fluxo natural de pré-cadastro → conversão em cliente.  
**Prioridade:** Alta (funcionalidade planejada).  
**Impacto:** Representantes poderão registrar leads no campo antes de formalizar cliente.  
**Risco:** Baixo; padrão idêntico ao módulo de clients.

---

### M-03 — Ativar `refresh_tokens` com cookie `HttpOnly`

**Justificativa:** JWT em `localStorage` é vulnerável a XSS; `refresh_tokens` já está no banco.  
**Prioridade:** Média.  
**Impacto:** Sessão renovável sem re-login; tokens roubados revogáveis.  
**Risco:** Médio — requer mudança em `authStore`, `apiFetch` e novo endpoint `/api/auth/refresh`.

---

### M-04 — Rate limiting na rota de login

**Justificativa:** `rate_limits` existe no banco; `locked_until` protege por usuário mas não por IP.  
**Prioridade:** Média.  
**Impacto:** Resistência a ataques de força bruta por IP desconhecido.  
**Risco:** Baixo — helper isolado que não altera fluxo principal.

---

### M-05 — Usar `geocode_cache` para lat/lng de clientes

**Justificativa:** A busca de coordenadas por CEP é repetida; o cache reduz chamadas externas.  
**Prioridade:** Baixa.  
**Impacto:** Mapa carrega mais rápido para clientes novos com mesmo CEP.  
**Risco:** Baixo — adição opcional ao fluxo de criação de cliente.

---

### M-06 — Versionamento de migrations no Supabase CLI

**Justificativa:** O repositório tem SQLs soltos na raiz sem sequência garantida.  
**Prioridade:** Alta.  
**Impacto:** Reprodutibilidade de ambiente, CI/CD, histórico auditável.  
**Risco:** Baixo — organização, não alteração de estrutura.

---

## 5. Refatorações Sugeridas

### R-01 — Scaffold mínimo para módulo `pre_registrations` (Leads)

Seguindo o padrão existente de `clients`:

**`src/app/api/pre-registrations/route.ts`**
```typescript
// GET — lista leads do workspace, filtrando deleted_at IS NULL
// POST — cria lead com workspace, id, timestamps
```

**`src/app/api/pre-registrations/[id]/route.ts`**
```typescript
// GET — busca por id + workspace
// PUT — atualiza (incluindo status: 'convertido' + converted_client_id)
// DELETE — soft delete via deleted_at
```

**`src/app/dashboard/leads/page.tsx`**
```typescript
// Tabela com colunas: name, tel, status, source, created_at
// Ações: editar status, converter em cliente (POST /api/clients + PUT /api/pre-registrations/:id)
// Padrão visual idêntico a /dashboard/referrals/page.tsx
```

---

### R-02 — Adicionar `workspace` ao `audit_log`

**Antes (schema atual):**
```sql
CREATE TABLE public.audit_log (
  id bigint PRIMARY KEY,
  action text NOT NULL,
  user_id text,
  ...
);
```

**Depois (migration futura):**
```sql
ALTER TABLE public.audit_log
  ADD COLUMN workspace TEXT NOT NULL DEFAULT 'principal';

CREATE INDEX idx_audit_log_workspace_created
  ON public.audit_log(workspace, created_at DESC);
```

**`src/lib/supabaseAdmin.ts` — `auditLog()`:**
```typescript
// Antes
export async function auditLog(action, meta, userId, username)

// Depois
export async function auditLog(action, meta, userId, username, workspace = 'principal')
// Gravar workspace no INSERT
```

---

### R-03 — Rate limit por IP na rota de login

**`src/app/api/auth/login/route.ts` — adicionar após validação de input:**
```typescript
// Antes: sem rate limit por IP
const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
const windowStart = new Date(Date.now() - 60_000).toISOString();

const { count } = await admin
  .from('rate_limits')
  .select('*', { count: 'exact', head: true })
  .eq('key', `login:${ip}`)
  .gte('created_at', windowStart);

if (count && count >= 10) {
  return NextResponse.json({ error: 'Muitas tentativas. Aguarde.' }, { status: 429 });
}

await admin.from('rate_limits').insert([{ key: `login:${ip}` }]);
```

---

### R-04 — Converter endpoint de visita duplicado em re-export (já aplicado no Pacote 3)

**Antes:**
```
src/app/api/visits/route.ts  → código parcial/quebrado
src/app/visits/route.ts      → implementação real
```

**Depois:**
```typescript
// src/app/visits/route.ts
export { GET, POST } from '../api/visits/route';
```

---

## 6. Documentação

### Comentários recomendados no código

| Arquivo | O que comentar |
|---------|----------------|
| `src/lib/supabaseAdmin.ts` | `// ATENÇÃO: service_role bypassa RLS. Filtrar workspace explicitamente em todas as queries.` |
| `src/middleware.ts` | `// Contexto injetado via request headers (x-user-id, x-user-role, x-workspace). Disponível em req.headers.get('x-workspace') nas rotas.` |
| `src/lib/commissionHelper.ts` | `// Geração de comissão é chamada em orders/route.ts (POST) e orders/[id]/route.ts (PUT status→pago). Não chamar diretamente de outras rotas.` |
| `src/lib/auth.ts` | `// Suporta bcrypt (padrão) e legado sha256+PBKDF2. Novas senhas sempre usam bcrypt.` |
| `src/app/api/admin/cleanup/route.ts` | `// Apaga dados por workspace e grupo. Exige PIN correto do workspace. Ordem de deleção respeita FK: visits → commissions → order_items → orders → clients.` |

### README.md — Seções a atualizar/criar

```markdown
## Variáveis de ambiente

Copie `.env.example` e preencha:

NEXT_PUBLIC_SUPABASE_URL=         # URL pública do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Chave anon (só para client público)
SUPABASE_SERVICE_ROLE_KEY=        # Chave service_role (nunca expor no client)
JWT_SECRET=                       # Secret HS256 (mínimo 32 chars aleatórios)
JWT_EXPIRES_IN=28800              # Expiração em segundos (padrão: 8h)

## Banco de dados

1. Aplique a migration incremental: `2026-04-13_visitagro_from_current_supabase_v2.sql`
2. Valide com as queries de conferência no final do arquivo SQL.
3. O workspace padrão `principal` é criado automaticamente.

## Módulos disponíveis

| Módulo | Rota dashboard | API |
|--------|---------------|-----|
| Clientes | /dashboard/clients | /api/clients |
| Produtos | /dashboard/products | /api/products |
| Vendas | /dashboard/sales | /api/orders |
| Comissões | /dashboard/commissions | /api/commissions |
| Indicadores | /dashboard/referrals | /api/referrals |
| Visitas/Mapa | /dashboard/map | /api/visits |
| Configurações | /dashboard/settings | /api/settings |
| Manutenção | /dashboard/maintenance | /api/admin/* |
| Logs | /dashboard/logs | /api/admin/logs |
```

### Fluxos principais

**Autenticação:**
1. `POST /api/auth/login` com `{ identifier, password }`
2. Middleware valida JWT via Web Crypto API (Edge Runtime) e injeta `x-user-id`, `x-user-role`, `x-workspace` nos request headers
3. Token armazenado no Zustand com persist (`localStorage`, chave `visitagropro-auth-v1`)
4. `apiFetch()` injeta `Authorization: Bearer <token>` em todas as chamadas

**Pedido com comissão:**
1. `POST /api/orders` com `{ client_id, referral_id, items[], total, status }`
2. Rota cria ordem + `order_items`
3. Se `status === 'pago'` e `referral_id` presente, chama `generateCommission()`
4. `generateCommission()` busca referral e client pelo mesmo workspace, cria registro em `commissions`

**Check-in no mapa:**
1. `InteractiveMap` obtém geolocalização do device
2. `POST /api/visits` com `{ client_id, checkin: true, client_status, lat, lng, next_visit_date? }`
3. Rota cria visita com `status: 'realizado'`, atualiza `clients.status`, opcionalmente cria próxima visita agendada
4. Componente recarrega clientes e visitas após sucesso

---

## 7. Changelog das Atualizações

### [0.9.4] — 2026-04-14

#### Migration incremental aplicada ao Supabase

- **Adicionado:** Tabela `public.workspaces` com backfill automático de todos os valores `workspace` existentes
- **Adicionado:** FK `workspace → workspaces(id)` em todas as tabelas tenantadas (dinâmico por loop sobre `BASE TABLE`)
- **Adicionado:** `deleted_at TIMESTAMPTZ` em `clients`, `products`, `referrals`, `orders`, `visits`, `km_logs`
- **Adicionado:** `version INTEGER DEFAULT 0` em `orders` com trigger `check_order_version()`
- **Adicionado:** Sequência `order_number_seq` com trigger `set_order_number()` e índice único por workspace
- **Adicionado:** Tabelas `geocode_cache` e `refresh_tokens`
- **Adicionado:** Trigger `update_updated_at()` em todas as tabelas com coluna `updated_at`
- **Adicionado:** Funções `get_current_user_id()`, `get_current_workspace()`, `is_admin()`
- **Adicionado:** RLS com policies SELECT/INSERT/UPDATE/DELETE por workspace nas tabelas tenantadas
- **Adicionado:** Checks de integridade: `quantity > 0`, `unit_price >= 0`, `total >= 0`, `commission_pct 0–100`, `version >= 0`
- **Corrigido:** Loop de backfill filtra apenas `BASE TABLE` (evita erro em views como `comissoes_pendentes`)
- **Adicionado:** Índices compostos em clients, orders, products, referrals, commissions, visits, photos, users

#### Pacote 1 — Correções críticas de runtime

- **Corrigido:** `src/app/api/products/route.ts` — restaurado para operar `products` (estava com código de `visits`)
- **Corrigido:** `src/app/api/products/[id]/route.ts` — workspace, deleted_at, soft delete via DELETE
- **Corrigido:** `middleware.ts` — propagação de contexto via request headers
- **Corrigido:** `src/app/api/orders/route.ts` — removido `payment_type` do payload, validação de items, workspace dinâmico
- **Corrigido:** `src/lib/commissionHelper.ts` — workspace vindo da order, não hardcoded `'principal'`
- **Corrigido:** `src/app/dashboard/sales/page.tsx` — removido `payment_type` do estado, validação de item vazio

#### Pacote 2 — Multi-tenant em clients, referrals, settings, admin

- **Corrigido:** `src/app/api/clients/route.ts` — workspace, deleted_at IS NULL em listagem
- **Corrigido:** `src/app/api/clients/[id]/route.ts` — DELETE físico → soft delete via `deleted_at`
- **Corrigido:** `src/app/api/referrals/route.ts` e `[id]/route.ts` — workspace dinâmico, soft delete
- **Corrigido:** `src/app/api/settings/route.ts` — workspace dinâmico (não mais hardcoded `'principal'`)
- **Corrigido:** `src/app/api/settings/company/route.ts` — upsert de settings por workspace
- **Corrigido:** `src/app/api/admin/pin/route.ts` — PIN por workspace
- **Corrigido:** `src/app/api/admin/reprocess/route.ts` — reprocessamento de comissões por workspace

#### Pacote 3 — Visits e cleanup seguro

- **Corrigido:** `src/app/api/visits/route.ts` — implementação real de visits com workspace, checkin, next_visit
- **Corrigido:** `src/app/visits/route.ts` — convertido em re-export para evitar deriva
- **Corrigido:** `src/app/api/admin/cleanup/route.ts` — escopo por workspace, ordem de deleção por FK, PIN por workspace

#### Pacote 4 — Categories, commissions, orders/[id]

- **Corrigido:** `src/app/api/categories/route.ts` — workspace dinâmico
- **Corrigido:** `src/app/api/commissions/route.ts` e `[id]/route.ts` — workspace, validação de status
- **Corrigido:** `src/app/api/orders/[id]/route.ts` — workspace, deleted_at, versioning, geração automática de comissão na transição de status

#### Pacote 5 — Hardening de concorrência e segurança

- **Adicionado:** `src/lib/requestContext.ts` — helper `getRequestContext(req)`
- **Corrigido:** `src/app/api/orders/[id]/route.ts` — `version` obrigatório no PUT, 409 em conflito de versão
- **Corrigido:** `src/app/dashboard/sales/page.tsx` — `changeStatus` envia `version`; removido payment_type
- **Corrigido:** `src/app/auth/login/page.tsx` — credenciais de demonstração removidas da UI
- **Corrigido:** `src/app/api/cep/[cep]/route.ts` — validação de CEP, tratamento de erros, `next: { revalidate: 86400 }`

#### Pacote 6 — Troca de senha e logs

- **Corrigido:** `src/app/api/auth/change-password/route.ts` — usa `getRequestContext`, valida workspace do usuário
- **Corrigido:** `src/app/api/admin/logs/route.ts` — restrito a `role === 'admin'`, limite configurável

#### Pacote 7 — Auth, helpers e dashboards

- **Corrigido:** `src/app/api/auth/login/route.ts` — reaproveitamento de `getAdmin()`, `failed_logins`, `locked_until`, `last_login`
- **Corrigido:** `src/lib/supabaseAdmin.ts` — `server-only`, tipagem melhorada, `auditLog` com username
- **Corrigido:** `src/lib/auth.ts` — tipagem de `AuthTokenPayload`, suporte explícito a legado sha256
- **Corrigido:** `src/lib/apiFetch.ts` — não força `Content-Type: application/json` em FormData; helper `apiFetchJson<T>`
- **Corrigido:** `src/store/authStore.ts` — tipagem de `AuthUser`, método `updateUser`
- **Melhorado:** `src/components/map/InteractiveMap.tsx` — tratamento de erro de check-in, recarga pós-check-in
- **Melhorado:** dashboards — tratamento de erro explícito nos removes e changeStatus

---

## 8. Testes

O repositório não possui cobertura de testes. Estratégia recomendada por camada:

### 8.1 — API Routes (Vitest + `next-test-api-route-handler`)

```
tests/
├── api/
│   ├── auth/
│   │   ├── login.test.ts
│   │   └── change-password.test.ts
│   ├── orders/
│   │   ├── orders.test.ts       (GET, POST)
│   │   └── orders-id.test.ts    (PUT com version, DELETE soft)
│   ├── clients/
│   │   └── clients-id.test.ts   (DELETE → soft delete)
│   └── commissions/
│       └── commissions-id.test.ts
```

**Casos de teste prioritários:**

| Cenário | O que assertar |
|---------|---------------|
| Login com usuário válido | Retorna `{ user, token }` com status 200 |
| Login com senha errada | Status 401; incrementa `failed_logins` |
| Login com usuário bloqueado | Status 423 |
| POST /api/orders com item sem product_id | Status 400 |
| PUT /api/orders/:id sem `version` | Status 409 |
| PUT /api/orders/:id com version desatualizada | Status 409 (trigger do banco) |
| DELETE /api/clients/:id | Status 200; cliente tem `deleted_at` não nulo; não aparece na listagem |
| GET /api/products | Retorna `{ products: [] }` (não `{ visits: [] }`) |
| GET /api/admin/logs com role=user | Status 403 |
| POST /api/visits com checkin=true | Cria visita e atualiza `clients.status` |

### 8.2 — Zustand store (Vitest)

```typescript
// tests/store/authStore.test.ts
describe('authStore', () => {
  it('login seta user, token e isAuthenticated=true')
  it('logout limpa user, token e isAuthenticated=false')
  it('updateUser atualiza parcialmente sem perder campos')
  it('persiste em localStorage com chave visitagropro-auth-v1')
})
```

### 8.3 — Utilitários (Vitest)

```typescript
// tests/lib/auth.test.ts
describe('verifyPassword', () => {
  it('retorna true para bcrypt correto')
  it('retorna false para bcrypt incorreto')
  it('retorna true para legado sha256 correto')
  it('retorna false para formato desconhecido')
})

describe('generateToken / verifyToken', () => {
  it('gera token com payload correto')
  it('verifyToken retorna null para token expirado')
  it('verifyToken retorna null para assinatura inválida')
})
```

---

## 9. Próximos Passos

### Imediatos (críticos)

1. **Validar migration em staging** antes de qualquer deploy em produção — especialmente a criação de `workspaces`, FKs e triggers.
2. **Testar os 7 pacotes de patches** na ordem documentada no Pacote 7.
3. **Verificar `orders.payment_type`** — a coluna existe no schema v0.9.4; decidir se reativa o campo na UI ou mantém removido.
4. **Confirmar que `x-workspace` chega nas rotas** após o patch do middleware — logar temporariamente em uma rota de teste.

### Médio prazo

5. **Implementar módulo de Leads** (`pre_registrations`) — tabela pronta, scaffold no Pacote R-01.
6. **Adicionar `workspace` em `audit_log`** — migration simples, alto impacto em compliance multi-tenant.
7. **Criar trilha de migrations versionada** (`supabase/migrations/`) substituindo os SQLs soltos na raiz.
8. **Implementar testes** — começar pelos API Routes de auth e orders (maior risco).
9. **Rate limiting** na rota de login usando a tabela `rate_limits` existente.

### Longo prazo

10. **`refresh_tokens`** — implementar fluxo completo com cookie `HttpOnly` e endpoint de renovação.
11. **Módulo `km_logs`** — CRUD de quilometragem para representantes de campo.
12. **Módulo `environments`** — gerenciamento de áreas de fazenda vinculadas a clientes/pedidos.
13. **Particionamento** de `audit_log`, `rate_limits` e `visits` quando volume crescer.
14. **PostGIS ou `earthdistance`** para consultas geográficas mais eficientes no mapa.
15. **CI/CD** com `supabase db diff` para validar migrations automaticamente em PR.

---

## 10. Recomendações Adicionais

### Segurança

| Item | Status | Recomendação |
|------|--------|--------------|
| JWT em localStorage | ⚠️ Aceito | Migrar para cookie HttpOnly quando `refresh_tokens` for ativado |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Servidor | Nunca expor no client; `server-only` aplicado em `supabaseAdmin.ts` |
| Credenciais demo na tela de login | ✅ Removidas (Pacote 5) | — |
| `bcrypt` rounds | ✅ 12 | Adequado para 2026 |
| Legado `sha256` | ⚠️ Mantido | Marcar usuários e forçar troca de senha na próxima autenticação |
| `locked_until` em users | ✅ Implementado | Complementar com rate limit por IP (P-09) |
| RLS no Supabase | ⚠️ Ativa mas bypassa | `service_role` ignora policies; manter filtros de workspace explícitos como defesa primária |
| Secrets em `.env.example` | ✅ Placeholders | Não colocar valores reais |

### Performance

| Item | Recomendação |
|------|-------------|
| Leaflet bundle | Manter `dynamic import` com `ssr: false`; não carregar no server |
| Markers no mapa | Limitar a ≤500 clientes visíveis; implementar clustering se crescer |
| Queries Supabase | Evitar `SELECT *` em tabelas grandes; selecionar colunas explícitas (já feito nos patches) |
| `deleted_at` indexes | Criar índices parciais `WHERE deleted_at IS NULL` nas tabelas com soft delete (já incluído na migration) |
| `apiFetch` no dashboard | `Promise.all` no dashboard principal reduz waterfall; manter padrão atual |

### Zustand

| Item | Recomendação |
|------|-------------|
| `authStore` | Pequeno e focado — não adicionar estado de domínio (clientes, pedidos) aqui |
| Persistência | Chave `visitagropro-auth-v1`; se mudar o shape de `AuthUser`, incrementar versão ou adicionar `migrate` |
| Seletores | Usar seletores com função (`useAuthStore(s => s.user)`) em vez de desestruturar o store inteiro para evitar re-renders |
| Estado de servidor | Não duplicar dados do banco no Zustand; usar apenas para sessão/UI local |

---

*Auditoria gerada a partir do schema `v0.9.4` confirmado via `schema_atual_v094.sql`, dos Pacotes de correção 1–7 e da migration incremental `2026-04-13_visitagro_from_current_supabase_v2.sql`, todos produzidos nesta sessão de trabalho.*

## 🔗 Voltar

- [📖 Central da documentação](./index.md)
- [🌱 README principal](../README.md)
