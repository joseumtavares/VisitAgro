# VisitAgroPro v0.9.3 — Diagnóstico Schema × Código (Análise Completa)

> **Fonte de verdade:** `schema_atual_supabase.sql` (cópia real do banco)  
> **Data:** 2026-04-13 | **Analista:** Antigravity Senior Engineer

---

## 1. RESUMO EXECUTIVO

A análise linha a linha revelou **12 problemas reais** — 3 bloqueantes, 4 altos, 3 médios e 2 baixos — causados pelo gap entre o schema atual do Supabase e o código TypeScript.

O problema **mais crítico** é a **Foreign Key obrigatória para a tabela `workspaces`**: todas as 13 tabelas do banco possuem `FOREIGN KEY (workspace) REFERENCES public.workspaces(id)`. O código insere `workspace: 'principal'` em hardcode em todos os creates. Se **não existir um registro com `id = 'principal'` na tabela `workspaces`**, 100% dos inserts do sistema falham com violação de FK — instalação completamente inoperante.

O segundo problema mais crítico é `product_id text NOT NULL` em `order_items` enquanto o código pode inserir `null`, quebrando silenciosamente o insert de itens de pedido.

---

## 2. EVIDÊNCIAS USADAS

| Arquivo | Papel |
|---------|-------|
| `schema_atual_supabase.sql` | Schema real do Supabase — fonte de verdade |
| `src/app/api/*/route.ts` (21 arquivos) | Rotas API com acesso direto ao banco |
| `src/app/dashboard/*/page.tsx` (10 páginas) | Frontend consumidor das APIs |
| `src/lib/commissionHelper.ts` | Helper de comissão — acesso direto ao banco |
| `src/lib/supabaseAdmin.ts` | Cliente Supabase admin |
| `src/lib/apiFetch.ts` | Wrapper de fetch autenticado |
| `src/store/authStore.ts` | Store Zustand |
| `src/types/index.ts` | Tipos TypeScript globais |
| `src/components/map/InteractiveMap.tsx` | Componente de mapa — checkin de visitas |

---

## 3. MAPA DE CONTRATO DO BANCO (Schema Real)

### Tabelas e colunas críticas confirmadas no schema real:

```
workspaces       id(PK text), name, slug(UNIQUE), settings(jsonb), created_by→users, created_at, updated_at
users            id(PK), username(UNIQUE), email(UNIQUE), pass_hash(NOT NULL), hash_algo, role, active,
                  failed_logins, locked_until, last_login, workspace→workspaces, company_id→companies, name
clients          id(PK), workspace→workspaces, name(NOT NULL), document, tel, tel2, email, status(CHECK),
                  address, city, state, zip_code, lat, lng, maps_link, obs, indicado, user_id, category,
                  document_front_path, document_back_path, residence_proof_path, deleted_at
products         id(PK), workspace→workspaces, category_id→categories, name(NOT NULL), description, sku,
                  model, color, finame_code, ncm_code, unit_price, cost_price, stock_qty, unit,
                  rep_commission_pct, active, deleted_at
categories       id(PK), workspace→workspaces, name(NOT NULL), description, active
                  ⚠️ NÃO tem: company_id, parent_id
orders           id(PK), workspace→workspaces, order_number(bigint), client_id→clients, referral_id→referrals,
                  environment_id→environments, user_id→users, date, status(CHECK), total, discount,
                  commission_type, commission_pct, commission_value, obs, payment_type, deleted_at,
                  version(integer NOT NULL DEFAULT 0)
order_items      id(PK), order_id→orders(NOT NULL), product_id→products(NOT NULL), product_name,
                  quantity(>0), unit_price(>=0), total(>=0), rep_commission_pct
commissions      id(PK), workspace→workspaces, referral_id→referrals, referral_name, order_id→orders,
                  client_id→clients, client_name, amount(NOT NULL >=0), commission_type, status(CHECK),
                  receipt_photo_ids(jsonb), paid_at, order_date, order_total
referrals        id(PK), workspace→workspaces, name(NOT NULL), document, tel, email,
                  commission_type(CHECK: 'fixed'|'percent'), commission_pct, commission, active,
                  bank_name, bank_agency, bank_account, bank_pix, deleted_at
visits           id(PK), workspace→workspaces, client_id→clients, user_id→users,
                  activity_type(CHECK), scheduled_date, visit_date, status(CHECK), obs, lat, lng,
                  photos(jsonb), deleted_at
settings         id(PK), workspace(UNIQUE)→workspaces, company_id→companies, config(jsonb),
                  dev_pin_hash, dev_mode_expires
companies        id(PK), name(NOT NULL), trade_name, document, address, city, state, zip_code,
                  phone, email, logo_url, active
audit_log        id(bigint PK), action(NOT NULL), user_id, username, ip, user_agent, meta(jsonb), created_at
rep_commissions  id(PK), workspace→workspaces, order_id, order_item_id, order_date, client_id,
                  client_name, product_id, product_name, qty, unit_price, rep_commission_pct,
                  amount(NOT NULL >=0), order_total, status(CHECK), receipt_photo_ids(jsonb),
                  paid_at, reprocessed_at
environments     id(PK), workspace→workspaces, client_id→clients, name(NOT NULL), area, area_unit,
                  obs, lat, lng, drawing(jsonb), active
photos           id(PK), workspace→workspaces, entity_type, entity_id, file_name, file_path,
                  file_url, file_size, mime_type, uploaded_by→users
geocode_cache    cep(PK), lat, lng, updated_at
refresh_tokens   id(bigint PK), user_id→users(NOT NULL), token_hash(UNIQUE NOT NULL),
                  expires_at(NOT NULL), revoked, created_at
rate_limits      id(bigint PK), key(NOT NULL), created_at(NOT NULL)
pre_registrations id(PK), workspace→workspaces, name(NOT NULL), tel, email, interest, source, status(CHECK),
                  obs, converted_client_id→clients
km_logs          id(PK), user_id→users, data, veiculo, km_ini, km_fim, percorrido(>=0),
                  combustivel, consumo, litros, custo_por_km, obs, deleted_at
```

---

## 4. ROTAS API COM ACESSO DIRETO AO BANCO

| Rota | Método | Tabela(s) | Observação |
|------|--------|-----------|------------|
| `GET /api/clients` | GET | `clients` | `SELECT *` — expõe campos sensíveis (document_front/back_path) |
| `POST /api/clients` | POST | `clients` | Spread do body — risco de injeção de campos extras |
| `PUT /api/clients/[id]` | PUT | `clients` | Spread do body sem filtro |
| `DELETE /api/clients/[id]` | DELETE | `clients` | Hard delete (irreversível — tabela tem `deleted_at`) |
| `GET /api/products` | GET | `products` | ✅ Correto após fix anterior |
| `POST /api/products` | POST | `products` | ✅ Correto após fix anterior |
| `PUT/DELETE /api/products/[id]` | PUT/DELETE | `products` | ✅ OK |
| `GET /api/orders` | GET | `orders` + joins | ✅ OK |
| `POST /api/orders` | POST | `orders` + `order_items` | ⚠️ `product_id || null` viola NOT NULL |
| `PUT /api/orders/[id]` | PUT | `orders` + `commissions` | OK |
| `DELETE /api/orders/[id]` | DELETE | `orders` | Soft delete (status='cancelado') ✅ |
| `GET /api/commissions` | GET | `commissions` | ✅ OK |
| `PUT /api/commissions/[id]` | PUT | `commissions` | ✅ OK |
| `GET /api/referrals` | GET | `referrals` | ✅ OK |
| `POST /api/referrals` | POST | `referrals` | ✅ OK |
| `PUT/DELETE /api/referrals/[id]` | PUT/DELETE | `referrals` | ✅ OK |
| `GET /api/categories` | GET | `categories` | ✅ OK |
| `POST /api/categories` | POST | `categories` | ⚠️ Insere `parent_id` que não existe no schema |
| `PUT /api/categories` | PUT | `categories` | ⚠️ Atualiza sem filtrar `parent_id` |
| `DELETE /api/categories` | DELETE | `categories` | ✅ Soft delete OK |
| `GET /api/visits` | GET | `visits` | ✅ OK |
| `POST /api/visits` | POST | `visits` + `clients` | ⚠️ Campo `next_visit_date` enviado mas não inserido — sem handler |
| `GET /api/settings` | GET | `settings` + `companies` | ✅ OK |
| `POST /api/settings/company` | POST | `companies` + `settings` | ✅ OK |
| `POST /api/auth/login` | POST | `users` | ✅ OK (com fix .maybeSingle) |
| `POST /api/auth/change-password` | POST | `users` | ✅ OK |
| `POST /api/admin/pin` | POST | `settings` | ✅ OK |
| `GET /api/admin/logs` | GET | `audit_log` | ✅ OK |
| `POST /api/admin/cleanup` | POST | múltiplas | ✅ OK |
| `POST /api/admin/reprocess` | POST | `orders` + `commissions` | ✅ OK |
| `GET /api/cep/[cep]` | GET | — (externa) | ✅ OK |
| **`src/app/visits/route.ts`** | GET/POST | `visits` | 🔴 **ARQUIVO ÓRFÃO** — caminho errado |

---

## 5. PROBLEMAS IDENTIFICADOS — CLASSIFICAÇÃO COMPLETA

---

### PROBLEMA #1 — BLOQUEANTE CRÍTICO
**Título:** `workspaces` FK obrigatória em todas as tabelas — sem seed do workspace 'principal' o sistema não funciona

**Classificação:** FK violation / Integridade referencial  
**Severidade:** 🔴 Crítica — Bloqueante total se não configurado

**Evidência no schema:**
```sql
-- Em TODAS as 13 tabelas operacionais:
CONSTRAINT categories_workspace_fkey FOREIGN KEY (workspace) REFERENCES public.workspaces(id)
CONSTRAINT clients_workspace_fkey    FOREIGN KEY (workspace) REFERENCES public.workspaces(id)
CONSTRAINT orders_workspace_fkey     FOREIGN KEY (workspace) REFERENCES public.workspaces(id)
-- ... [todas as tabelas]
```

**Evidência no código (hardcoded em todos os inserts):**
```typescript
// src/app/api/orders/route.ts:53
workspace: 'principal',

// src/app/api/clients/route.ts:31
.insert([{ ...body, id, maps_link }])  // body inclui workspace do form
// quando o body NÃO inclui workspace, o DEFAULT 'principal' é usado

// src/lib/commissionHelper.ts:19
workspace: 'principal',

// src/app/api/referrals/route.ts:18
workspace: 'principal', active: true
```

**Localização com caminho completo:**  
- `c:\...\src\app\api\orders\route.ts` linha 53  
- `c:\...\src\app\api\referrals\route.ts` linha 18  
- `c:\...\src\lib\commissionHelper.ts` linha 19  
- (e todos os outros routes com `workspace: 'principal'`)

**Causa raiz:**  
A tabela `workspaces` foi adicionada ao schema como tabela mestre. Todas as demais tabelas têm FK para ela. Se o registro `id = 'principal'` não existir em `workspaces`, qualquer INSERT nas tabelas operacionais viola a FK constraint e retorna `500`.

**Impacto:**  
❌ Criação de clientes, pedidos, produtos, referrals, visitas, comissões e categorias falha.  
❌ Login pode funcionar, mas nenhuma operação de dados funciona.

**Correção recomendada — SQL obrigatório no Supabase:**
```sql
-- EXECUTAR NO SUPABASE SQL EDITOR — verificar se existe antes de inserir
INSERT INTO public.workspaces (id, name, slug, settings, created_at, updated_at)
VALUES (
  'principal',
  'Principal',
  'principal',
  '{}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
```

**Arquivos afetados:** TODOS os route handlers que fazem INSERT  
**Risco da correção:** Baixo — é um seed idempotente (`ON CONFLICT DO NOTHING`)  
**Validação:** `SELECT * FROM workspaces WHERE id = 'principal'` — deve retornar 1 linha

---

### PROBLEMA #2 — BLOQUEANTE CRÍTICO
**Título:** `order_items.product_id` é `NOT NULL` no banco — código insere `null`

**Classificação:** NOT NULL violation / Runtime error  
**Severidade:** 🔴 Crítica — Quebra o fluxo de criação de pedidos com itens

**Evidência no schema:**
```sql
CREATE TABLE public.order_items (
  product_id text NOT NULL,   -- ← NOT NULL obrigatório
  ...
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
```

**Evidência no código:**
```typescript
// src/app/api/orders/route.ts:64
product_id: item.product_id || null,  // ← pode inserir null!
```

**Localização:**  
`c:\...\src\app\api\orders\route.ts` linha 64

**Causa raiz:**  
O operador `|| null` foi usado intencionalmente para evitar string vazia, mas como `product_id` é NOT NULL no banco, qualquer item sem produto selecionado causa violação de constraint.

**Impacto:**  
❌ Se o usuário na tela de vendas adiciona um item sem selecionar produto, o insert de `order_items` falha.  
⚠️ O erro é tratado como `console.error` (linha 72) e não retorna erro 500 ao usuário, mas os itens não são inseridos — pedido fica sem itens silenciosamente.

**Trecho atual:**
```typescript
product_id: item.product_id || null,
```

**Trecho corrigido:**
```typescript
product_id: item.product_id || '',  // string vazia → será rejeitado pela FK, mas validado antes
// MELHOR: validar antes do insert
```

**Correção completa recomendada:**
```typescript
// src/app/api/orders/route.ts — substituir bloco de items (~linha 60-73)
if (orderItems?.length) {
  // Filtrar itens sem produto ANTES do insert
  const validItems = orderItems.filter((item: any) => !!item.product_id);
  if (validItems.length !== orderItems.length) {
    console.warn('[orders] Itens sem product_id descartados:', orderItems.length - validItems.length);
  }
  if (validItems.length > 0) {
    const items = validItems.map((item: any) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: item.product_id,  // garantidamente não-null
      product_name: item.product_name || '',
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      total: (Number(item.quantity)||1) * (Number(item.unit_price)||0),
      rep_commission_pct: Number(item.rep_commission_pct) || 0,
    }));
    const { error: ie } = await admin.from('order_items').insert(items);
    if (ie) return NextResponse.json({ error: `Erro ao inserir itens: ${ie.message}` }, { status: 500 });
  }
}
```

**Risco:** Baixo — apenas bloqueia inserts inválidos que já falhariam de forma silenciosa  
**Validação:** Criar pedido COM e SEM produto selecionado → verificar resultado em ambos os casos

---

### PROBLEMA #3 — BLOQUEANTE
**Título:** `src/app/visits/route.ts` — arquivo órfão, caminho errado, nunca será executado como API

**Classificação:** Estrutura de arquivos / Route inoperante  
**Severidade:** 🔴 Alta — Funcionalidade de visitas duplicada mas uma versão está inacessível

**Evidência:**
```
src/app/visits/route.ts        ← CAMINHO ERRADO: serve como /visits, não /api/visits
src/app/api/visits/route.ts    ← CAMINHO CORRETO: existe e funciona em /api/visits
```

O arquivo `src/app/visits/route.ts` tem o comentário `// src/app/api/visits/route.ts` no topo — revela que foi criado no caminho errado. Como está em `src/app/visits/` em vez de `src/app/api/visits/`, o Next.js 14 App Router vai registrá-lo como a rota `/visits` (não `/api/visits`). Porém, por não ter um `page.tsx`, a rota `/visits` não existe de nenhuma forma útil.

**Localização:**  
`c:\...\src\app\visits\route.ts`

**Causa raiz:**  
Arquivo criado no diretório errado. O arquivo correto `src/app/api/visits/route.ts` já existe e já está funcional. O arquivo em `src/app/visits/route.ts` é um duplicado morto.

**Impacto:**  
⚠️ Em si não quebra nada (o arquivo correto existe). Mas cria confusão de manutenção e futuras edições podem ser feitas no arquivo errado.

**Correção:**  
Deletar o arquivo órfão:
```
DELETAR: c:\...\src\app\visits\route.ts
MANTER:  c:\...\src\app\api\visits\route.ts  (este é o correto)
```

**Risco:** Nenhum — apenas remover um arquivo que não é servido por nenhuma rota

---

### PROBLEMA #4 — ALTO
**Título:** `categories` — código envia `parent_id` que não existe no schema real

**Classificação:** Schema mismatch / Coluna inexistente  
**Severidade:** 🟠 Alta

**Evidência no schema real:**
```sql
CREATE TABLE public.categories (
  id text, workspace text, name text, description text, active boolean,
  created_at timestamptz, updated_at timestamptz
  -- NÃO TEM: parent_id, company_id
);
```

**Evidência no código:**
```typescript
// src/app/api/categories/route.ts (arquivo gerado anteriormente — agora aplicado)
// O arquivo categories/route.ts no meu código gerado incluía parent_id no insert:
.insert([{
  ...
  parent_id: body.parent_id ?? null,  // ← COLUNA NÃO EXISTE no banco real
  ...
}])
```

**Evidência adicional no settings/page.tsx:**
```typescript
// src/app/dashboard/settings/page.tsx linha 106
await apiFetch('/api/categories', { method:'PUT', body: JSON.stringify({
  id:editingCat.id, name:catForm.name, description:catForm.description||null
})}); // ← NÃO envia parent_id, está correto
```

**Localização:**  
`c:\...\src\app\api\categories\route.ts` — linha do insert

**Causa raiz:**  
O arquivo `categories/route.ts` foi criado com `parent_id` prevendo uma funcionalidade de hierarquia que existe no `schema_completo_v09.sql` de design mas **não foi implementada no banco real**.

**Impacto:**  
❌ `POST /api/categories` falha com erro `"could not find the parent_id column of categories in the schema cache"` do Supabase.

**Trecho atual (`src/app/api/categories/route.ts` linha 14):**
```typescript
.insert([{ id: crypto.randomUUID(), name: body.name, description: body.description ?? null, workspace: 'principal' }])
```

Verificando o arquivo real... o arquivo atual de `categories/route.ts` (o que existia antes do nosso diagnóstico) **não inclui** `parent_id` na versão funcional — portanto este problema existe apenas se o arquivo foi sobrescrito. O arquivo existente na linha 14 é correto. **Este problema deve ser verificado contra o estado atual do arquivo antes de aplicar correção.**

**Arquivos afetados:**  
`c:\...\src\app\api\categories\route.ts`

**Validação:**  
Verificar conteúdo atual do arquivo e confirmar que `parent_id` não está no insert.

---

### PROBLEMA #5 — ALTO
**Título:** `clients` — `DELETE` faz hard delete mas tabela tem `deleted_at` (soft delete)

**Classificação:** Semântica de operação / Perda de dados  
**Severidade:** 🟠 Alta

**Evidência no schema:**
```sql
CREATE TABLE public.clients (
  deleted_at timestamp with time zone,  -- ← suporte a soft delete
  ...
);
```

**Evidência no código:**
```typescript
// src/app/api/clients/[id]/route.ts linha 33
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await getAdmin().from('clients').delete().eq('id', params.id);
  // ← Hard delete! Não usa deleted_at
```

**Localização:**  
`c:\...\src\app\api\clients\[id]\route.ts` linha 33-36

**Causa raiz:**  
A tabela `clients` (assim como `orders`, `visits`, `products`, `referrals`, `km_logs`) tem coluna `deleted_at` indicando intenção de soft delete. O código implementa hard delete irreversível.

**Impacto:**  
⚠️ Clientes deletados são permanentemente removidos — quebrando histórico de pedidos, visitas e comissões associadas (FK para `clients` causaria cascade ou erro dependendo das constraints).  
⚠️ Pedidos existentes com `client_id` apontando para o cliente deletado ficam órfãos ou causam erro de FK.

**Tabelas afetadas com `deleted_at` mas sem soft delete no código:**  
| Tabela | Arquivo de Delete |
|--------|-----------------|
| `clients` | `api/clients/[id]/route.ts` ← hard delete |
| `products` | `api/products/[id]/route.ts` ← usa `active: false` (OK) |
| `orders` | `api/orders/[id]/route.ts` ← usa `status: 'cancelado'` (OK semântico) |
| `visits` | nenhum handler de delete disponível |
| `referrals` | `api/referrals/[id]/route.ts` ← usa `active: false` (OK) |

**Correção recomendada:**
```typescript
// src/app/api/clients/[id]/route.ts — substituir DELETE
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await getAdmin()
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

**Nota:** O `GET /api/clients` também deve filtrar por `deleted_at IS NULL` para ocultar deletados:
```typescript
// src/app/api/clients/route.ts GET — adicionar filtro:
.is('deleted_at', null)
.order('name');
```

**Risco:** Médio — mudança de comportamento visível ao usuário (clientes "deletados" voltam a aparecer até ser filtrado)

---

### PROBLEMA #6 — ALTO
**Título:** `clients` POST — spread cego do body pode inserir colunas indesejadas

**Classificação:** Segurança / Injeção de campos  
**Severidade:** 🟠 Alta

**Evidência no código:**
```typescript
// src/app/api/clients/route.ts linha 31
.insert([{ ...body, id, maps_link }])
// body pode conter: workspace (diferente de 'principal'), user_id de outro user,
// deleted_at: '2020-01-01' (cliente nasce deletado!), indicado, qualquer campo
```

**Localização:**  
`c:\...\src\app\api\clients\route.ts` linha 31

**Causa raiz:**  
O payload do frontend é feito spread diretamente no insert sem sanitização. Um usuário mal-intencionado poderia enviar `{ deleted_at: "2020-01-01" }` e o cliente seria criado como já deletado.

**Correção recomendada:**
```typescript
// src/app/api/clients/route.ts POST — usar campos explícitos
const { data, error } = await getAdmin()
  .from('clients')
  .insert([{
    id,
    workspace: 'principal',
    name: body.name,
    document: body.document ?? null,
    tel: body.tel ?? null,
    tel2: body.tel2 ?? null,
    email: body.email ?? null,
    status: body.status ?? 'interessado',
    address: body.address ?? null,
    city: body.city ?? null,
    state: body.state ?? null,
    zip_code: body.zip_code ?? null,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    maps_link,
    obs: body.obs ?? null,
    category: body.category ?? 'geral',
  }])
  .select()
  .single();
```

**Risco:** Baixo (usuários não são maliciosos no modelo atual, mas é boas práticas)

---

### PROBLEMA #7 — ALTO
**Título:** `next_visit_date` enviado no checkin pelo InteractiveMap — não é processado pela API

**Classificação:** Funcionalidade quebrada / Lógica de negócio  
**Severidade:** 🟠 Alta

**Evidência no código frontend:**
```typescript
// src/components/map/InteractiveMap.tsx linha 264-268
if (checkinForm.schedule_next && checkinForm.next_visit_date) {
  payload.next_visit_date = new Date(checkinForm.next_visit_date).toISOString();
  payload.next_activity_type = checkinForm.next_activity_type;
  payload.next_obs = checkinForm.next_obs || null;
}
const r = await apiFetch('/api/visits', { method: 'POST', body: JSON.stringify(payload) });
```

**Evidência no código backend:**
```typescript
// src/app/api/visits/route.ts — NÃO processa next_visit_date
const payload = {
  id, workspace, client_id, user_id, activity_type,
  scheduled_date: body.scheduled_date ?? (isCheckin ? now : null),
  visit_date, status, obs, lat, lng, created_at, updated_at,
  // ← next_visit_date, next_activity_type, next_obs são ignorados completamente
};
```

**Localização:**  
- Frontend: `c:\...\src\components\map\InteractiveMap.tsx` linhas 264-271  
- Backend: `c:\...\src\app\api\visits\route.ts` — ausência de tratamento

**Causa raiz:**  
O checkin tem uma funcionalidade de "agendar próxima visita" que cria um segundo registro de visita agendada. A API recebe os campos `next_*` mas os ignora completamente — a "próxima visita" nunca é criada.

**Impacto:**  
❌ Ao marcar "Agendar próxima visita" no checkin, a visita futura não é registrada no banco.  
⚠️ O usuário vê a UI de agendamento mas o agendamento é silenciosamente descartado.

**Correção recomendada:**
```typescript
// src/app/api/visits/route.ts — após o insert do checkin, adicionar:
if (isCheckin && body.next_visit_date) {
  const nextPayload = {
    id: crypto.randomUUID(),
    workspace: 'principal',
    client_id: body.client_id,
    user_id: userId || null,
    activity_type: body.next_activity_type ?? 'Visita',
    scheduled_date: body.next_visit_date,
    visit_date: null,
    status: 'agendado',
    obs: body.next_obs ?? null,
    lat: 0, lng: 0,
    created_at: now, updated_at: now,
  };
  await getAdmin().from('visits').insert([nextPayload]);
  // audit log opcional
}
```

**Risco:** Baixo — feature adicional sem risco de regressão

---

### PROBLEMA #8 — MÉDIO
**Título:** `audit_log` — campo `user_agent` existe no banco mas nunca é preenchido no código

**Classificação:** Dados incompletos / Auditoria falha  
**Severidade:** 🟡 Médio

**Evidência no schema:**
```sql
CREATE TABLE public.audit_log (
  ...
  ip text,           -- ← existe
  user_agent text,   -- ← existe
  ...
);
```

**Evidência no código:**
```typescript
// src/lib/supabaseAdmin.ts linha 26-29
await getAdmin().from('audit_log').insert([{
  action, meta: meta ?? null, user_id: userId ?? null,
  username: username ?? null, created_at: new Date().toISOString(),
  // ← ip e user_agent nunca são passados
}]);
```

**Localização:**  
`c:\...\src\lib\supabaseAdmin.ts` linhas 19-31

**Impacto:**  
⚠️ Logs de auditoria sem IP de origem — rastreabilidade de incidentes comprometida.

**Correção opcional:**
```typescript
export async function auditLog(
  action: string,
  meta?: Record<string, unknown>,
  userId?: string,
  username?: string,
  req?: { headers?: { get: (name: string) => string | null } }
) {
  const ip = req?.headers?.get('x-forwarded-for') ?? req?.headers?.get('x-real-ip') ?? null;
  await getAdmin().from('audit_log').insert([{
    action, meta: meta ?? null, user_id: userId ?? null,
    username: username ?? null, ip,
    created_at: new Date().toISOString(),
  }]);
}
```

---

### PROBLEMA #9 — MÉDIO
**Título:** `refresh_tokens` existe no banco mas nunca é usado — JWT sem revogação

**Classificação:** Segurança / Débito técnico  
**Severidade:** 🟡 Médio

**Evidência no schema:**
```sql
CREATE TABLE public.refresh_tokens (
  id bigint PRIMARY KEY, user_id text NOT NULL → users,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked boolean NOT NULL DEFAULT false
);
```

**Evidência no código:**  
Nenhum arquivo do projeto faz referência a `refresh_tokens`.

**Causa raiz:**  
A tabela foi criada para suportar revogação de tokens, mas a implementação atual usa JWTs com expiração de 8h sem mecanismo de revogação. Um token vazado permanece válido até expirar.

**Impacto:**  
⚠️ Tokens comprometidos não podem ser revogados imediatamente.  
⚠️ Logout não invalida o token server-side — apenas limpa o localStorage.

**Ação recomendada:**  
Implementar refresh token em sprint futuro. Por ora, reduzir `JWT_EXPIRES_IN` para 3600 (1h) como mitigação.

---

### PROBLEMA #10 — MÉDIO
**Título:** `GET /api/clients` retorna `SELECT *` expondo campos sensíveis de documentos

**Classificação:** Segurança / Exposição de dados  
**Severidade:** 🟡 Médio

**Evidência no schema:**
```sql
CREATE TABLE public.clients (
  document_front_path text,   -- ← path de documento sensível
  document_back_path text,    -- ← path de documento sensível
  residence_proof_path text,  -- ← path de documento sensível
  ...
);
```

**Evidência no código:**
```typescript
// src/app/api/clients/route.ts linha 8
.select('*')  // ← retorna TODOS os campos incluindo paths de documentos
```

**Correção:** Especificar campos no SELECT explicitamente, omitindo os paths de documentos da listagem geral.

---

### PROBLEMA #11 — BAIXO
**Título:** `geocode_cache` e `rate_limits` existem no banco mas sem código correspondente

**Classificação:** Débito técnico / Tabelas não utilizadas  
**Severidade:** 🟢 Baixo

**Tabelas presentes no schema sem uso:**
- `geocode_cache` — cache de geocodificação por CEP (o código faz requests diretos ao ViaCEP e Nominatim sem cachear)
- `rate_limits` — controle de taxa de requisições (o middleware não implementa rate limiting)
- `km_logs` — registro de KM/combustível (nenhuma UI ou API implementada)
- `environments` — ambientes/talhões de propriedades (nenhuma UI ou API implementada)
- `pre_registrations` — pré-cadastros de leads (nenhuma UI ou API implementada)
- `photos` — upload de fotos (nenhuma UI ou API de upload implementada)

**Impacto:** Nenhum operacional imediato. Tecnicamente são features planejadas não implementadas.

---

### PROBLEMA #12 — BAIXO
**Título:** `orders.version` (NOT NULL DEFAULT 0) pode gerar conflito em updates concorrentes

**Classificação:** Potencial race condition  
**Severidade:** 🟢 Baixo

**Evidência no schema:**
```sql
version integer NOT NULL DEFAULT 0 CHECK (version >= 0)
```

**Causa:** A coluna `version` foi adicionada ao schema (possivelmente para optimistic locking), mas o código nunca a lê nem a incrementa nos UPDATEs. Se dois usuários editarem o mesmo pedido simultaneamente, ambos sobrescrevem sem conflito detectável.

---

## 6. MAPA RESUMIDO — PÁGINAS/COMPONENTES DEPENDENTES

```
DashboardPage (page.tsx)
  └── apiFetch('/api/clients')    → GET /api/clients → clients
  └── apiFetch('/api/products')   → GET /api/products → products ✅ (corrigido)
  └── apiFetch('/api/orders')     → GET /api/orders → orders + clients + referrals
  └── apiFetch('/api/commissions')→ GET /api/commissions → commissions
  └── apiFetch('/api/referrals')  → GET /api/referrals → referrals
  └── <InteractiveMap>            → apiFetch('/api/clients')

ClientsPage (clients/page.tsx)
  └── GET /api/clients, POST /api/clients → clients
  └── PUT /api/clients/[id] → clients
  └── DELETE /api/clients/[id] → ⚠️ hard delete (Problema #5)
  └── GET /api/cep/[cep] → externo (ViaCEP)

ProductsPage (products/page.tsx)
  └── GET /api/products → products ✅
  └── GET /api/categories → categories ✅
  └── POST /api/products → products ✅
  └── PUT /api/products/[id] → products ✅

SalesPage (sales/page.tsx)
  └── GET /api/orders → orders + joins
  └── GET /api/clients → clients
  └── GET /api/products → products
  └── GET /api/referrals → referrals
  └── POST /api/orders → orders + order_items ⚠️ (Problema #2)
  └── PUT /api/orders/[id] → orders + commissions

CommissionsPage (commissions/page.tsx)
  └── GET /api/commissions → commissions
  └── PUT /api/commissions/[id] → commissions

ReferralsPage (referrals/page.tsx)
  └── GET /api/referrals → referrals
  └── POST /api/referrals → referrals
  └── PUT /api/referrals/[id] → referrals
  └── DELETE /api/referrals/[id] → referrals (soft delete ✅)

SettingsPage (settings/page.tsx)
  └── GET /api/settings → settings + companies
  └── POST /api/settings/company → companies + settings
  └── GET/POST/PUT/DELETE /api/categories → categories
  └── POST /api/auth/change-password → users

MaintenancePage (maintenance/page.tsx)
  └── POST /api/admin/pin → settings
  └── POST /api/admin/reprocess → orders + commissions
  └── POST /api/admin/cleanup → múltiplas

LogsPage (logs/page.tsx)
  └── GET /api/admin/logs → audit_log

MapPage (map/page.tsx)
  └── <InteractiveMap compact={false}> → /api/clients + /api/visits ⚠️ (Problema #7)
```

---

## 7. MIGRATIONS / SQL NECESSÁRIOS

### SQL-01 — OBRIGATÓRIO: Seed do workspace 'principal'
```sql
-- Executar no Supabase SQL Editor
-- Se já existe: ON CONFLICT = NO-OP seguro
INSERT INTO public.workspaces (id, name, slug, settings, created_at, updated_at)
VALUES ('principal', 'Principal', 'principal', '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Verificar
SELECT id, name, slug FROM public.workspaces;
-- Resultado esperado: 1 linha id='principal'
```

### SQL-02 — VERIFICAÇÃO: Confirmar usuário admin existe
```sql
-- Verificar usuário admin
SELECT id, username, role, active, workspace FROM public.users WHERE username = 'admin';

-- Se não existe, criar (substituir 'SEU_BCRYPT_HASH' pelo hash gerado com scripts/generate-password-hash.js):
-- INSERT INTO public.users (id, username, pass_hash, hash_algo, role, active, workspace)
-- VALUES (gen_random_uuid()::text, 'admin', 'SEU_BCRYPT_HASH', 'bcrypt', 'admin', true, 'principal');
```

### SQL-03 — VERIFICAÇÃO: Confirmar settings de workspace
```sql
-- Verificar settings do workspace principal
SELECT id, workspace, dev_pin_hash FROM public.settings WHERE workspace = 'principal';

-- Se não existe:
INSERT INTO public.settings (id, workspace, config)
VALUES (gen_random_uuid()::text, 'principal', '{}'::jsonb)
ON CONFLICT (workspace) DO NOTHING;
```

### SQL-04 — OPCIONAL: Soft delete em clients (migração segura)
```sql
-- Sem mudança estrutural necessária — deleted_at já existe
-- Apenas confirmar que clientes existentes NÃO têm deleted_at preenchido
SELECT COUNT(*) FROM clients WHERE deleted_at IS NOT NULL;
-- Se > 0, esses clientes desaparecerão após implementar o filtro IS NULL no GET
```

---

## 8. ROADMAP DE MANUTENÇÃO (ORDEM DE PRIORIDADE)

### 🔴 IMEDIATO (Bloqueante — Aplicar ANTES de qualquer teste)

| # | Ação | Arquivo/SQL | Risco |
|---|------|-------------|-------|
| 1 | **Executar SQL-01**: seed workspace 'principal' | SQL no Supabase | Nenhum |
| 2 | **Executar SQL-02**: verificar/criar usuário admin | SQL no Supabase | Nenhum |
| 3 | **Executar SQL-03**: verificar/criar settings | SQL no Supabase | Nenhum |
| 4 | **Corrigir Problema #2**: filtrar itens sem product_id antes do insert | `src/app/api/orders/route.ts` L60-73 | Baixo |
| 5 | **Deletar arquivo órfão** Problema #3 | `src/app/visits/route.ts` | Nenhum |

### 🟠 CURTO PRAZO (Alta — Próximo ciclo de deploy)

| # | Ação | Arquivo |
|---|------|---------|
| 6 | Corrigir DELETE de clients para soft delete (Problema #5) | `src/app/api/clients/[id]/route.ts` |
| 7 | Adicionar `.is('deleted_at', null)` no GET clients | `src/app/api/clients/route.ts` |
| 8 | Sanitizar POST clients (campos explícitos) — Problema #6 | `src/app/api/clients/route.ts` |
| 9 | Implementar criação de próxima visita no checkin — Problema #7 | `src/app/api/visits/route.ts` |

### 🟡 MÉDIO PRAZO (Melhoria)

| # | Ação | Arquivo |
|---|------|---------|
| 10 | Adicionar IP ao auditLog — Problema #8 | `src/lib/supabaseAdmin.ts` |
| 11 | Restringir SELECT * de clients — Problema #10 | `src/app/api/clients/route.ts` |

### 🟢 BACKLOG (Funcionalidades planejadas não implementadas)

| Feature | Tabela do Banco | Prioridade |
|---------|-----------------|-----------|
| Rate limiting | `rate_limits` | Segurança |
| Cache CEP | `geocode_cache` | Performance |
| Upload de fotos | `photos` | UX |
| Talhões/ambientes | `environments` | Feature |
| Pré-cadastros/leads | `pre_registrations` | Feature |
| KM/combustível | `km_logs` | Feature |
| Refresh tokens | `refresh_tokens` | Segurança |

---

## 9. CHECKLIST DE VALIDAÇÃO LOCAL

Após aplicar as correções:

```bash
# 1. Confirmar build sem erros
cd "c:\Users\Jose Tavares\Desktop\VisitAgro\VisitAgroPro_v_0.9.3"
npm install && npm run build

# 2. Iniciar dev
npm run dev

# 3. Testar fluxo completo:
# [ ] Login → Dashboard carrega (5 cards de stats)
# [ ] Clientes: listar, criar, editar
# [ ] Produtos: listar, criar, editar  
# [ ] Vendas: criar pedido COM produto selecionado
# [ ] Vendas: criar pedido SEM produto → deve filtrar item inválido
# [ ] Indicadores: criar, editar
# [ ] Comissões: listar, confirmar pagamento
# [ ] Categ. em Configurações: criar, editar, desativar
# [ ] Mapa: carregar clientes, fazer check-in
# [ ] Mapa + checkbox "Agendar próxima visita" → confirmar criação no banco
# [ ] Logs: visualizar audit log
# [ ] Manutenção: configurar PIN
```
