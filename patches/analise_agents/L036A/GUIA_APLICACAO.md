# GUIA DE APLICAÇÃO — Lote L036-A

**Lote:** L036-A  
**Título:** Controle de acesso por perfil — representative em Vendas e Comissões  
**Data:** 2026-04-21  
**Branch sugerida:** `feature/l036a-representative-access`

---

## 1. Resumo

Cinco arquivos modificados / criados:

| Arquivo | Tipo |
|---------|------|
| `sql/050_representative_role.sql` | Migration (novo) |
| `src/types/index.ts` | Alterado — `UserRole` + `'representative'` |
| `src/app/api/orders/route.ts` | Alterado — filtro GET por role |
| `src/app/dashboard/sales/page.tsx` | Alterado — UX por perfil |
| `src/components/layout/DashboardShell.tsx` | Alterado — nav filtrado |

---

## 2. Pré-requisitos

- L034 aplicado (repCommissionHelper com reprocess)
- Migration 030 aplicada (rep_id, rep_name em rep_commissions)
- `rep_regions` presente no banco (schema 2026-04-21 confirma ✅)

---

## 3. Ordem de Aplicação

```
PASSO 1 — Banco de dados
  Supabase SQL Editor:
  → sql/050_representative_role.sql

PASSO 2 — Código (sem ordem entre si)
  → src/types/index.ts
  → src/app/api/orders/route.ts
  → src/app/dashboard/sales/page.tsx
  → src/components/layout/DashboardShell.tsx

PASSO 3 — Documentação
  → docs/patches/050_representative_role.md
  → docs/lotes/L036-A_ETAPA_01_EXECUCAO.md

PASSO 4 — Deploy Vercel

PASSO 5 — Validação (seção abaixo)
```

---

## 4. Verificação Pré-aplicação

```sql
-- Confirmar que rep_regions existe:
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name = 'rep_regions';
-- Esperado: 1

-- Confirmar constraint atual de users.role:
SELECT consrc FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_role_check';
-- Esperado: conter 'admin','user','manager' (sem 'representative' ainda)
```

---

## 5. Validação Pós-aplicação

### 5.1 Banco

```sql
-- Constraint atualizado:
SELECT consrc FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_role_check';
-- Deve conter 'representative'

-- Índices criados:
SELECT indexname FROM pg_indexes
WHERE tablename = 'rep_regions'
  AND indexname IN ('idx_rep_regions_rep_id','idx_rep_regions_workspace');
-- Esperado: 2 linhas
```

### 5.2 Criar usuário de teste

```sql
-- Testar que o novo role é aceito:
INSERT INTO public.users (username, pass_hash, role, workspace)
VALUES ('rep_test', 'placeholder', 'representative', 'principal')
ON CONFLICT DO NOTHING;

-- Limpar após teste:
DELETE FROM public.users WHERE username = 'rep_test';
```

### 5.3 Fluxo de acesso

1. Logar com usuário `role = 'representative'`
2. `GET /api/orders` → retorna apenas pedidos `user_id = userId`
3. Sidebar → sem Indicadores, sem Com. Indicadores, sem Manutenção, sem Logs
4. Tabela Vendas → sem coluna "Ação"
5. Logar com `role = 'admin'` → todos os pedidos, todos os itens de nav

---

## 6. Riscos Conhecidos e Dívida Técnica

| Item | Nível | Lote sugerido |
|------|-------|---------------|
| `PUT /api/orders/[id]` sem guard de propriedade para representative | Baixo (UUID não exposto) | L036-B |
| `DELETE /api/orders/[id]` idem | Baixo | L036-B |
| `schema_atual_supabase.sql` do repo desatualizado | Cosmético | L036-B ou manutenção |
