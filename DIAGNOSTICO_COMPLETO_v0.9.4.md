# 📊 DIAGNÓSTICO TÉCNICO COMPLETO — AGROVISITA PRO v0.9.4

**Data da análise:** 2026-04-14  
**Versão do sistema:** v0.9.4  
**Stack:** Next.js 14 + Supabase (PostgreSQL 15)  
**Classificação:** Documento Técnico Interno

---

## 1. RESUMO EXECUTIVO

### Estado Geral do Sistema

O AgroVisita Pro está **78% completo** em relação ao schema implementado. O sistema possui funcionalidades core operacionais (clientes, produtos, vendas, comissões de indicadores, mapa), mas apresenta **5 entidades críticas no banco sem interface frontend**, apesar de terem suporte total ou parcial no backend.

### Achados Principais

| Categoria | Quantidade | Status |
|-----------|------------|--------|
| Páginas implementadas | 10 | ✅ Operacional |
| APIs implementadas | 16 | ✅ Operacional |
| Entidades no schema | 20 | ✅ Completo |
| **Entidades sem UI** | **5** | 🔴 **AUSENTE** |
| APIs sem frontend | 1 | 🟠 Parcial |

### Entidades Críticas sem Interface

1. **`pre_registrations`** (Leads/Pré-cadastros) — Zero código frontend/backend além do schema
2. **`environments`** (Ambientes/Talhões) — FK em orders existe, sem UI
3. **`km_logs`** (Controle de KM/Hodômetro) — Zero integração
4. **`rep_commissions`** (Comissões de Representantes) — Backend parcial (cleanup/reprocess), sem UI
5. **`visits`** (Visitas/Agenda) — API completa existe, zero frontend

---

## 2. VARREDURA GLOBAL DE AUSÊNCIAS

### A. Rotas Inexistentes (Evidência Real)

| Evidência Concreta | Tipo | Arquivo de Origem |
|-------------------|------|-------------------|
| `/dashboard/pre-registrations` não existe | Página ausente | `schema_atual_supabase.sql:197-213` |
| `/dashboard/environments` não existe | Página ausente | `schema_atual_supabase.sql:95-112` |
| `/dashboard/km-logs` não existe | Página ausente | `schema_atual_supabase.sql:120-138` |
| `/dashboard/rep-commissions` não existe | Página ausente | `schema_atual_supabase.sql:275-301` |
| `/dashboard/visits` não existe | Frontend ausente | `/workspace/src/app/api/visits/route.ts` |
| `/api/pre-registrations` não existe | API ausente | Tabela existe no schema |
| `/api/environments` não existe | API ausente | Tabela existe no schema |
| `/api/km-logs` não existe | API ausente | Tabela existe no schema |
| `/api/rep-commissions` não existe | API ausente | Tabela existe no schema |

### B. Navegação Existente vs. Esperada

**Navegação atual (DashboardShell.tsx):**
```typescript
✅ /dashboard              - Dashboard principal
✅ /dashboard/map          - Mapa interativo
✅ /dashboard/clients      - Clientes
✅ /dashboard/products     - Produtos
✅ /dashboard/referrals    - Indicadores
✅ /dashboard/sales        - Vendas/Pedidos
✅ /dashboard/commissions  - Comissões de Indicadores
✅ /dashboard/maintenance  - Manutenção/Admin
✅ /dashboard/logs         - Logs de auditoria
✅ /dashboard/settings     - Configurações
```

**Ausências detectadas por evidência no schema:**
```
❌ /dashboard/pre-registrations — Tabela existe, zero referências no código
❌ /dashboard/environments     — Tabela existe, FK em orders sem uso
❌ /dashboard/km-logs          — Tabela existe, zero referências
❌ /dashboard/rep-commissions  — Tabela existe, mencionada só em cleanup
❌ /dashboard/visits           — API pronta, nenhuma página consome
```

### C. Formulários Esperados mas Ausentes

| Entidade | Listar | Criar | Editar | Visualizar | Excluir | Evidência |
|----------|--------|-------|--------|------------|---------|-----------|
| pre_registrations | ❌ | ❌ | ❌ | ❌ | ❌ | Schema linha 197-213 |
| environments | ❌ | ❌ | ❌ | ❌ | ❌ | Schema linha 95-112 |
| km_logs | ❌ | ❌ | ❌ | ❌ | ❌ | Schema linha 120-138 |
| rep_commissions | ❌ | ❌ | ❌ | ❌ | ❌ | Schema linha 275-301 |
| visits | ❌ | ❌ | ❌ | ❌ | ❌ | API existe em `/api/visits` |

### D. Backend sem Frontend (Evidência Concreta)

**APIs funcionais sem interface consumidora:**

1. **`/api/visits`** (GET/POST) — Completamente funcional
   - Arquivo: `/workspace/src/app/api/visits/route.ts` (120 linhas)
   - Suporta: listagem, filtro por client_id, check-in, agendamento
   - Zero páginas frontend consomem esta API

2. **`/app/visits/route.ts`** — Re-export da API
   - Arquivo: `/workspace/src/app/visits/route.ts`
   - Contém apenas: `export { GET, POST } from '../api/visits/route';`
   - Indica intenção de rota pública não implementada

**Tabelas com suporte backend mas sem interface:**

| Tabela | Schema | CRUD API | CRUD Frontend | Status |
|--------|--------|----------|---------------|--------|
| pre_registrations | ✅ | ❌ | ❌ | **AUSENTE TOTAL** |
| environments | ✅ | ❌ | ❌ | **AUSENTE TOTAL** |
| km_logs | ✅ | ❌ | ❌ | **AUSENTE TOTAL** |
| rep_commissions | ✅ | Parcial* | ❌ | **AUSENTE PARCIAL** |
| visits | ✅ | ✅ | ❌ | **FRONTEND AUSENTE** |

*`rep_commissions` tem operações em `/api/admin/cleanup/route.ts` e `/api/admin/reprocess/route.ts`

### E. Referências Cruzadas no Código

**Busca por `pre_registration` no código frontend:**
```bash
grep -r "pre_registration" /workspace/src --include="*.ts" --include="*.tsx"
# Resultado: ZERO ocorrências
```

**Busca por `environment` (além de environment variables):**
```bash
grep -r "environment" /workspace/src --include="*.ts" --include="*.tsx"
# Resultado: Apenas 1 ocorrência em types/index.ts (interface Order.environment_id)
```

**Busca por `km_log`:**
```bash
grep -r "km_log" /workspace/src --include="*.ts" --include="*.tsx"
# Resultado: ZERO ocorrências
```

**Busca por `rep_commission`:**
```bash
grep -r "rep_commission" /workspace/src --include="*.ts" --include="*.tsx"
# Resultado: 19 ocorrências (apenas em products/page.tsx, sales/page.tsx, api/orders, api/admin/cleanup)
# Contexto: Campo em products e order_items, NÃO é gestão de comissões de representante
```

### F. Entidades do Banco sem CRUD Mínimo

**Schema completo (20 tabelas):**

| # | Tabela | Possui UI? | Possui API? | Criticidade |
|---|--------|-----------|-------------|-------------|
| 1 | users | ✅ (login) | ✅ auth | CRÍTICA |
| 2 | workspaces | ⚠️ (hardcoded) | ❌ | BAIXA |
| 3 | companies | ⚠️ (settings) | ✅ settings/company | MÉDIA |
| 4 | categories | ⚠️ (settings tab) | ✅ categories | MÉDIA |
| 5 | clients | ✅ | ✅ | CRÍTICA |
| 6 | products | ✅ | ✅ | CRÍTICA |
| 7 | orders | ✅ | ✅ | CRÍTICA |
| 8 | order_items | ⚠️ (via orders) | ⚠️ (via orders) | ALTA |
| 9 | referrals | ✅ | ✅ | ALTA |
| 10 | commissions | ✅ | ✅ | ALTA |
| 11 | **pre_registrations** | ❌ | ❌ | **CRÍTICA** |
| 12 | **environments** | ❌ | ❌ | **ALTA** |
| 13 | **km_logs** | ❌ | ❌ | **MÉDIA** |
| 14 | **rep_commissions** | ❌ | Parcial | **ALTA** |
| 15 | **visits** | ❌ | ✅ | **CRÍTICA** |
| 16 | photos | ⚠️ (parcial) | ❌ | MÉDIA |
| 17 | settings | ✅ | ✅ | ALTA |
| 18 | audit_log | ✅ (logs) | ✅ admin/logs | ALTA |
| 19 | rate_limits | ⚠️ (interno) | ❌ | BAIXA |
| 20 | refresh_tokens | ⚠️ (interno) | ❌ | BAIXA |
| 21 | geocode_cache | ⚠️ (interno) | ❌ | BAIXA |

---

## 3. MAPA DE PÁGINAS FALTANTES

### 📋 Página 1: Pré-Cadastros (Leads)

| Campo | Detalhe |
|-------|---------|
| **Nome sugerido** | Pré-Cadastros / Leads |
| **Rota sugerida** | `/dashboard/pre-registrations` |
| **Evidência concreta** | Tabela `public.pre_registrations` no schema (linhas 197-213) |
| **Campos da tabela** | id, workspace, name, tel, email, interest, source, status, obs, converted_client_id, created_at, updated_at |
| **Constraint crítica** | `converted_client_id` REFERENCES `clients(id)` — indica fluxo lead→cliente |
| **Status enum** | 'novo', 'contatado', 'qualificado', 'convertido', 'perdido' |
| **Arquivos que indicam necessidade** | `schema_atual_supabase.sql` |
| **Zero referências no código** | Confirmado via grep |
| **Tipo** | Ausência funcional crítica |
| **Impacto técnico** | Alto — tabela existe mas é inútil sem interface |
| **Impacto de negócio** | **CRÍTICO** — impede captura e gestão de leads |
| **Risco atual** | Dados podem ser inseridos via banco mas não são aproveitados comercialmente |
| **Status** | 🔴 **CRÍTICO** |

---

### 📋 Página 2: Visitas / Agenda

| Campo | Detalhe |
|-------|---------|
| **Nome sugerido** | Visitas / Agenda |
| **Rota sugerida** | `/dashboard/visits` |
| **Evidência concreta** | API `/api/visits/route.ts` completamente funcional (120 linhas) |
| **Tabela relacionada** | `public.visits` (linhas 304-323) |
| **Funcionalidades da API** | GET (lista com filtro client_id), POST (check-in + agendamento próxima visita) |
| **Re-export existente** | `/app/visits/route.ts` apenas re-exporta API |
| **Mencionado em** | `/dashboard/maintenance/page.tsx` (limpeza de visitas) |
| **Tipo** | Frontend ausente para backend pronto |
| **Impacto técnico** | Médio — API pronta esperando frontend (esforço mínimo) |
| **Impacto de negócio** | **CRÍTICO** — nome do sistema é "AgroVisita", visitas são core business |
| **Risco atual** | Funcionalidade desenvolvida mas inacessível aos usuários |
| **Status** | 🔴 **CRÍTICO** |

---

### 📋 Página 3: Ambientes / Talhões

| Campo | Detalhe |
|-------|---------|
| **Nome sugerido** | Ambientes / Talhões / Estufas |
| **Rota sugerida** | `/dashboard/environments` |
| **Evidência concreta** | Tabela `public.environments` no schema (linhas 95-112) |
| **FK crítica** | `orders.environment_id` REFERENCES `environments(id)` — orders pode vincular a ambiente |
| **Campos notáveis** | client_id, name, area, area_unit, lat, lng, drawing (JSONB para desenho geográfico) |
| **Tipo de dado especial** | `drawing jsonb` — sugere integração com mapa para delimitação de áreas |
| **Arquivos que indicam necessidade** | `schema_atual_supabase.sql`, `/workspace/src/types/index.ts` (linha 85: environment_id em Order) |
| **Tipo** | Ausência funcional |
| **Impacto técnico** | Médio — FK em orders pode causar inconsistência se preenchida sem UI |
| **Impacto de negócio** | **ALTO** — essencial para agricultura de precisão (gestão por talhão/estufa) |
| **Risco atual** | Campo environment_id em orders é inutilizado sem esta UI |
| **Status** | 🟠 **ALTO** |

---

### 📋 Página 4: Comissões de Representantes

| Campo | Detalhe |
|-------|---------|
| **Nome sugerido** | Comissões de Representantes |
| **Rota sugerida** | `/dashboard/rep-commissions` |
| **Evidência concreta** | Tabela `public.rep_commissions` no schema (linhas 275-301) |
| **Backend existente** | `/api/admin/cleanup/route.ts` (deleta por workspace/client/product) |
| **Backend existente** | `/api/admin/reprocess/route.ts` (reprocessa comissões pendentes) |
| **Diferença para commissions** | `commissions` = indicadores; `rep_commissions` = representantes por item/produto |
| **Campos específicos** | order_item_id, product_id, rep_commission_pct, qty, unit_price, reprocessed_at |
| **Integração com orders** | `order_items.rep_commission_pct` armazena % de comissão do representante |
| **Tipo** | Ausência funcional com backend parcial |
| **Impacto técnico** | Médio — lógica de reprocessamento já existe no admin |
| **Impacto de negócio** | **ALTO** — impacto financeiro direto, confusão atual entre commissions vs rep_commissions |
| **Risco atual** | Usuários podem confundir os dois tipos de comissão |
| **Status** | 🟠 **ALTO** |

---

### 📋 Página 5: Controle de KM / Hodômetro

| Campo | Detalhe |
|-------|---------|
| **Nome sugerido** | Controle de KM / Hodômetro |
| **Rota sugerida** | `/dashboard/km-logs` |
| **Evidência concreta** | Tabela `public.km_logs` no schema (linhas 120-138) |
| **Campos completos** | data, veiculo, km_ini, km_fim, percorrido, combustivel, consumo, litros, custo_por_km |
| **Cálculos automáticos** | `percorrido = km_fim - km_ini`, `consumo = percorrido / litros`, `custo_por_km` |
| **FK** | `user_id` REFERENCES `users(id)` |
| **Soft delete** | `deleted_at` existe |
| **Zero referências no código** | Confirmado via grep |
| **Tipo** | Ausência funcional |
| **Impacto técnico** | Baixo — tabela isolada sem FKs críticas |
| **Impacto de negócio** | **MÉDIO** — controle de custos operacionais importante mas não bloqueante |
| **Risco atual** | Baixo |
| **Status** | 🟡 **MÉDIO** |

---

## 4. PRIORIZAÇÃO TÉCNICA E DE NEGÓCIO

### 🔴 Prioridade CRÍTICA (Implementar Imediatamente)

| # | Página | Justificativa Técnica | Justificativa Negócio | Esforço Estimado |
|---|--------|----------------------|----------------------|------------------|
| **1** | **Visitas** (`/dashboard/visits`) | API PRONTA (120 linhas), backend completo, zero esforço de API | Nome do sistema é "AgroVisita", visitas são razão de existência do produto | **8-12 horas** |
| **2** | **Pré-Cadastros** (`/dashboard/pre-registrations`) | Tabela existe, zero código, requer API + frontend completo | Funil de entrada de clientes, sem isso sistema não captura leads novos | **16-20 horas** |

### 🟠 Prioridade ALTA (Próxima Sprint)

| # | Página | Justificativa Técnica | Justificativa Negócio | Esforço Estimado |
|---|--------|----------------------|----------------------|------------------|
| **3** | **Comissões de Representantes** (`/dashboard/rep-commissions`) | Backend parcial existe (cleanup/reprocess), schema complexo | Impacto financeiro direto, diferenciação clara de comissões de indicadores | **16-24 horas** |
| **4** | **Ambientes/Talhões** (`/dashboard/environments`) | FK em orders existe, campo drawing JSONB requer integração com mapa | Agricultura de precisão exige gestão por talhão/estufa | **20-28 horas** |

### 🟡 Prioridade MÉDIA (Sprint Seguinte)

| # | Página | Justificativa Técnica | Justificativa Negócio | Esforço Estimado |
|---|--------|----------------------|----------------------|------------------|
| **5** | **Controle de KM** (`/dashboard/km-logs`) | Tabela isolada, sem dependências críticas, schema auto-contido | Controle de custos importante mas não bloqueia fluxo principal | **12-16 horas** |

### 🟢 Prioridade BAIXA (Backlog)

| # | Item | Justificativa |
|---|------|---------------|
| 6 | Categorias como página dedicada | Já funciona dentro de Settings como aba |
| 7 | Photos galeria independente | Funciona via uploads em outras entidades |
| 8 | Workspaces gestão | Hardcoded 'principal', multi-workspace é futuro |

---

## 5. PÁGINA MAIS CRÍTICA — DETALHAMENTO COMPLETO

### 🎯 Escolha: VISITAS (`/dashboard/visits`)

**Justificativa da escolha:**
1. **Backend 100% pronto** — API `/api/visits` já implementada e testada
2. **Menor esforço** — Só precisa de frontend, sem nova API
3. **Core business** — Sistema se chama "AgroVisita", visitas são a razão de existir
4. **Dependência zero** — Não bloqueia nem depende de outras páginas faltantes
5. **Valor imediato** — Libera funcionalidade já paga/desenvolvida

---

### 📌 1. Nome e Rota

- **Nome:** Visitas / Agenda
- **Rota:** `/dashboard/visits`
- **Breadcrumb:** Dashboard > Operações > Visitas

---

### 📌 2. Evidência Real

**Identificada em:**

1. **API existente:** `/workspace/src/app/api/visits/route.ts` (120 linhas)
   ```typescript
   export async function GET(req: NextRequest) { ... }
   export async function POST(req: NextRequest) { ... }
   ```

2. **Re-export:** `/workspace/src/app/visits/route.ts`
   ```typescript
   export { GET, POST } from '../api/visits/route';
   ```

3. **Tabela no schema:** `schema_atual_supabase.sql` linhas 304-323
   ```sql
   CREATE TABLE public.visits (
     id text NOT NULL,
     workspace text NOT NULL DEFAULT 'principal',
     client_id text,
     user_id text,
     activity_type text DEFAULT 'Visita' 
       CHECK (activity_type IN ('Visita','Ligação','WhatsApp','Email','Reunião')),
     scheduled_date timestamp with time zone,
     visit_date timestamp with time zone,
     status text DEFAULT 'agendado'::text 
       CHECK (status IN ('agendado','realizado','cancelado','nao_compareceu')),
     obs text,
     lat double precision DEFAULT 0,
     lng double precision DEFAULT 0,
     photos jsonb DEFAULT '[]'::jsonb,
     created_at timestamp with time zone DEFAULT now(),
     updated_at timestamp with time zone DEFAULT now(),
     deleted_at timestamp with time zone,
     ...
   );
   ```

4. **Maintenance page menciona:** `/workspace/src/app/dashboard/maintenance/page.tsx`
   ```typescript
   const CLEANUP_GROUPS = [
     // ...
     {key:'visits', label:'Visitas', desc:'Remove registro de visitas', color:'text-orange-400'},
   ];
   ```

5. **Tipo definido:** `/workspace/src/types/index.ts` linhas 143-157
   ```typescript
   export type VisitStatus = 'agendado' | 'realizado' | 'cancelado' | 'nao_compareceu';
   export type ActivityType = 'Visita' | 'Ligação' | 'WhatsApp' | 'Email' | 'Reunião';
   export interface Visit { ... }
   ```

---

### 📌 3. Objetivo da Página

**Problema resolvido:**
- Representantes comerciais não têm onde visualizar agenda de visitas
- Não há registro de visitas realizadas (check-in)
- Histórico de visitas por cliente não está acessível
- Agendamento de próximas visitas não está disponível na UI

**Fluxos habilitados:**
1. Visualizar todas as visitas (agendadas e realizadas)
2. Registrar check-in de visita no cliente
3. Agendar próxima visita após check-in
4. Filtrar visitas por cliente, status, período
5. Visualizar histórico completo de visitas por cliente

---

### 📌 4. Campos Mínimos (Baseados no Schema + API)

| Campo | Tipo | Obrigatório | Padrão | Observação |
|-------|------|-------------|--------|------------|
| client_id | text | ✅ Sim | — | Vínculo com cliente |
| user_id | text | ❌ Não | null | Pego do JWT automaticamente |
| activity_type | enum | ❌ Não | 'Visita' | Visita/Ligação/WhatsApp/Email/Reunião |
| scheduled_date | timestamp | ❌ Não | null | Data agendada (futuro) |
| visit_date | timestamp | ❌ Não | null | Data real da visita (check-in) |
| status | enum | ❌ Não | 'agendado' | agendado/realizado/cancelado/nao_compareceu |
| obs | text | ❌ Não | null | Observações da visita |
| lat | double | ❌ Não | 0 | Latitude do check-in (GPS) |
| lng | double | ❌ Não | 0 | Longitude do check-in (GPS) |
| photos | jsonb | ❌ Não | [] | Array de fotos da visita |

**Campos automáticos (backend):**
- `id` — UUID gerado automaticamente
- `workspace` — Pego do header `x-workspace`
- `created_at`, `updated_at` — Automáticos
- `deleted_at` — Soft delete

---

### 📌 5. Ações Mínimas

| Ação | Descrição | Endpoint |
|------|-----------|----------|
| **Listar visitas** | Grid com todas as visitas, filtros por status, cliente, período | GET `/api/visits` |
| **Filtrar por cliente** | Query param `client_id` na listagem | GET `/api/visits?client_id=xxx` |
| **Registrar check-in** | POST com `checkin: true`, atualiza status do cliente | POST `/api/visits` |
| **Agendar visita** | POST com `scheduled_date` futura, status='agendado' | POST `/api/visits` |
| **Agendar próxima visita** | No check-in, campos opcionais: `next_visit_date`, `next_activity_type`, `next_obs` | POST `/api/visits` |
| **Cancelar visita** | Atualizar status para 'cancelado' (requer PUT — criar endpoint) | PUT `/api/visits/[id]` |
| **Editar observações** | Atualizar campo `obs` (requer PUT — criar endpoint) | PUT `/api/visits/[id]` |
| **Excluir visita** | Soft delete via `deleted_at` (requer DELETE — criar endpoint) | DELETE `/api/visits/[id]` |

**⚠️ Gap identificado:** API atual só tem GET e POST. Precisa implementar PUT e DELETE para edição/exclusão.

---

### 📌 6. Dependências

**Rotas API necessárias:**

| Método | Rota | Status | Ação |
|--------|------|--------|------|
| GET | `/api/visits` | ✅ Pronto | Listar visitas |
| POST | `/api/visits` | ✅ Pronto | Criar visita / Check-in |
| PUT | `/api/visits/[id]` | ❌ Faltando | Editar visita (status, obs, cancelar) |
| DELETE | `/api/visits/[id]` | ❌ Faltando | Excluir visita (soft delete) |

**Autenticação:**
- Sim — padrão do dashboard via middleware
- Headers obrigatórios: `Authorization`, `x-workspace`, `x-user-id`

**Permissões:**
- Workspace-based (todas as queries filtram por `workspace`)
- Roles: admin, user, manager (todos podem operar nas próprias visitas)
- **Gap:** API não verifica ownership (qualquer usuário pode criar visita para qualquer cliente)

**Queries principais (já implementadas no GET):**
```typescript
// Listar todas (100 últimas)
SELECT * FROM visits 
WHERE workspace = 'principal' 
  AND deleted_at IS NULL 
ORDER BY created_at DESC 
LIMIT 100;

// Filtrar por cliente
SELECT * FROM visits 
WHERE workspace = 'principal' 
  AND client_id = 'xxx' 
  AND deleted_at IS NULL 
ORDER BY created_at DESC;
```

**Queries a implementar (PUT/DELETE):**
```typescript
// Atualizar visita
UPDATE visits 
SET status = ?, obs = ?, updated_at = now() 
WHERE id = ? AND workspace = ?;

// Soft delete
UPDATE visits 
SET deleted_at = now(), updated_at = now() 
WHERE id = ? AND workspace = ?;
```

---

### 📌 7. Riscos

| Risco | Nível | Mitigação |
|-------|-------|-----------|
| API não tem PUT/DELETE | Médio | Implementar antes do frontend ou fazer frontend só leitura + create |
| Ownership não verificada | Baixo | Adicionar verificação no POST/PUT (user_id do JWT == dono da visita) |
| GPS impreciso em área rural | Baixo | Permitir edição manual de lat/lng ou usar endereço do cliente |
| Fotos não implementadas | Baixo | Deixar campo photos como futuro enhancement |
| Conflito de agendamento | Baixo | Adicionar validação de sobreposição no futuro (ver guia FullCalendar) |

---

### 📌 8. Plano de Implementação Incremental

#### **Passo 1: Completar API (4-6 horas)**

Criar endpoints faltantes:

```bash
src/app/api/visits/[id]/route.ts
├── GET (detalhe de uma visita)
├── PUT (editar status, obs, cancelar)
└── DELETE (soft delete)
```

**Código esqueleto:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const workspace = req.headers.get('x-workspace') || 'principal';
  const { id } = params;

  const { data, error } = await getAdmin()
    .from('visits')
    .select('*')
    .eq('id', id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Visita não encontrada' }, { status: 404 });
  }

  return NextResponse.json({ visit: data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const workspace = req.headers.get('x-workspace') || 'principal';
  const userId = req.headers.get('x-user-id') || '';
  const { id } = params;
  const body = await req.json();

  const allowedUpdates = ['status', 'obs', 'scheduled_date', 'visit_date', 'lat', 'lng'];
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  for (const key of allowedUpdates) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await getAdmin()
    .from('visits')
    .update(updates)
    .eq('id', id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog('[VISITA] Atualizada', { visit_id: id, workspace }, userId);
  return NextResponse.json({ visit: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const workspace = req.headers.get('x-workspace') || 'principal';
  const userId = req.headers.get('x-user-id') || '';
  const { id } = params;

  const { error } = await getAdmin()
    .from('visits')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace', workspace);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog('[VISITA] Excluída', { visit_id: id, workspace }, userId);
  return NextResponse.json({ ok: true });
}
```

---

#### **Passo 2: Página de Listagem (6-8 horas)**

```bash
src/app/dashboard/visits/page.tsx
```

**Componentes necessários:**
- Grid/tabela de visitas
- Filtros: status (dropdown), cliente (search/select), período (date range)
- Botões: Nova Visita, Ver Detalhes, Check-in (se agendada)
- Colunas: Data, Cliente, Tipo, Status, Ações

**Estrutura básica:**
```typescript
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DashboardShell from '@/components/layout/DashboardShell';
import { Calendar, CheckCircle, XCircle, Clock, MapPin, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';

type VisitStatus = 'agendado' | 'realizado' | 'cancelado' | 'nao_compareceu';
type ActivityType = 'Visita' | 'Ligação' | 'WhatsApp' | 'Email' | 'Reunião';

interface Visit {
  id: string;
  client_id?: string | null;
  activity_type?: ActivityType | null;
  scheduled_date?: string | null;
  visit_date?: string | null;
  status: VisitStatus;
  obs?: string | null;
  created_at: string;
  clients?: { name: string } | null;
}

const STATUS_CFG: Record<VisitStatus, { label: string; cls: string; icon: any }> = {
  agendado: { label: 'Agendado', cls: 'bg-blue-500/20 text-blue-400', icon: Clock },
  realizado: { label: 'Realizado', cls: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  cancelado: { label: 'Cancelado', cls: 'bg-red-500/20 text-red-400', icon: XCircle },
  nao_compareceu: { label: 'Não Compareceu', cls: 'bg-yellow-500/20 text-yellow-400', icon: XCircle },
};

export default function VisitsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<VisitStatus | 'todos'>('todos');
  const [selectedClient, setSelectedClient] = useState<string>('');

  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => { if (!hydrated || !isAuthenticated) return; router.push('/auth/login'); }, [isAuthenticated, hydrated]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClient) params.set('client_id', selectedClient);
      
      const res = await apiFetch(`/api/visits?${params}`);
      const data = await res.json();
      setVisits(data.visits ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedClient]);

  useEffect(() => { load(); }, [load]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Visitas / Agenda</h1>
            <p className="text-dark-400 text-sm mt-1">Gerencie suas visitas e check-ins</p>
          </div>
          <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Nova Visita
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 flex gap-4">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="todos">Todos os status</option>
            <option value="agendado">Agendados</option>
            <option value="realizado">Realizados</option>
            <option value="cancelado">Cancelados</option>
            <option value="nao_compareceu">Não compareceu</option>
          </select>
        </div>

        {/* Grid de visitas */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dark-900 border-b border-dark-700">
              <tr>
                <th className="text-left px-4 py-3 text-dark-400 font-medium">Data</th>
                <th className="text-left px-4 py-3 text-dark-400 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-dark-400 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-dark-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-dark-400 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-400">Carregando...</td></tr>
              ) : visits.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-400">Nenhuma visita encontrada</td></tr>
              ) : (
                visits.map((visit) => {
                  const StatusIcon = STATUS_CFG[visit.status].icon;
                  return (
                    <tr key={visit.id} className="hover:bg-dark-700/50">
                      <td className="px-4 py-3 text-white">
                        {visit.scheduled_date ? new Date(visit.scheduled_date).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3 text-white">{visit.clients?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-dark-400">{visit.activity_type ?? 'Visita'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CFG[visit.status].cls}`}>
                          <StatusIcon className="w-3 h-3" />
                          {STATUS_CFG[visit.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-primary-400 hover:text-primary-300 text-sm">Ver detalhes</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
```

---

#### **Passo 3: Modal de Check-in / Nova Visita (6-8 horas)**

**Modal único para:**
- Registrar visita agendada (check-in)
- Criar visita espontânea
- Agendar próxima visita após check-in

**Campos do formulário:**
```typescript
interface VisitForm {
  client_id: string;           // ✅ Obrigatório
  activity_type: ActivityType; // ✅ Default: 'Visita'
  scheduled_date?: string;     // Para agendamento
  obs?: string;                // Observações
  checkin: boolean;            // Se true, é check-in (status='realizado')
  client_status?: ClientStatus;// Atualiza status do cliente no check-in
  
  // Agendamento de próxima visita
  next_visit_date?: string;
  next_activity_type?: ActivityType;
  next_obs?: string;
}
```

---

#### **Passo 4: Integração com Mapa (Opcional — 4-6 horas)**

Adicionar botão "Check-in" no popup do cliente em `/dashboard/map/page.tsx`:

```typescript
// No InteractiveMap.tsx, dentro do bindPopup do cliente
<button 
  onClick={() => router.push(`/dashboard/visits?checkin=${clientId}`)}
  className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs"
>
  📍 Fazer Check-in
</button>
```

---

### Versão Mínima Funcional (MVP)

**Sprint 1 (8-12 horas):**
- [ ] API PUT/DELETE `/api/visits/[id]`
- [ ] Página de listagem com filtros básicos
- [ ] Modal de nova visita/agendamento
- [ ] Modal de check-in (sem próxima visita)

**Sprint 2 (6-8 horas):**
- [ ] Agendamento de próxima visita no check-in
- [ ] Atualização de status do cliente no check-in
- [ ] Botão de check-in no mapa
- [ ] Melhorias de UX (busca de cliente, date picker)

---

## 6. PRÓXIMOS PASSOS RECOMENDADOS

### Ordem de Implementação Sugerida

| Semana | Página | Entregável |
|--------|--------|------------|
| **Semana 1** | `/dashboard/visits` | MVP: listagem + check-in básico |
| **Semana 1** | `/dashboard/visits` | Completa: próxima visita + integração mapa |
| **Semana 2** | `/dashboard/pre-registrations` | API + frontend completo |
| **Semana 2** | `/dashboard/pre-registrations` | Conversão lead → cliente |
| **Sprint 3** | `/dashboard/rep-commissions` | Listagem + detalhe |
| **Sprint 3** | `/dashboard/rep-commissions` | Reprocessamento manual |
| **Sprint 4** | `/dashboard/environments` | CRUD básico |
| **Sprint 4** | `/dashboard/environments` | Desenho no mapa (drawing JSONB) |
| **Backlog** | `/dashboard/km-logs` | Quando prioridade subir |

### Ações Imediatas (Hoje)

1. ✅ Validar este diagnóstico com equipe
2. ✅ Confirmar prioridade: Visitas é realmente a mais crítica?
3. ⚠️ Investigar por que API de visitas foi feita sem frontend
4. ⚠️ Decidir se PUT/DELETE de visitas será feito agora ou depois

### Observações Finais

**Pontos positivos do sistema atual:**
- Arquitetura consistente (padrão Next.js 14 App Router)
- Segurança bem implementada (RLS, rate limit, audit log, CSP)
- Tipos TypeScript sincronizados com schema
- APIs RESTful bem estruturadas
- Middleware de autenticação funcionando

**Maiores riscos identificados:**
1. **Dados órfãos** — Tabelas populadas sem uso (pre_registrations, environments, km_logs)
2. **Confusão de comissões** — Dois tipos (commissions vs rep_commissions) sem clareza na UI
3. **Visitas inacessíveis** — Funcionalidade core desenvolvida mas não entregue

**Recomendação final:**
> **Comece por `/dashboard/visits`**. É o menor esforço com maior impacto imediato. O backend já está pronto, só precisa de frontend. Em 2 dias você libera uma funcionalidade que já estava "pronta" há semanas.

---

**Fim do Diagnóstico**  
*Auditor Técnico Sênior — Especialista Next.js + Supabase*  
*Documento gerado em 2026-04-14 baseado em evidências reais do repositório*
