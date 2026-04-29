# Patch V3 — Comissões de Representantes

# VisitAgro v0.9.4— MÓDULO REP_COMMISSIONS

# Gerado em: 2026-04-15

## ✅ O que este patch implementa

| Item | Descrição |
|------|-----------|
| Lacuna estrutural | Adição de `rep_id` e `rep_name` em `rep_commissions` |
| Geração automática | `generateRepCommissions` dispara quando pedido vai para `pago` |
| API GET | `GET /api/rep-commissions` — filtra por workspace, status, rep_id |
| API PUT | `PUT /api/rep-commissions/[id]` — atualiza status (admin/manager) |
| Frontend | Página `/dashboard/rep-commissions` com totalizadores e ações |
| Navegação | Link "Com. Representantes" adicionado ao DashboardShell |
| Tipos | `RepCommission` adicionado a `src/types/index.ts` |
| Não regressão | Módulo de comissões de indicadores (`/dashboard/commissions`) intacto |

---

## 📋 Diagnóstico antes do patch

**Problema central:**
A tabela `rep_commissions` existia no schema v0.9.4 com estrutura por item
(`order_item_id`, `product_id`, `qty`, `unit_price`, `rep_commission_pct`, `amount`),
mas **não tinha `rep_id`** — impossível identificar qual representante (user)
recebeu a comissão.

**Entidade "representante":**
`orders.user_id → users.id` — o usuário que registrou o pedido é o representante.

**Regra de cálculo encontrada no schema:**
- `order_items.rep_commission_pct` — percentual por item (herdado de `products.rep_commission_pct`)
- `amount = ROUND(item_total × (rep_commission_pct / 100), 2)`
- Uma linha por `order_item` com `rep_commission_pct > 0`

**Gatilho de geração:**
Transição `orders.status → 'pago'` (mesmo padrão das comissões de indicadores).

**Idempotência:**
Verifica existência por `order_item_id` antes de inserir — seguro para reprocessamento.

---

## 📁 Conteúdo do pacote

```
visitagro-rep-commissions-v3/
├── APLICAR_PATCH_V3.md                         ← este arquivo
├── sql/
│   └── 030_rep_commissions_rep_id.sql          ← migration (executar primeiro)
└── src/
    ├── lib/
    │   └── repCommissionHelper.ts              ← NOVO
    ├── types/
    │   └── index.ts                            ← ALTERADO (+ RepCommission)
    ├── components/
    │   └── layout/
    │       └── DashboardShell.tsx              ← ALTERADO (+ link nav)
    └── app/
        ├── api/
        │   ├── rep-commissions/
        │   │   ├── route.ts                    ← NOVO
        │   │   └── [id]/route.ts               ← NOVO
        │   └── orders/
        │       └── [id]/route.ts               ← ALTERADO (+ generateRepCommissions)
        └── dashboard/
            └── rep-commissions/
                └── page.tsx                    ← NOVO
```

---

## 🔢 Ordem de aplicação

### Passo 1 — Banco (OBRIGATÓRIO antes do deploy)

Executar no Supabase SQL Editor:

```
sql/030_rep_commissions_rep_id.sql
```

Este arquivo:
- Adiciona `rep_id TEXT REFERENCES public.users(id)` em `rep_commissions`
- Adiciona `rep_name TEXT` em `rep_commissions`
- Cria índices em `rep_id`, `workspace+status`, `order_id`, `order_item_id`
- Cria função `generate_rep_commissions(order_id, workspace)` como alternativa SQL
- Adiciona policy RLS `select_own_rep_commissions` (rep vê apenas as próprias)

**A migration é segura para reaplicação** (`ADD COLUMN IF NOT EXISTS`, `OR REPLACE`).

### Passo 2 — Arquivo novo (lib)

```
src/lib/repCommissionHelper.ts
```

### Passo 3 — Arquivo alterado (orders/[id])

```
src/app/api/orders/[id]/route.ts
```

Importa `generateRepCommissions` e o chama após `generateCommission` quando
`prev.status !== 'pago' && order.status === 'pago'`.

### Passo 4 — Arquivos novos (API)

```
src/app/api/rep-commissions/route.ts
src/app/api/rep-commissions/[id]/route.ts
```

### Passo 5 — Arquivo novo (Frontend)

```
src/app/dashboard/rep-commissions/page.tsx
```

### Passo 6 — Arquivos alterados (tipos e navegação)

```
src/types/index.ts
src/components/layout/DashboardShell.tsx
```

### Passo 7 — Validar build

```bash
npm run build
# Esperado: zero erros TypeScript
```

---

## 🔒 Regra de acesso implementada

| Role       | GET /api/rep-commissions | PUT /api/rep-commissions/[id] |
|------------|--------------------------|-------------------------------|
| admin      | Todos os registros       | ✅ Permitido                  |
| manager    | Todos os registros       | ✅ Permitido                  |
| user       | Apenas `rep_id = userId` | ❌ Bloqueado (403)            |

---

## 🔄 Fluxo de geração

```
PUT /api/orders/:id  { status: 'pago', version: N }
        ↓
   prev.status !== 'pago'  AND  order.status === 'pago'
        ↓
   generateCommission()          ← comissão indicador (existente)
        ↓
   generateRepCommissions()      ← NOVO: por order_item com pct > 0
        ↓
   Grava em rep_commissions      ← rep_id = order.user_id
```

---

## ✅ Checklist final

- [ ] `rep_commissions.rep_id` adicionado via migration
- [ ] Migration executada sem erro no Supabase
- [ ] Pedido marcado como pago gera comissões de representante
- [ ] Idempotência: reprocessar mesmo pedido não duplica registros
- [ ] `GET /api/rep-commissions` retorna apenas registros do workspace correto
- [ ] Usuário comum vê apenas suas próprias comissões
- [ ] Admin/manager pode marcar comissão como paga ou cancelada
- [ ] Página `/dashboard/rep-commissions` carrega sem erro
- [ ] Totalizadores refletem status corretamente
- [ ] Módulo `/dashboard/commissions` (indicadores) sem regressão
- [ ] `npm run build` sem erros TypeScript
- [ ] Multi-workspace: rep_commissions isoladas por workspace
- [ ] `rep_commission_pct = 0` nos itens: nenhuma linha gerada

---

## ⚠️ Arquivos NÃO incluídos (sem mudança necessária)

- `src/app/api/orders/route.ts` — POST já usa `commissionHelper`; rep_commissions
  são geradas apenas na transição para `pago` via PUT; pedido novo nasce como
  `pendente`, portanto nenhuma geração ocorre no POST.
- `src/lib/commissionHelper.ts` — não afetado
- `src/app/dashboard/commissions/page.tsx` — não afetado
- `src/app/dashboard/sales/page.tsx` — não afetado
- Todos os demais arquivos do projeto

---

## 🔙 Rollback

```sql
-- Remover função
DROP FUNCTION IF EXISTS public.generate_rep_commissions(text, text);

-- Remover policy adicionada
DROP POLICY IF EXISTS select_own_rep_commissions ON public.rep_commissions;

-- Remover colunas
ALTER TABLE public.rep_commissions DROP COLUMN IF EXISTS rep_id;
ALTER TABLE public.rep_commissions DROP COLUMN IF EXISTS rep_name;

-- Remover índices
DROP INDEX IF EXISTS idx_rep_commissions_rep_id;
DROP INDEX IF EXISTS idx_rep_commissions_workspace_status;
DROP INDEX IF EXISTS idx_rep_commissions_order_id;
DROP INDEX IF EXISTS idx_rep_commissions_order_item_id;
```

Restaurar `src/app/api/orders/[id]/route.ts` da versão anterior (Pacote 5).

---

## 📌 Pendências documentadas (fora do escopo deste patch)

1. **Reprocessamento**: a rota `/api/admin/reprocess` hoje só reprocessa comissões
   de indicadores. Futuramente pode incluir rep_commissions com lógica similar.

2. **Filtro por representante na UI admin**: a página atual tem `?rep_id=` no
   backend, mas a UI não expõe ainda um seletor de representante para admins.
   Extensão natural do próximo ciclo.

3. **Comprovante de pagamento** (`receipt_photo_ids`): a coluna existe na tabela
   mas o upload de foto não foi incluído neste patch mínimo.
