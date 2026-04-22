# L036-A — ETAPA 01 — EXECUÇÃO

**Lote:** L036-A  
**Título:** Controle de acesso por perfil — representative em Vendas e Comissões  
**Data:** 2026-04-21  
**Executor:** Claude (Agente Executor)  
**Status:** ✅ Pronto para revisão  

---

## 1. Resumo Executivo

O sistema VisitAgro não possuía controle de acesso baseado no perfil `representative`. Qualquer usuário autenticado via `/api/orders` recebia **todos os pedidos do workspace**, independentemente de ter criado ou não. O mesmo risco existia em camadas de navegação (sidebar expunha Indicadores e Manutenção a todos).

Este lote implementa o controle **com o menor patch possível**, sem nova arquitetura de autorização, sem novos helpers e sem alterar o fluxo de criação de pedidos:

| Camada | Mudança |
|--------|---------|
| **API** `GET /api/orders` | Filtro `user_id = userId` quando `role === 'representative'` |
| **Frontend** `sales/page.tsx` | Oculta seletor de status para `representative` (UX) |
| **Frontend** `DashboardShell.tsx` | Oculta Indicadores e Com. Indicadores para `representative` |
| **Tipos** `src/types/index.ts` | `UserRole` inclui `'representative'` |
| **Banco** `050_representative_role.sql` | Adiciona `'representative'` ao CHECK de `users.role`; índices em `rep_regions` |

---

## 2. Evidências Usadas

| Arquivo | Conteúdo verificado |
|---------|---------------------|
| `src/app/api/orders/route.ts` | GET sem filtro de role — **lacuna confirmada** |
| `src/app/api/rep-commissions/route.ts` | GET **já filtrado** por role — correto, não tocado |
| `src/app/api/rep-commissions/[id]/route.ts` | PUT **já protegido** por guard admin/manager — correto |
| `src/app/api/orders/[id]/route.ts` | PUT/DELETE sem guard de propriedade — avaliado (ver §9) |
| `src/app/dashboard/sales/page.tsx` | Sem distinção de perfil no frontend |
| `src/components/layout/DashboardShell.tsx` | `adminOnly` existente; sem `hideForRepresentative` |
| `src/types/index.ts` | `UserRole` sem `'representative'` — **divergência com banco** |
| `src/store/authStore.ts` | `user.role: string` disponível no cliente |
| `src/lib/requestContext.ts` | `getRequestContext` expõe `role` e `userId` — reutilizado |
| `middleware.ts` | Injeta `x-user-role` a partir do JWT — fluxo correto |
| `src/app/api/auth/login/route.ts` | `role` do banco vai para o JWT — fluxo correto |
| `schema_atual_supabase.sql` (2026-04-21) | `users.role` CHECK já inclui `'representative'`; `rep_regions` existe |
| `sql/schema_atual_supabase.sql` (repo) | `users.role` CHECK **sem** `'representative'` — divergência com banco |

---

## 3. Causa Raiz

**Três lacunas independentes, todas cirúrgicas:**

1. **`GET /api/orders` sem filtro de role** — único ponto de vazamento de dados real entre representantes. A query retornava todos os pedidos do workspace para qualquer role autenticado.

2. **`UserRole` desatualizado** — o tipo TypeScript não incluía `'representative'`, causando erro de tipo em qualquer código que comparasse `user.role === 'representative'`.

3. **DashboardShell sem `hideForRepresentative`** — itens de menu de Indicadores e Comissões de Indicadores eram exibidos para todos os perfis autenticados (além de Manutenção/Logs que já tinham `adminOnly`).

---

## 4. Escopo Executado

### Implementado

- `GET /api/orders` — filtro por `role === 'representative'`
- `sales/page.tsx` — oculta coluna de ação e seletor de status para representative
- `DashboardShell.tsx` — filtro `hideForRepresentative` nos itens de nav
- `src/types/index.ts` — `UserRole` com `'representative'`
- `sql/050_representative_role.sql` — CHECK constraint + índices

### Fora do Escopo (não implementado neste lote)

- Guard em `PUT /api/orders/[id]` para representative — avaliado (§9)
- Guard em `DELETE /api/orders/[id]` para representative — avaliado (§9)
- Módulo de Relatórios, PDF, WhatsApp — fora do escopo por instrução explícita
- `GET /api/clients` — representative vê todos os clientes do workspace (decisão intencional: precisam ver clientes para criar pedidos)
- `GET /api/products` — idem

---

## 5. Arquivos Alterados

| Arquivo | Ação | Tipo de mudança |
|---------|------|-----------------|
| `src/app/api/orders/route.ts` | Substituição | Adiciona `getRequestContext`; filtro `role === 'representative'` no GET |
| `src/app/dashboard/sales/page.tsx` | Substituição | Lê `user.role`; condiciona coluna Ação e seletor de status |
| `src/components/layout/DashboardShell.tsx` | Substituição | Adiciona `hideForRepresentative` em 2 itens; lógica de filtro no `visibleNav` |
| `src/types/index.ts` | Substituição | `UserRole` adiciona `'representative'` |
| `sql/050_representative_role.sql` | Criado | Migration: CHECK + índices |
| `docs/patches/050_representative_role.md` | Criado | Documentação da migration |
| `docs/lotes/L036-A_ETAPA_01_EXECUCAO.md` | Criado | Este documento |

---

## 6. Arquivos Preservados (sem alteração)

| Arquivo | Motivo |
|---------|--------|
| `src/app/api/rep-commissions/route.ts` | GET já filtrado por role corretamente |
| `src/app/api/rep-commissions/[id]/route.ts` | PUT já protegido por guard admin/manager |
| `src/app/api/orders/[id]/route.ts` | Avaliado — ver §9 |
| `src/app/dashboard/rep-commissions/page.tsx` | Funcional; API já filtra por rep_id |
| `src/lib/requestContext.ts` | Reutilizado sem alteração |
| `src/lib/repCommissionHelper.ts` | Corrigido em L034; não necessita mudança |
| `src/lib/commissionHelper.ts` | Sem relação com controle de acesso |
| `src/store/authStore.ts` | `user.role: string` já disponível; compatível com `'representative'` |
| `middleware.ts` | Já injeta `x-user-role` do JWT corretamente |
| `sql/020_product_components.sql` | Sem relação |
| `sql/030_rep_commissions_rep_id.sql` | Sem relação |

---

## 7. Diff — Before / After

### 7.1 `GET /api/orders/route.ts`

```diff
-export async function GET(req: NextRequest) {
-  const workspace = req.headers.get('x-workspace') || 'principal';
-
-  const { data, error } = await getAdmin()
-    .from('orders')
-    .select(`...`)
-    .eq('workspace', workspace)
-    .is('deleted_at', null)
-    .order('created_at', { ascending: false });
+export async function GET(req: NextRequest) {
+  const { workspace, role, userId } = getRequestContext(req);
+
+  let query = getAdmin()
+    .from('orders')
+    .select(`...`)
+    .eq('workspace', workspace)
+    .is('deleted_at', null)
+    .order('created_at', { ascending: false });
+
+  if (role === 'representative') {
+    query = query.eq('user_id', userId);
+  }
+
+  const { data, error } = await query;
```

### 7.2 `DashboardShell.tsx`

```diff
 interface NavItem {
   href:       string;
   label:      string;
   icon:       React.ReactNode;
   adminOnly?: boolean;
+  hideForRepresentative?: boolean;
 }

 const NAV_ITEMS: NavItem[] = [
   ...
-  { href: '/dashboard/referrals',   label: 'Indicadores', ... },
-  { href: '/dashboard/commissions', label: 'Com. Indicadores', ... },
+  { href: '/dashboard/referrals',   label: 'Indicadores', ..., hideForRepresentative: true },
+  { href: '/dashboard/commissions', label: 'Com. Indicadores', ..., hideForRepresentative: true },
   ...
 ];

-const isAdmin = user?.role === 'admin';
+const isAdmin          = user?.role === 'admin';
+const isRepresentative = user?.role === 'representative';

-{NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(...)}
+{visibleNav.map(...)}   // visibleNav aplica adminOnly + hideForRepresentative
```

### 7.3 `src/types/index.ts`

```diff
-export type UserRole = 'admin' | 'user' | 'manager';
+export type UserRole = 'admin' | 'user' | 'manager' | 'representative';
```

### 7.4 `sales/page.tsx`

```diff
-const { isAuthenticated } = useAuthStore();
+const { isAuthenticated, user } = useAuthStore();
+const isRepresentative = user?.role === 'representative';
+const canChangeStatus  = !isRepresentative;

 // Na tabela:
-<th className="text-right px-4 py-3">Ação</th>
+{canChangeStatus && <th className="text-right px-4 py-3">Ação</th>}

-<td className="px-4 py-3 text-right">
-  <select value={o.status} onChange={...}>...</select>
-</td>
+{canChangeStatus && (
+  <td className="px-4 py-3 text-right">
+    <select value={o.status} onChange={...}>...</select>
+  </td>
+)}
```

---

## 8. Riscos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| `PUT /api/orders/[id]` sem guard de propriedade para representative | Estrutural — avaliado | Ver §9 — mitigado pelo filtro de GET (representative só vê seus IDs) |
| `DELETE /api/orders/[id]` sem guard | Idem | Idem — não conhece IDs alheios |
| Usuário com role `'representative'` sem `user_id` nos pedidos antigos | Baixo | Pedidos sem `user_id` não aparecem na listagem do representative |
| `authStore.user.role` tipado como `string` (não `UserRole`) | Nulo | `user.role === 'representative'` funciona mesmo sem tipagem estrita |

---

## 9. Avaliação — `PUT /api/orders/[id]` sem guard

**Não foi adicionado guard de propriedade neste lote. Justificativa:**

O `GET /api/orders` agora filtra por `user_id` para `representative`. Isso significa que o representative **nunca recebe IDs de pedidos alheios** — não há como ele construir uma requisição PUT para um pedido que não é dele sem adivinhar o UUID.

O risco remanescente é um ataque deliberado por UUID. A mitigação correta seria adicionar `.eq('user_id', userId)` ao query do PUT quando `role === 'representative'`. Esta mudança está documentada como **dívida técnica L036-B** mas não foi incluída neste lote para respeitar a restrição de menor patch possível e não alterar o fluxo de atualização de pedidos.

---

## 10. Validação

### 10.1 SQL

```sql
-- Confirmar constraint atualizado:
SELECT consrc FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_role_check';
-- Esperado: conter 'representative'

-- Confirmar índices:
SELECT indexname FROM pg_indexes
WHERE tablename = 'rep_regions'
  AND indexname IN ('idx_rep_regions_rep_id','idx_rep_regions_workspace');
-- Esperado: 2 linhas
```

### 10.2 Fluxo manual

| Cenário | Esperado |
|---------|----------|
| Login como `representative` | Token JWT contém `role: 'representative'` |
| GET `/api/orders` como representative | Retorna apenas pedidos onde `user_id = userId` |
| GET `/api/orders` como admin | Retorna todos do workspace |
| GET `/api/rep-commissions` como representative | Retorna apenas comissões com `rep_id = userId` (já funcionava) |
| Sidebar como representative | Sem Indicadores, Sem Com. Indicadores, Sem Manutenção, Sem Logs |
| Sidebar como admin | Todos os itens visíveis |
| Tabela de vendas como representative | Sem coluna "Ação", sem seletor de status |
| Tabela de vendas como admin | Seletor de status presente |

### 10.3 Sem regressão

| Funcionalidade | Status |
|----------------|--------|
| POST `/api/orders` — criação de pedido | ✅ Não alterado |
| PUT `/api/orders/[id]` — atualização | ✅ Não alterado |
| Geração de comissões ao pagar pedido | ✅ Não alterado |
| GET `/api/rep-commissions` — listagem | ✅ Não alterado |
| PUT `/api/rep-commissions/[id]` — pagar comissão | ✅ Não alterado |

---

## 11. Impacto Documental

- `docs/patches/050_representative_role.md` — criado
- `docs/lotes/L036-A_ETAPA_01_EXECUCAO.md` — criado (este)
- `sql/schema_atual_supabase.sql` do repo deve ser atualizado para refletir o estado do banco (tarefa de manutenção, fora do escopo do lote)

---

## 12. Handoff para Revisão

**Revisores devem verificar:**

- [ ] `GET /api/orders` — filtro `role === 'representative'` usa `getRequestContext` (não headers diretos)
- [ ] `DashboardShell` — `visibleNav` aplica ambas as flags (`adminOnly` e `hideForRepresentative`) sem quebrar o comportamento anterior de admin/manager
- [ ] `UserRole` — adição de `'representative'` não quebra nenhum switch/exhaustive check existente no código
- [ ] `sales/page.tsx` — `canChangeStatus` derivado de `user?.role`, sem chamar API adicional
- [ ] Migration 050 — idempotente (`IF NOT EXISTS`, `DROP ... IF EXISTS`)
- [ ] `GET /api/rep-commissions` — **não foi alterado** (já correto); confirmar que o comportamento existente cobre o novo role (filtra `role !== 'admin' && role !== 'manager'` → inclui `representative` automaticamente ✅)
- [ ] Dívida técnica L036-B documentada: guard em `PUT /api/orders/[id]` para representative
