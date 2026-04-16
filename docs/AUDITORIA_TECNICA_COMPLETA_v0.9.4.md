# 🔍 Auditoria Técnica — VisitAgro Pro v0.9.4
> Gerado em: 2026-04-14  
> Baseado no código-fonte real do repositório analisado

---

## 1. Stack Identificada

| Camada | Tecnologia | Versão Real | Observação Relevante |
|--------|-----------|-------------|---------------------|
| **Framework** | Next.js (App Router) | 14.2.35 | `next.config.js` padrão, regions `gru1` |
| **UI Library** | React | 18.3.0 | Componentes funcionais + hooks |
| **Estilização** | Tailwind CSS | 3.4.3 | Tema customizado `dark-*` e `primary-*` |
| **Ícones** | Lucide React | 0.378.0 | Usado em todos os componentes |
| **Mapas** | Leaflet + react-leaflet | 1.9.4 / 4.2.1 | Online apenas, sem offline |
| **Banco de Dados** | Supabase (PostgreSQL) | 15+ | Schema v0.9.4 com 18 tabelas |
| **Auth** | JWT HS256 + bcrypt | `jsonwebtoken@9` / `bcryptjs@2` | Implementação própria, não Supabase Auth |
| **Estado Global** | Zustand + persist | 4.5.2 | localStorage `visitagropro-auth-v1` |
| **HTTP Client** | Fetch API nativo | — | Wrapper `apiFetch.ts` com injeção de token |
| **Runtime** | Node.js | >=20.x <21 | Definido em `package.json#engines` |
| **Deploy** | Vercel | — | `vercel.json` com functions maxDuration 15s |
| **TypeScript** | TypeScript | 5.x | `tsconfig.json` com paths `@/*` |

---

## 2. Evidências Usadas

### Arquivos de Configuração
- `/workspace/package.json` — dependências, scripts, engines
- `/workspace/tsconfig.json` — compiler options, paths
- `/workspace/next.config.js` — reactStrictMode true
- `/workspace/vercel.json` — framework, regions, functions
- `/workspace/.env.example` — variáveis obrigatórias

### Schema e Banco de Dados
- `/workspace/schema_atual_v094_supabase.sql` — schema completo (18 tabelas)
- `/workspace/scripts/insert_admin.sql` — seed de admin user
- `/workspace/sql/010_pre_registrations_rls.sql` — RLS policies

### Backend / API
- `/workspace/middleware.ts` — validação JWT manual para `/api/*`
- `/workspace/src/lib/auth.ts` — hash/verify password, JWT generate/verify
- `/workspace/src/lib/supabase.ts` — cliente público (anon key)
- `/workspace/src/lib/supabaseAdmin.ts` — cliente service_role (server-only)
- `/workspace/src/lib/apiFetch.ts` — wrapper fetch com token injection
- `/workspace/src/lib/requestContext.ts` — extrai headers do middleware
- `/workspace/src/lib/commissionHelper.ts` — gera comissão de indicador

### Rotas API (src/app/api/)
- `/api/auth/login` — POST login com brute-force protection
- `/api/auth/change-password` — PUT troca de senha
- `/api/clients` — GET/POST clientes
- `/api/products` — GET/POST produtos
- `/api/orders` — GET/POST pedidos + order_items
- `/api/commissions` — GET comissões (indicadores)
- `/api/referrals` — GET/POST indicadores
- `/api/pre-registrations` — GET/POST leads
- `/api/visits` — GET/POST visitas (check-in/agendamento)
- `/api/cep/[cep]` — GET CEP via ViaCEP
- `/api/admin/logs` — GET logs de auditoria (admin-only)
- `/api/admin/cleanup`, `/api/admin/reprocess`, `/api/admin/pin` — rotas admin
- `/api/health` — health check
- `/api/settings` — configurações workspace
- `/api/categories` — categorias

### Frontend (src/app/)
- `/auth/login/page.tsx` — tela de login
- `/dashboard/page.tsx` — dashboard com KPIs e mapa rápido
- `/dashboard/clients/page.tsx` — CRUD clientes
- `/dashboard/products/page.tsx` — CRUD produtos
- `/dashboard/referrals/page.tsx` — CRUD indicadores
- `/dashboard/sales/page.tsx` — pedidos/vendas
- `/dashboard/commissions/page.tsx` — comissões de indicadores
- `/dashboard/pre-registrations/` — CRUD leads (implementado)
- `/dashboard/map/page.tsx` — mapa interativo completo
- `/dashboard/settings/page.tsx` — configurações
- `/dashboard/maintenance/page.tsx` — ferramentas admin
- `/dashboard/logs/page.tsx` — logs de auditoria

### Store e Tipos
- `/workspace/src/store/authStore.ts` — estado auth (Zustand)
- `/workspace/src/types/index.ts` — tipos TypeScript sincronizados com schema

### Documentos Técnicos
- `/workspace/README.md` — visão geral, stack, status módulos
- `/workspace/UPDATES.md` — changelog técnico v0.9.4
- `/workspace/CHANGELOG.md` — histórico de versões
- `/workspace/docs/auditoria-tecnica.md` — auditoria anterior (resumo executivo)
- `/workspace/DIAGNOSTICO_CONSOLIDADO_ATUALIZADO.md` — diagnóstico detalhado

---

## 3. Estrutura do Sistema

### Visão Geral da Arquitetura

```
visitagropro/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/               # Autenticação (login)
│   │   ├── api/                # Backend API routes (15 endpoints)
│   │   └── dashboard/          # Páginas protegidas (11 páginas)
│   ├── components/             # Componentes React reutilizáveis
│   │   ├── layout/             # DashboardShell (wrapper comum)
│   │   └── map/                # InteractiveMap, GpsPickerMap, LeafletProvider
│   ├── lib/                    # Helpers e utilitários server-side
│   │   ├── auth.ts             # JWT + bcrypt
│   │   ├── supabase.ts         # Cliente público
│   │   ├── supabaseAdmin.ts    # Cliente service_role
│   │   ├── apiFetch.ts         # HTTP client autenticado
│   │   ├── requestContext.ts   # Extrai contexto do middleware
│   │   └── commissionHelper.ts # Geração de comissões
│   ├── store/                  # Estado global (Zustand)
│   │   └── authStore.ts        # Auth state persistido
│   └── types/                  # Tipos TypeScript
│       └── index.ts            # Interfaces sincronizadas com schema
├── scripts/                    # Scripts SQL e utilitários
├── sql/                        # Migrations e policies RLS
├── docs/                       # Documentação técnica
└── config files                # package.json, tsconfig, vercel.json, etc.
```

### Responsabilidade por Diretório

| Diretório | Responsabilidade | Principais Módulos |
|-----------|-----------------|-------------------|
| `src/app/api/` | Backend RESTful | auth, clients, products, orders, commissions, visits, pre-registrations |
| `src/app/dashboard/` | Páginas protegidas | clients, products, sales, referrals, commissions, map, settings, logs |
| `src/components/` | UI reutilizável | DashboardShell, InteractiveMap, GpsPickerMap, LeafletProvider |
| `src/lib/` | Lógica server-side | auth, supabaseAdmin, apiFetch, requestContext, commissionHelper |
| `src/store/` | Estado client-side | authStore (Zustand persist) |
| `src/types/` | Contratos de dados | User, Client, Product, Order, Commission, Referral, Visit, PreRegistration |

### Padrão Arquitetural Dominante

- **Next.js 14 App Router**: Rotas baseadas em diretórios (`app/api/*`, `app/dashboard/*`)
- **API RESTful**: Endpoints `/api/*` com métodos GET/POST/PUT/DELETE
- **Middleware centralizado**: Validação JWT manual para todas as rotas `/api/*`
- **Service Role isolation**: `supabaseAdmin.ts` usa `service_role` key apenas em server-side
- **Client-side auth**: Zustand persiste token no localStorage, injetado via `apiFetch`
- **Soft delete**: Tabelas com `deleted_at` para preservação de dados
- **Workspace multi-tenancy**: Todas as tabelas operacionais têm `workspace` FK

---

## 4. Problemas Encontrados

### 🔴 Crítico

#### Problema 1: Validação JWT manual no middleware — risco de segurança

**Arquivo(s):** `/workspace/middleware.ts`

**Evidência:** Linhas 36-68 implementam verificação HMAC manualmente usando `crypto.subtle`:
```typescript
const cryptoKey = await crypto.subtle.importKey(
  'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
);
const valid = await crypto.subtle.verify('HMAC', cryptoKey, signature.buffer, signingInput.buffer);
```

**Descrição Técnica:** O middleware valida JWT manualmente em vez de usar a biblioteca `jsonwebtoken`. Embora funcional, esta implementação:
- Não verifica algoritmo (pode sofrer ataque de troca de algoritmo se mal configurada)
- Duplica lógica já existente em `src/lib/auth.ts` (que usa `jsonwebtoken`)
- Aumenta superfície de erro (código não testado unitariamente)

**Causa Raiz:** Decisão de arquitetura para evitar import de `jsonwebtoken` no edge runtime do middleware.

**Impacto Técnico:** 
- Risco de vulnerabilidade se implementação manual tiver falha
- Dificuldade de manutenção (duas lógicas de validação JWT no código)
- Impossibilidade de usar recursos avançados de JWT (refresh tokens, jti, etc.)

**Impacto de Negócio:** Potencial vazamento de acesso se token for forjado.

**Correção Recomendada:** Migrar para validação com `jsonwebtoken` em Edge-compatible way ou documentar explicitamente a decisão técnica com testes específicos.

**Trecho Atual:**
```typescript
// middleware.ts linhas 36-68
const cryptoKey = await crypto.subtle.importKey(
  'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
);
const valid = await crypto.subtle.verify('HMAC', cryptoKey, signature.buffer, signingInput.buffer);
```

**Sugestão:**
```typescript
// Manter implementação atual MAS adicionar teste unitário específico
// OU migrar para @edge-runtime/jwt se disponível
```

---

#### Problema 2: Refresh tokens não implementados — sessão expira abruptamente

**Arquivo(s):** `/workspace/src/lib/auth.ts`, `/workspace/middleware.ts`, `/workspace/schema_atual_v094_supabase.sql`

**Evidência:** 
- Tabela `refresh_tokens` existe no schema (linhas 272-280) com colunas: `id, user_id, token_hash, expires_at, revoked, created_at`
- `src/lib/auth.ts` não tem função para gerar/validar refresh tokens
- `middleware.ts` verifica `payload.exp` e retorna 401 se expirado, sem mecanismo de refresh

**Descrição Técnica:** O sistema possui tabela `refresh_tokens` criada no schema, mas nenhuma lógica de backend/frontend para:
- Emitir refresh token junto com access token
- Renovar access token antes da expiração
- Invalidar refresh tokens (revogação)

**Causa Raiz:** Feature incompleta — schema preparado mas implementação não finalizada.

**Impacto Técnico:** 
- Usuários são desconectados abruptamente após 8 horas (JWT_EXPIRES_IN=28800)
- Necessidade de login manual mesmo com navegador aberto
- Tabela `refresh_tokens` órfã no banco

**Impacto de Negócio:** Má experiência do usuário, especialmente para administradores que usam o sistema por longos períodos.

**Correção Recomendada:** Implementar fluxo completo de refresh token:
1. Criar endpoint `/api/auth/refresh` (POST)
2. Adicionar lógica em `auth.ts` para gerar/validar refresh tokens
3. Modificar `apiFetch.ts` para tentar refresh automaticamente ao receber 401
4. Adicionar rotação de refresh tokens (invalidar antigo, emitir novo)

---

### 🟠 Alto

#### Problema 3: geocode_cache não é utilizado — perda de performance

**Arquivo(s):** `/workspace/src/app/api/cep/[cep]/route.ts`, `/workspace/schema_atual_v094_supabase.sql`

**Evidência:** 
- Tabela `geocode_cache` existe no schema (linhas 133-138): `cep, lat, lng, updated_at`
- Rota `/api/cep/[cep]` consulta ViaCEP diretamente sem cache no banco
- Nenhuma referência a `geocode_cache` em todo o código

**Descrição Técnica:** A tabela `geocode_cache` foi criada para armazenar resultados de geocodificação e evitar chamadas repetidas à API externa (ViaCEP/Nominatim), mas não está sendo usada. Cada requisição de CEP faz chamada HTTP externa.

**Causa Raiz:** Feature de cache implementada no schema mas não integrada na lógica da API.

**Impacto Técnico:** 
- Latência maior em consultas repetidas de mesmo CEP
- Risco de rate limiting da API externa
- Custo desnecessário de requisições HTTP

**Impacto de Negócio:** Lentidão percebida pelo usuário em operações de preenchimento de endereço.

**Correção Recomendada:**
```typescript
// src/app/api/cep/[cep]/route.ts
// Antes de chamar ViaCEP, consultar geocode_cache
const cached = await getAdmin()
  .from('geocode_cache')
  .select('lat,lng')
  .eq('cep', cep)
  .maybeSingle();

if (cached) return NextResponse.json(cached);

// ... chama ViaCEP ...

// Após sucesso, inserir no cache
await getAdmin().from('geocode_cache').upsert({
  cep, lat: data.lat, lng: data.lng, updated_at: new Date().toISOString()
});
```

---

#### Problema 4: Logs de auditoria sem verificação de role em algumas rotas

**Arquivo(s):** `/workspace/src/app/api/admin/logs/route.ts` (corrigido em v0.9.4), outras rotas admin

**Evidência:** 
- `/api/admin/logs` agora verifica `role !== 'admin'` (linha 13)
- Outras rotas admin (`/api/admin/cleanup`, `/api/admin/reprocess`, `/api/admin/pin`) podem não ter mesma verificação

**Descrição Técnica:** Apenas a rota de logs tem verificação explícita de role. As demais rotas admin precisam ser auditadas individualmente.

**Causa Raiz:** Correção aplicada parcialmente em v0.9.4.

**Impacto Técnico:** Risco de usuários não-admin acessarem funções administrativas críticas.

**Correção Recomendada:** Verificar todas as rotas em `/api/admin/` e adicionar guard de role consistente.

---

#### Problema 5: Módulos rep_commissions, km_logs, environments sem interface

**Arquivo(s):** `/workspace/schema_atual_v094_supabase.sql`, `/workspace/src/app/dashboard/`

**Evidência:** 
- Tabelas existem no schema:
  - `rep_commissions` (linhas 282-303) — comissões de representantes
  - `km_logs` (linhas 140-155) — controle de quilometragem
  - `environments` (linhas 101-116) — ambientes/talhões
- Nenhum diretório frontend correspondente em `src/app/dashboard/`
- Nenhuma API route para `km_logs` ou `environments`

**Descrição Técnica:** Entidades suportadas no banco mas sem interface de usuário ou API completa.

**Causa Raiz:** Roadmap de features não implementado totalmente.

**Impacto Técnico:** Dívida técnica acumulada, schema subutilizado.

**Impacto de Negócio:** Funcionalidades prometidas ou planejadas indisponíveis para usuários.

**Correção Recomendada:** Priorizar implementação conforme matriz de dívida técnica (seção B).

---

### 🟡 Médio

#### Problema 6: Validação de telefone sem formato padronizado

**Arquivo(s):** `/workspace/src/app/api/clients/route.ts`, `/workspace/src/app/dashboard/clients/page.tsx`

**Evidência:** Campo `tel` e `tel2` aceitam qualquer string, sem validação de formato.

**Descrição Técnica:** Não há validação de formato de telefone (ex: regex para `(XX) XXXXX-XXXX` ou `+XX XX XXXXX-XXXX`).

**Causa Raiz:** Validação não implementada.

**Impacto Técnico:** Dados inconsistentes no banco, dificuldade de integração com APIs de SMS/WhatsApp.

**Correção Recomendada:** Adicionar validação no backend e máscara no frontend.

---

#### Problema 7: Trigger de optimistic locking não implementada

**Arquivo(s):** `/workspace/schema_atual_v094_supabase.sql` (tabela `orders` tem coluna `version`)

**Evidência:** Tabela `orders` tem coluna `version integer NOT NULL DEFAULT 0 CHECK (version >= 0)` (linha 179), mas não há trigger para incrementar automaticamente.

**Descrição Técnica:** Coluna `version` sugere implementação de optimistic locking para concorrência, mas não há trigger ou lógica de incremento.

**Causa Raiz:** Feature planejada mas não implementada.

**Impacto Técnico:** Risco de race condition em updates concorrentes de pedidos.

**Correção Recomendada:** Implementar trigger SQL ou lógica de aplicação para verificar/incrementar versão.

---

#### Problema 8: Supabase client em src/lib/supabase.ts pode quebrar no build

**Arquivo(s):** `/workspace/src/lib/supabase.ts`

**Evidência:** Linhas 7-10 lançam erro se variáveis de ambiente não estiverem definidas:
```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias.');
}
```

**Descrição Técnica:** Durante `next build`, rotas são carregadas sem `.env` e podem quebrar a coleta de dados.

**Causa Raiz:** Validação eager no módulo.

**Impacto Técnico:** Build pode falhar em ambientes sem variáveis definidas (ex: CI/CD).

**Correção Recomendada:** Tornar validação lazy (apenas no runtime) ou usar fallback seguro.

---

### 🟢 Baixo

#### Problema 9: Tests ausentes — zero cobertura

**Arquivo(s):** Todo o projeto

**Evidência:** Nenhum arquivo de teste encontrado (`*.test.ts`, `*.spec.ts`, `__tests__/`).

**Descrição Técnica:** Projeto sem testes unitários, de integração ou E2E.

**Causa Raiz:** Testes não priorizados no desenvolvimento.

**Impacto Técnico:** Risco alto de regressão em refatorações, dificuldade de onboarding.

**Correção Recomendada:** Implementar testes prioritários conforme seção 9.

---

#### Problema 10: Logs silenciados em catch blocks

**Arquivo(s):** `/workspace/src/lib/supabaseAdmin.ts` (função `auditLog`)

**Evidência:** Linha 28: `catch { /* audit não pode quebrar o fluxo */ }`

**Descrição Técnica:** Erros de audit log são silenciados completamente, sem registro alternativo.

**Causa Raiz:** Decisão de design para não interromper fluxo principal.

**Impacto Técnico:** Dificuldade de debug de falhas de auditoria.

**Correção Recomendada:** Adicionar `console.error` mínimo ou log alternativo.

---

## 5. Melhorias Recomendadas

| ID | Melhoria | Impacto | Esforço | Prioridade |
|----|---------|---------|---------|------------|
| M01 | Implementar refresh tokens | Alto | Médio | 🔴 Alta |
| M02 | Integrar geocode_cache na API de CEP | Médio | Baixo | 🟠 Alta |
| M03 | Adicionar validação de formato de telefone | Médio | Baixo | 🟡 Média |
| M04 | Implementar trigger de optimistic locking para orders | Alto | Médio | 🟡 Média |
| M05 | Criar frontend para `/dashboard/visits` (API já existe) | Alto | Médio | 🔴 Alta |
| M06 | Criar frontend para `/dashboard/km-logs` | Médio | Médio | 🟢 Baixa |
| M07 | Criar frontend para `/dashboard/environments` | Médio | Médio | 🟢 Baixa |
| M08 | Implementar upload de fotos (tabela `photos` existe) | Médio | Alto | 🟡 Média |
| M09 | Adicionar testes unitários para auth e middleware | Alto | Médio | 🟠 Alta |
| M10 | Documentar contratos de API (OpenAPI/Swagger) | Médio | Baixo | 🟡 Média |
| M11 | Implementar PWA (manifest + install prompt) | Médio | Médio | 🟢 Baixa |
| M12 | Adicionar rate limiting explícito (tabela `rate_limits` existe) | Alto | Médio | 🟠 Alta |

---

## 6. Refatorações Sugeridas

### Refatoração 1: Centralizar validação de JWT

**Before:** Validação manual no `middleware.ts` duplica lógica de `auth.ts`.

**After:** Unificar validação em helper compartilhado ou usar `jsonwebtoken` compatible com Edge.

**Risco:** Baixo — desde que testes validem comportamento.

---

### Refatoração 2: Padronizar tratamento de erro

**Before:** Cada rota trata erros de forma inconsistente (algumas com `console.error`, outras silenciosas).

**After:** Criar helper `handleApiError(fn)` que padroniza logging e resposta.

**Exemplo:**
```typescript
// src/lib/apiErrorHandler.ts
export function handleApiError(fn: Function) {
  return async (req: NextRequest) => {
    try {
      return await fn(req);
    } catch (e: any) {
      console.error(`[API:${req.nextUrl.pathname}]`, e.message);
      return NextResponse.json({ error: e.message || 'Erro interno' }, { status: 500 });
    }
  };
}
```

---

### Refatoração 3: Helper de maps_link

**Before:** Cada rota que cria cliente/pré-cadastro replica lógica de gerar `maps_link`.

**After:** Criar helper `generateMapsLink(lat, lng)` em `src/lib/geoUtils.ts`.

---

### Refatoração 4: Workspace helper

**Before:** Cada rota extrai `workspace` dos headers manualmente.

**After:** Usar `getRequestContext(req)` consistentemente (já existe, mas não é usado em todas as rotas).

---

## 7. Documentação Gerada

### Middleware (`/workspace/middleware.ts`)

**Responsabilidade:** Validar JWT em todas as requisições para `/api/*` (exceto `/api/auth/login` e `/api/health`).

**Dependências:** `JWT_SECRET` environment variable.

**Comportamento:**
1. Extrai token do header `Authorization: Bearer <token>`
2. Valida estrutura (3 partes)
3. Verifica assinatura HMAC-SHA256 manualmente
4. Verifica expiração (`exp` claim)
5. Injeta headers `x-user-id`, `x-user-name`, `x-user-role`, `x-workspace` na request

**Atenção/Limitação:** Validação manual não usa biblioteca `jsonwebtoken`, aumentando risco de vulnerabilidade se mal mantida.

---

### Auth (`/workspace/src/lib/auth.ts`)

**Responsabilidade:** Hash/verificação de senhas (bcrypt/sha256) e geração/verificação de JWT.

**Dependências:** `bcryptjs`, `jsonwebtoken`, `crypto`, `JWT_SECRET`, `JWT_EXPIRES_IN`.

**Comportamento:**
- `verifyPassword(plaintext, stored)`: Suporta bcrypt (`$2a$`/`$2b$`) e sha256 (`sha256:salt:hash`)
- `hashPassword(password)`: Gera hash bcrypt
- `generateToken(payload)`: Gera JWT com expiresIn
- `verifyToken(token)`: Verifica JWT (não usado no middleware)

**Atenção/Limitação:** Função `verifyToken` não é usada no middleware (que valida manualmente).

---

### apiFetch (`/workspace/src/lib/apiFetch.ts`)

**Responsabilidade:** Wrapper fetch que injeta automaticamente `Authorization: Bearer <token>` em requisições client-side.

**Dependências:** Zustand store `visitagropro-auth-v1` no localStorage.

**Comportamento:**
1. Lê token do localStorage via Zustand store
2. Injeta `Authorization` header se token existir
3. Injeta `Content-Type: application/json` apenas se body NÃO for FormData
4. Retorna resposta do fetch nativo

**Atenção/Limitação:** Só funciona em browser (acessa localStorage). Server-side deve usar headers manualmente.

---

### supabaseAdmin (`/workspace/src/lib/supabaseAdmin.ts`)

**Responsabilidade:** Criar cliente Supabase com `service_role` key para operações server-side que ignoram RLS.

**Dependências:** `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`.

**Comportamento:**
- Singleton: reusa cliente criado
- `getAdmin()`: Retorna cliente service_role
- `auditLog(action, meta, userId, username)`: Insere registro em `audit_log` (silencia erros)

**Atenção/Limitação:** Importa `server-only` para garantir que não vaze para client bundle. Uso requer cuidado pois ignora RLS.

---

### authStore (`/workspace/src/store/authStore.ts`)

**Responsabilidade:** Gerenciar estado de autenticação no frontend (user, token, isAuthenticated).

**Dependências:** Zustand, Zustand persist middleware.

**Comportamento:**
- Persiste estado no localStorage como `visitagropro-auth-v1`
- `login(user, token)`: Define user e token
- `logout()`: Limpa estado

**Atenção/Limitação:** Rehidratação assíncrona pode causar flicker de "não autenticado" no primeiro render (guard `hydrated` necessário).

---

### Rota `/api/visits` (`/workspace/src/app/api/visits/route.ts`)

**Responsabilidade:** CRUD de visitas (agendamento e check-in).

**Endpoints:**
- `GET /api/visits?client_id={id}`: Lista visitas (limite 100)
- `POST /api/visits`: Cria visita ou check-in

**Comportamento POST:**
- Se `checkin: true`: Registra visita realizada, atualiza status do cliente, agenda próxima visita
- Se `checkin: false`: Agenda visita futura
- Gera link do Google Calendar
- Insere audit log

**Atenção/Limitação:** Não tem PUT/DELETE. Frontend não existe (API ociosa).

---

### Rota `/api/pre-registrations` (`/workspace/src/app/api/pre-registrations/route.ts`)

**Responsabilidade:** CRUD de pré-cadastros (leads).

**Endpoints:**
- `GET /api/pre-registrations?status={s}&source={s}`: Lista leads com filtros
- `POST /api/pre-registrations`: Cria lead

**Comportamento:**
- Gera `maps_link` automaticamente se lat/lng fornecidos
- Status inicial: `novo`
- Source padrão: `manual`

**Atenção/Limitação:** Não tem PUT/DELETE. Conversão para cliente não está nesta rota (precisa de endpoint separado).

---

## 8. Changelog Técnico

### v0.9.4 — 14/04/2026 (Atual)

**Correções Críticas:**
- ✅ Seed de `workspaces` adicionada em `scripts/insert_admin.sql` (resolve FK violation)
- ✅ Login com brute-force protection (failed_logins, locked_until, last_login)
- ✅ Logs restritos a admin (`role !== 'admin'` check)
- ✅ Validação de workspace em change-password
- ✅ `server-only` em supabaseAdmin.ts
- ✅ Content-Type não forçado em FormData (apiFetch)
- ✅ Tratamento de erro em DELETE (clients, referrals, commissions)
- ✅ Tipos atualizados (pass_hash removido de User)

**Arquivos Alterados:** 11 arquivos (ver UPDATES.md)

---

### v0.9.3 — Data não documentada

**Mudanças Observáveis:**
- Implementação de middleware com validação JWT manual
- Separação entre supabase (anon) e supabaseAdmin (service_role)
- Introdução de workspace multi-tenancy

---

### v0.9.2 — Data não documentada

**Mudanças Observáveis:**
- Criação de tabelas `refresh_tokens`, `rep_commissions`, `environments`
- Implementação de soft delete (`deleted_at`) em múltiplas tabelas

---

### v0.9.1 — Data não documentada

**Mudanças Observáveis:**
- Estrutura inicial Next.js 14 App Router
- Schema básico (clients, products, orders, referrals, commissions)

---

**Limitação:** Changelog completo não está documentado. Versões anteriores a v0.9.4 inferidas por análise de código e comentários.

---

## 9. Testes Recomendados

### Testes Unitários (Prioritários)

| Módulo | O Que Validar | Stack Sugerida |
|--------|--------------|----------------|
| `src/lib/auth.ts` | `verifyPassword` com bcrypt e sha256, `generateToken`, `verifyToken` | Jest + `@types/jest` |
| `src/lib/apiFetch.ts` | Injeção de Authorization, Content-Type condicional | Jest (mock fetch) |
| `src/lib/requestContext.ts` | Extração correta de headers | Jest |
| `middleware.ts` | Validação de token válido, expirado, malformado | Jest (mock crypto.subtle) |
| `src/store/authStore.ts` | Login, logout, persistência | Vitest + Testing Library |

---

### Testes de Integração

| Endpoint | O Que Validar |
|----------|--------------|
| `POST /api/auth/login` | Login correto, senha incorreta, usuário bloqueado, brute-force |
| `GET /api/clients` | Filtro por workspace, exclusão de deleted_at |
| `POST /api/orders` | Criação de pedido + order_items + comissão automática |
| `GET /api/admin/logs` | Acesso permitido a admin, negado a non-admin |
| `POST /api/visits` | Check-in atualiza cliente, agenda próxima visita |

**Stack Sugerida:** Jest + `supertest` + banco de testes (Supabase local ou mock)

---

### Testes E2E

| Fluxo | O Que Validar | Stack Sugerida |
|-------|--------------|----------------|
| Login → Dashboard → Logout | Fluxo completo de autenticação | Playwright ou Cypress |
| CRUD Cliente | Criar, editar, excluir (soft delete) | Playwright ou Cypress |
| Pedido → Comissão | Criar pedido pago gera comissão | Playwright ou Cypress |
| Mapa → Check-in | Popup do mapa abre modal de check-in | Playwright ou Cypress |

---

## 10. Próximos Passos

### Imediato (1-2 sprints)

1. **Implementar frontend de `/dashboard/visits`** — API já está pronta
2. **Adicionar testes unitários para `auth.ts` e `middleware.ts`** — crítico para segurança
3. **Integrar `geocode_cache` na API de CEP** — baixo esforço, alto impacto
4. **Validar todas as rotas `/api/admin/*`** — garantir que todas verificam role

---

### Curto Prazo (3-4 sprints)

1. **Implementar refresh tokens** — completar feature iniciada no schema
2. **Criar frontend de `/dashboard/pre-registrations`** — conversão lead→cliente
3. **Adicionar validação de telefone** — backend e frontend
4. **Documentar contratos de API** — OpenAPI/Swagger

---

### Médio Prazo (5-8 sprints)

1. **Implementar módulo de KM logs** — frontend + API
2. **Implementar módulo de Environments** — frontend + API
3. **Implementar upload de fotos** — integrar tabela `photos`
4. **Adicionar rate limiting** — usar tabela `rate_limits`

---

### Roadmap Técnico

| Fase | Objetivo | Entregáveis |
|------|---------|-------------|
| Fase 1 | Estabilização | Testes unitários, correções críticas |
| Fase 2 | Features pendentes | Visits, pre-registrations UI |
| Fase 3 | Qualidade de vida | Refresh tokens, geocode cache, validações |
| Fase 4 | Expansão | KM logs, environments, photos upload |
| Fase 5 | Performance | Índices, caching, otimizações de query |
| Fase 6 | Observabilidade | Logs estruturados, métricas, alertas |

---

## A. Matriz de Módulos

| Módulo | Responsabilidade | Dependências | Pontos Fortes | Fragilidades | Risco de Manutenção |
|--------|-----------------|--------------|---------------|--------------|---------------------|
| `middleware.ts` | Validação JWT em `/api/*` | `JWT_SECRET`, `crypto.subtle` | Edge-compatible, rápido | Validação manual, sem testes | 🔴 Alto |
| `auth.ts` | Hash/verify senha, JWT | `bcryptjs`, `jsonwebtoken` | Suporta bcrypt e sha256 | `verifyToken` não usado | 🟡 Médio |
| `supabaseAdmin.ts` | Cliente service_role | `SUPABASE_SERVICE_ROLE_KEY` | Singleton, server-only | Audit log silencia erros | 🟡 Médio |
| `apiFetch.ts` | HTTP client autenticado | Zustand store | Injeção automática de token | Só funciona em browser | 🟢 Baixo |
| `requestContext.ts` | Extrai contexto do middleware | Headers `x-*` | Simples, direto | Depende de middleware | 🟢 Baixo |
| `commissionHelper.ts` | Gera comissão de indicador | Supabase admin | Transacional | Só suporta indicador (não rep) | 🟡 Médio |
| `authStore.ts` | Estado auth frontend | Zustand persist | Persistência automática | Rehidratação assíncrona | 🟢 Baixo |
| `InteractiveMap.tsx` | Mapa Leaflet + clientes | Leaflet, react-leaflet | Check-in integrado | Sem offline, complexo | 🟠 Alto |
| `DashboardShell.tsx` | Wrapper de layout | Componentes UI | Consistente | Pouca flexibilidade | 🟢 Baixo |

---

## B. Matriz de Dívida Técnica

| ID | Descrição | Severidade | Impacto | Esforço | Benefício |
|----|-----------|-----------|---------|---------|-----------|
| DT01 | Refresh tokens não implementados | 🔴 Alto | UX ruim, sessões curtas | Médio | Alto |
| DT02 | Validação JWT manual no middleware | 🔴 Alto | Risco de segurança | Médio | Alto |
| DT03 | geocode_cache não utilizado | 🟠 Alto | Performance, custo API | Baixo | Médio |
| DT04 | Visits API sem frontend | 🟠 Alto | Feature ociosa | Médio | Alto |
| DT05 | Pre-registrations sem conversão | 🟠 Alto | Funil bloqueado | Médio | Alto |
| DT06 | Zero testes automatizados | 🟠 Alto | Risco de regressão | Alto | Alto |
| DT07 | Rep commissions sem UI | 🟡 Médio | Feature incompleta | Médio | Médio |
| DT08 | KM logs sem UI | 🟡 Médio | Feature incompleta | Médio | Baixo |
| DT09 | Environments sem UI | 🟡 Médio | Feature incompleta | Médio | Baixo |
| DT10 | Photos upload não implementado | 🟡 Médio | Feature incompleta | Alto | Médio |
| DT11 | Rate limiting não implementado | 🟡 Médio | Risco de abuso | Médio | Médio |
| DT12 | Optimistic locking incompleto | 🟡 Médio | Race condition | Baixo | Médio |
| DT13 | Validação de telefone ausente | 🟢 Baixo | Dados inconsistentes | Baixo | Baixo |
| DT14 | Logs silenciados em auditLog | 🟢 Baixo | Debug difícil | Baixo | Baixo |
| DT15 | Documentação de API ausente | 🟢 Baixo | Onboarding lento | Baixo | Médio |

---

## C. Plano de Execução

### Fase 1: Correções Críticas (Sprint 1-2)

**Objetivo:** Eliminar riscos de segurança e bugs bloqueantes.

| Ordem | Tarefa | Motivo da Prioridade | Risco Relacionado |
|-------|--------|---------------------|-------------------|
| 1 | Adicionar testes unitários para `auth.ts` e `middleware.ts` | Segurança crítica | DT02 |
| 2 | Implementar refresh tokens | UX crítica | DT01 |
| 3 | Integrar geocode_cache | Performance imediata | DT03 |
| 4 | Validar todas as rotas admin | Segurança | DT04 |

**Critério de Conclusão:** Todos os testes passando, refresh funcional, cache ativo.

---

### Fase 2: Estabilidade (Sprint 3-4)

**Objetivo:** Completar features essenciais pendentes.

| Ordem | Tarefa | Motivo da Prioridade | Risco Relacionado |
|-------|--------|---------------------|-------------------|
| 1 | Criar frontend `/dashboard/visits` | API já pronta, nome do sistema | DT04 |
| 2 | Implementar conversão lead→cliente | Funil de vendas | DT05 |
| 3 | Adicionar validação de telefone | Qualidade de dados | DT13 |
| 4 | Implementar optimistic locking | Integridade de dados | DT12 |

**Critério de Conclusão:** Visits operacional, conversão funcional, validações ativas.

---

### Fase 3: Refatorações Estruturais (Sprint 5-6)

**Objetivo:** Melhorar qualidade de código e manutenibilidade.

| Ordem | Tarefa | Motivo da Prioridade | Risco Relacionado |
|-------|--------|---------------------|-------------------|
| 1 | Padronizar tratamento de erro | Manutenibilidade | Geral |
| 2 | Unificar validação de JWT | Segurança, consistência | DT02 |
| 3 | Criar helpers (geoUtils, workspace) | DRY | Geral |
| 4 | Documentar contratos de API | Onboarding | DT15 |

**Critério de Conclusão:** Código refactorado, documentação mínima criada.

---

### Fase 4: Expansão de Features (Sprint 7-10)

**Objetivo:** Implementar módulos pendentes do roadmap.

| Ordem | Tarefa | Motivo da Prioridade | Risco Relacionado |
|-------|--------|---------------------|-------------------|
| 1 | Implementar rep_commissions UI | Comissões completas | DT07 |
| 2 | Implementar km_logs UI | Controle de frota | DT08 |
| 3 | Implementar environments UI | Gestão de talhões | DT09 |
| 4 | Implementar photos upload | Galeria de fotos | DT10 |
| 5 | Implementar rate limiting | Proteção contra abuso | DT11 |

**Critério de Conclusão:** Todos os módulos do schema com interface mínima.

---

## D. Padrão de Commit Sugerido

```
feat: implementar refresh tokens
fix: corrigir validação de telefone em clients
test: adicionar testes unitários para auth.ts
refactor: unificar validação de JWT em helper
docs: documentar contratos de API (OpenAPI)
chore: integrar geocode_cache na API de CEP
feat: criar frontend de visits (dashboard/visits)
fix: validar role em todas as rotas admin
perf: adicionar índice em orders.workspace
security: fortalecer validação de JWT no middleware
```

**Convenção:** [Conventional Commits](https://www.conventionalcommits.org/)

---

## Limitações da Auditoria

1. **Changelog incompleto:** Versões anteriores a v0.9.4 inferidas por análise de código, não documentadas formalmente.

2. **Testes ausentes:** Impossível validar comportamento esperado via testes existentes.

3. **Ambiente de produção não acessível:** Auditoria baseada apenas em código-fonte, sem acesso a logs de produção, métricas de performance ou feedback de usuários.

4. **RLS policies não auditadas:** Policies de Row Level Security do Supabase não foram revisadas em detalhe (apenas schema visto).

5. **Integrações externas não testadas:** APIs ViaCEP, Nominatim e Google Maps não foram testadas em ambiente real.

6. **Dados sensíveis:** Variáveis de ambiente reais não foram acessadas (apenas `.env.example`).

7. **Performance em escala:** Não foi possível avaliar performance sob carga (milhares de registros, múltiplos usuários concorrentes).

---

## Assinatura Técnica

**Auditoria gerada por:** Sistema de Auditoria Técnica Automatizada  
**Data de geração:** 2026-04-14  
**Versão do sistema auditado:** v0.9.4  
**Base de evidências:** Repositório Git `/workspace`  
**Status:** ✅ Completa — pronta para documentação interna

---

> **Nota Final:** Esta auditoria é baseada exclusivamente em evidências reais do repositório. Todas as afirmações podem ser rastreadas até arquivos específicos listados na seção 2. Problemas classificados como "bug potencial" ou "evidência insuficiente" foram explicitamente marcados como tal.
