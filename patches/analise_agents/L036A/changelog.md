- [📖 Central da documentação](./index.md)
- [🆕 Updates da versão 0.9.4](./updates-v094.md)

---

## [0.9.7] — 21/04/2026 — Lote L036-A

### 🔐 Controle de acesso por perfil (representative)

**Problema:** O sistema não filtrava pedidos por representante. Qualquer usuário autenticado via `GET /api/orders` recebia **todos os pedidos do workspace**, independentemente de ter criado ou não.

**Solução implementada:**
- API `GET /api/orders` agora filtra por `user_id` quando `role === 'representative'`
- `DashboardShell` oculta itens "Indicadores" e "Com. Indicadores" para representative
- Tabela de Vendas não exibe coluna "Ação" (seletor de status) para representative
- Tipo `UserRole` em `src/types/index.ts` inclui `'representative'`

**Arquivos alterados:**
- `src/app/api/orders/route.ts` — filtro por role no GET
- `src/components/layout/DashboardShell.tsx` — `hideForRepresentative`
- `src/app/dashboard/sales/page.tsx` — UX condicional
- `src/types/index.ts` — UserRole ampliado

**SQL aplicado:**
- `sql/050_representative_role.sql` — CHECK constraint + índices em `rep_regions`

**Matriz de permissão:**

| Role | Vendas (listar) | Vendas (editar status) | Indicadores | Com. Indicadores |
|------|-----------------|------------------------|-------------|------------------|
| admin | todos | sim | sim | sim |
| manager | todos | sim | sim | sim |
| user | todos | sim | sim | sim |
| representative | próprios | não | não | não |

**Dívida técnica L036-B:** Guard de propriedade em `PUT /api/orders/[id]` e `DELETE` para representative (risco mitigado pelo filtro de GET)