# L036-B — ETAPA 01 — EXECUÇÃO

**Lote:** L036-B  
**Título:** Central de Relatórios — comissões e vendas por representante (JSON)  
**Base:** L036-A + L037 (ZIP VisitAgro-main__14_.zip)  
**Data:** 2026-04-24  
**Executor:** Agente Executor (Claude)  
**Status:** ✅ Implementado — TypeScript limpo (0 erros)

---

## 1. Resumo executivo

Implementada a Central de Relatórios no dashboard do VisitAgro. São dois endpoints JSON independentes por domínio e uma única página de entrada no dashboard. As regras de acesso do L036-A foram integralmente preservadas: `representative` vê apenas dados próprios; `admin`/`manager` veem tudo e podem filtrar por representante. Nenhum schema foi alterado. Zero regressões nos tipos existentes.

---

## 2. Evidências usadas antes de escrever código

| Arquivo | O que foi verificado |
|---------|---------------------|
| `src/components/layout/DashboardShell.tsx` | Estrutura de `NAV_ITEMS`, interface `NavItem`, filtro `visibleNav`, imports lucide |
| `src/app/api/rep-commissions/route.ts` | Guard de acesso existente — padrão a espelhar |
| `src/app/api/orders/route.ts` | Guard `role === 'representative'` do L036-A |
| `src/app/api/representatives/route.ts` | Chave de resposta `representatives`, shape `{id, name, username}` |
| `src/lib/requestContext.ts` | Contrato de `getRequestContext` |
| `src/lib/representativeAccess.ts` | Helper existente (não usado nos relatórios — guard direto é suficiente) |
| `src/store/authStore.ts` | Shape do `user` no frontend |
| `src/lib/apiFetch.ts` | Helper de fetch autenticado para o frontend |
| `sql/schema_atual_supabase.sql` | Colunas reais de `rep_commissions` e `orders` |
| `src/app/dashboard/sales/page.tsx` | Padrão de page existente — referência de estilo |
| `docs/AGENTES.md` | Regras de entrega e sensibilidade de arquivos |

---

## 3. Causa raiz / contexto

L036-A implementou controle de acesso por perfil. L036-B cria a Central de Relatórios como extensão natural: os mesmos guards de acesso já existentes são reutilizados nos novos endpoints, sem duplicar lógica.

---

## 4. Escopo executado

| Item | Status |
|------|--------|
| `src/app/api/reports/rep-commissions/route.ts` | ✅ Criado |
| `src/app/api/reports/sales-by-representative/route.ts` | ✅ Criado |
| `src/app/dashboard/reports/page.tsx` | ✅ Criado |
| `src/components/layout/DashboardShell.tsx` | ✅ Alterado (nav item + import) |
| TypeScript `--noEmit` | ✅ 0 erros |
| PDF / WhatsApp | ❌ Fora do escopo (L036-B) |
| Alteração de schema | ❌ Não necessária |

---

## 5. Arquivos novos

### `src/app/api/reports/rep-commissions/route.ts` (118 linhas)

**Responsabilidade:** `GET /api/reports/rep-commissions`

**Controle de acesso:**
- `representative` → filtra `rep_id = userId` (mesmo guard do `GET /api/rep-commissions`)
- `admin` / `manager` → vê todos; aceita `?rep_id=` para filtrar

**Filtros via query string:** `date_from`, `date_to`, `status`, `rep_id`

**Resposta:**
```json
{
  "report": {
    "generated_at": "ISO",
    "filters": { ... },
    "summary": {
      "total_items": 0,
      "total_amount": 0,
      "total_pendente": 0,
      "total_paga": 0,
      "total_cancelada": 0
    },
    "items": [ ... ]
  }
}
```

---

### `src/app/api/reports/sales-by-representative/route.ts` (174 linhas)

**Responsabilidade:** `GET /api/reports/sales-by-representative`

**Controle de acesso:**
- `representative` → filtra `user_id = userId` (mesmo guard do `GET /api/orders`)
- `admin` / `manager` → vê todos; aceita `?rep_id=` para filtrar por `orders.user_id`

**Filtros via query string:** `date_from`, `date_to`, `status`, `rep_id`

**Resposta:**
```json
{
  "report": {
    "generated_at": "ISO",
    "filters": { ... },
    "summary": {
      "total_orders": 0,
      "total_revenue": 0,
      "total_pago": 0,
      "total_pendente": 0,
      "total_cancelado": 0
    },
    "by_representative": [ ... ],  // null para representative
    "items": [ ... ]
  }
}
```

**Enriquecimento:** busca nomes dos representantes via `users` quando `admin`/`manager` para popular `by_representative` e `rep_name` nos itens.

---

### `src/app/dashboard/reports/page.tsx` (550 linhas)

**Responsabilidade:** Central de Relatórios — entrada única no dashboard.

**Funcionalidades:**
- Tabs: Comissões | Vendas
- Filtros: data de, data até, status (por tab), representante (admin/manager)
- Summary cards com totalizadores
- Tabela consolidada por representante (admin/manager, tab Vendas)
- Tabela de itens individuais
- Rodapé com data/hora de geração
- Busca inicial automática ao trocar de tab

**Acesso ao dropdown de representantes:** chama `GET /api/representatives` (já restrito a admin/manager na API — sem alteração necessária).

---

## 6. Arquivo alterado

### `src/components/layout/DashboardShell.tsx`

**Sensibilidade:** Alta  
**Tipo de alteração:** Cirúrgica — 2 blocos localizados

**Alteração 1 — import lucide-react**

Âncora: `Award,` (última linha antes de `Menu,`)

```diff
+ BarChart2,
  Menu,
```

**Alteração 2 — NAV_ITEMS**

Âncora: linha após `rep-commissions` / antes de `map`

```diff
  { href: '/dashboard/rep-commissions', label: 'Com. Representantes', icon: <Award     className="w-4 h-4" /> },
+ { href: '/dashboard/reports',         label: 'Relatórios',          icon: <BarChart2 className="w-4 h-4" /> },
  { href: '/dashboard/map',             label: 'Mapa',                icon: <Map       className="w-4 h-4" /> },
```

**O que não foi tocado:** guards `adminOnly`/`hideForRepresentative`, lógica de `visibleNav`, logout, branding, responsividade do L037, todos os outros nav items.

---

## 7. Arquivos preservados sem alteração

- `src/app/api/rep-commissions/route.ts` — guard L036-A intacto
- `src/app/api/orders/route.ts` — guard L036-A intacto
- `src/types/index.ts` — tipos inalterados
- `src/app/dashboard/sales/page.tsx` — inalterado
- `src/lib/*` — nenhum helper alterado
- Todo schema SQL — sem migração necessária

---

## 8. Decisões arquiteturais

| Decisão | Motivo |
|---------|--------|
| Dois endpoints por domínio, não um genérico | Conforme instrução explícita do briefing |
| `as unknown as Array<...>` nos tipos Supabase | SDK sem tipos gerados retorna `GenericStringError` — padrão seguro para tipagem explícita |
| Guard direto (`role === 'representative'`) | Espelha exatamente o padrão já usado nas rotas existentes (L036-A) |
| `by_representative` calculado no servidor | Evita enviar todos os dados brutos ao frontend só para agrupamento |
| `null` para `by_representative` quando representative | Representative não precisa de consolidado — simplifica o frontend |
| Nav item visível para todos os perfis | Relatório próprio faz sentido para representative também |

---

## 9. Validação TypeScript

```
cd /home/claude/va14/VisitAgro-main
node_modules/.bin/tsc --noEmit
# Saída: (vazia — 0 erros)
# Exit code: 0
```

**Build na Vercel:** o único erro de build anterior era `Representative`/`RepRegion` ausentes em `@/types`. Esses tipos **já existem** no ZIP `VisitAgro-main__14_.zip` (L037 aplicada). O L036-B não remove nem renomeia nenhum export existente.

---

## 10. Validação SQL (conceitual)

Os endpoints leem diretamente das tabelas `rep_commissions` e `orders` com os mesmos filtros já usados pelas páginas existentes. Os totalizadores são calculados em JS sobre o dataset retornado — sem agregação SQL adicional. Isso garante que os valores batem com os dados reais do banco (mesma fonte, mesma query base).

Para validação no Supabase SQL Editor:

```sql
-- Verificar totais de comissões pendentes de um representante
SELECT
  rep_id,
  rep_name,
  COUNT(*)          AS total_items,
  SUM(amount)       AS total_amount,
  SUM(CASE WHEN status = 'pendente'  THEN amount ELSE 0 END) AS total_pendente,
  SUM(CASE WHEN status = 'paga'      THEN amount ELSE 0 END) AS total_paga,
  SUM(CASE WHEN status = 'cancelada' THEN amount ELSE 0 END) AS total_cancelada
FROM rep_commissions
WHERE workspace = 'principal'
GROUP BY rep_id, rep_name;

-- Verificar totais de vendas por representante
SELECT
  user_id,
  COUNT(*)         AS total_orders,
  SUM(total)       AS total_revenue,
  SUM(CASE WHEN status = 'pago'      THEN total ELSE 0 END) AS total_pago,
  SUM(CASE WHEN status = 'pendente'  THEN total ELSE 0 END) AS total_pendente,
  SUM(CASE WHEN status = 'cancelado' THEN total ELSE 0 END) AS total_cancelado
FROM orders
WHERE workspace = 'principal'
  AND deleted_at IS NULL
GROUP BY user_id;
```

---

## 11. Validação de fluxo

| Cenário | Comportamento esperado |
|---------|----------------------|
| Representative acessa `/dashboard/reports` | Vê apenas Comissões e Vendas próprias (sem filtro de representante) |
| Admin acessa `/dashboard/reports` | Vê dropdown de representantes; pode filtrar individualmente ou ver todos |
| Filtro por período aplicado | Endpoints retornam apenas registros no intervalo |
| Filtro por status aplicado | Apenas registros com aquele status retornam |
| Tab Vendas — admin | Tabela consolidada `by_representative` + tabela de pedidos |
| Tab Vendas — representative | Apenas tabela de pedidos próprios (sem consolidado) |
| Botão Aplicar sem filtros | Busca todos os registros (sem restrições extras) |

---

## 12. Riscos

| Risco | Mitigação |
|-------|-----------|
| Representative tenta passar `?rep_id=` manualmente na URL | API ignora `rep_id` quando `role !== admin/manager` — força `eq('rep_id', userId)` |
| Volume alto de pedidos sem paginação | Relatórios são ferramentas operacionais; paginação pode ser adicionada no L036-C se necessário |
| `GET /api/representatives` falha silenciosamente | `repList` fica vazio; dropdown mostra só "Todos" — degradação graciosa |
| Supabase sem tipos gerados | `as unknown as` é o padrão aceito para este projeto — sem risco de runtime |

---

## 13. Dívida técnica documentada

| ID | Descrição | Lote sugerido |
|----|-----------|---------------|
| DT-REP-01 | `PUT /api/orders/[id]` sem guard de propriedade para representative | L036-C |
| DT-REP-02 | Relatórios sem paginação | L036-C (se volume exigir) |
| DT-REP-03 | Export JSON / CSV / PDF dos relatórios | Lote futuro |
| DT-REP-04 | Envio por WhatsApp | Lote futuro |

---

## 14. Handoff para revisão

**O que revisar:**

1. **Controle de acesso:** verificar que `representative` não consegue ver dados alheios nos dois endpoints
2. **Totalizadores:** conferir que `summary` bate com query SQL equivalente
3. **Nav item:** confirmar que "Relatórios" aparece para todos os perfis na sidebar
4. **TypeScript:** `tsc --noEmit` deve retornar 0 erros
5. **Regressão L036-A:** `hideForRepresentative` nos itens Indicadores e Com. Indicadores deve continuar funcionando

**Arquivos para revisar (4):**
- `src/app/api/reports/rep-commissions/route.ts` — novo
- `src/app/api/reports/sales-by-representative/route.ts` — novo
- `src/app/dashboard/reports/page.tsx` — novo
- `src/components/layout/DashboardShell.tsx` — alterado (diff mínimo)
