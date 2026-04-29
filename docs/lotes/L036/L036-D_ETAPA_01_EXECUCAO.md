# L036-D — ETAPA 01 — EXECUÇÃO

**Lote:** L036-D  
**Título:** Guard de propriedade em orders/[id] + WhatsApp para vendas  
**Base:** L036-C + L037 (ZIP VisitAgro-main__14_.zip)  
**Data:** 2026-04-26  
**Executor:** Agente Executor (Claude)  
**Status:** ✅ Implementado — TypeScript limpo (0 erros)

---

## 1. Resumo executivo

L036-D fecha as três dívidas técnicas documentadas no L036-C:

1. **DT-REP-01** — `PUT /api/orders/[id]` e `DELETE /api/orders/[id]` agora recusam com 403 quando um `representative` tenta operar sobre pedido de outro usuário. Guard mínimo e rastreável via `auditLog`.
2. **DT-REP-05** — Endpoint `GET /api/reports/sales-by-representative/whatsapp` criado. Texto formatado com resumo, agrupamento por representante (admin) e detalhe de pedidos (até 15), pronto para colar no WhatsApp.
3. **UI** — Botão "Copiar resumo WhatsApp" na Central de Relatórios agora funciona nas duas tabs (Comissões e Vendas), roteando para o endpoint correto conforme a tab ativa.

Zero alteração de schema. Zero regressão nos contratos JSON do L036-B. TypeScript: 0 erros.

---

## 2. Evidências usadas

| Arquivo | O que foi verificado |
|---------|---------------------|
| `src/app/api/orders/[id]/route.ts` | Código real do PUT/DELETE — onde e como inserir o guard |
| `src/app/api/orders/route.ts` | Padrão do guard L036-A no GET — replicado para PUT/DELETE |
| `src/lib/requestContext.ts` | Contrato de `role` e `userId` via headers |
| `src/app/api/reports/rep-commissions/whatsapp/route.ts` | Padrão exato a espelhar para o endpoint de vendas |
| `src/app/dashboard/reports/page.tsx` | Estado atual do botão WhatsApp (condição `tab === 'commissions'`) |
| `src/lib/reports/helpers.ts` | Helpers disponíveis: `fmtBRL`, `fmtDate`, `buildPeriodLabel`, `fetchCompanyInfo` |
| `docs/AGENTES.md` | Regras de entrega, sensibilidade de arquivos, auditLog em mutações |
| `docs/lotes/L036-C_ETAPA_01_EXECUCAO.md` | Dívida técnica documentada — escopo deste lote |

---

## 3. Escopo executado

| Item | DT | Status |
|------|----|--------|
| Guard de propriedade no `PUT /api/orders/[id]` para representative | DT-REP-01 | ✅ |
| Guard de propriedade no `DELETE /api/orders/[id]` para representative | DT-REP-01 | ✅ |
| `GET /api/reports/sales-by-representative/whatsapp` | DT-REP-05 | ✅ |
| Botão WhatsApp visível em ambas as tabs da Central de Relatórios | DT-REP-05 | ✅ |
| Paginação nos relatórios | DT-REP-06 | ❌ Não implementado — volume atual não justifica |
| Export CSV | DT-REP-07 | ❌ Fora do escopo |

---

## 4. Arquivos alterados

### `src/app/api/orders/[id]/route.ts`

**Sensibilidade:** Alta  
**Tipo:** Diff mínimo — 2 blocos inseridos, nenhum bloco removido

#### Alteração 1 — Guard no `PUT`

**Âncora:** `if (prevError || !prev) {` (após fetch do pedido anterior)  
**Operação:** Inserir após

```typescript
// ── Guard L036-D: representative só pode alterar pedidos próprios ─────────
if (role === 'representative' && prev.user_id !== userId) {
  await auditLog(
    '[VENDA] Tentativa de PUT não autorizada por representative',
    { order_id: params.id, workspace, attempted_by: userId },
    userId
  );
  return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
}
```

**Impacto:** Representative com ID alheio via URL recebe 403. Tentativa registrada no auditLog. Admin/manager/user não são afetados (`role !== 'representative'`).

**Pré-requisito:** `role` agora desestruturado de `getRequestContext` no PUT (era apenas `userId` antes).

#### Alteração 2 — Guard no `DELETE`

**Âncora:** `export async function DELETE(` (início da função)  
**Operação:** Substituir desestruturação + inserir guard antes do update

```typescript
const { workspace, userId, role } = getRequestContext(req);

if (role === 'representative') {
  const { data: prev } = await getAdmin()
    .from('orders')
    .select('user_id')
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .maybeSingle();

  if (!prev || prev.user_id !== userId) {
    await auditLog('[VENDA] Tentativa de DELETE não autorizada por representative', ...);
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
}
```

**Impacto:** 1 query extra somente quando `role === 'representative'`. Admin/manager/user: zero overhead.

---

### `src/app/dashboard/reports/page.tsx`

**Sensibilidade:** Alta  
**Tipo:** Diff mínimo — 2 alterações cirúrgicas

#### Alteração 1 — `handleCopyWhatsApp` roteia por tab

**Âncora:** `// ── copiar resumo WhatsApp`  
**Antes:**
```typescript
const res = await apiFetch(`/api/reports/rep-commissions/whatsapp${buildQs()}`);
```
**Depois:**
```typescript
const base = tab === 'commissions'
  ? '/api/reports/rep-commissions/whatsapp'
  : '/api/reports/sales-by-representative/whatsapp';
const res = await apiFetch(`${base}${buildQs()}`);
```

#### Alteração 2 — Botão WhatsApp visível em ambas as tabs

**Âncora:** bloco do botão WhatsApp nos ações de exportação  
**Antes:** botão envolto em `{tab === 'commissions' && (...)}` — invisível na tab Vendas  
**Depois:** botão renderizado incondicionalmente — visível em ambas as tabs

---

## 5. Arquivo criado

### `src/app/api/reports/sales-by-representative/whatsapp/route.ts`

**Responsabilidade:** `GET /api/reports/sales-by-representative/whatsapp`

**Controle de acesso:**
- `representative` → filtra `user_id = userId`
- `admin/manager` → todos; aceita `?rep_id=`

**Conteúdo do texto gerado:**
1. Cabeçalho: empresa, título, período, representante, data de geração
2. Resumo: total pedidos, receita total, pago, pendente, cancelado
3. Por representante (admin consolidado): top 10 por receita + truncamento
4. Detalhe: até 15 pedidos com emoji de status, número, data, cliente, valor
5. Rodapé: assinatura do sistema

**Resposta:** `{ text: string }`

---

## 6. Arquivos preservados sem alteração

- `src/app/api/orders/route.ts` — GET L036-A intacto
- `src/app/api/reports/rep-commissions/route.ts` — JSON L036-B intacto
- `src/app/api/reports/sales-by-representative/route.ts` — JSON L036-B intacto
- `src/app/api/reports/rep-commissions/pdf/route.ts` — PDF L036-C intacto
- `src/app/api/reports/sales-by-representative/pdf/route.ts` — PDF L036-C intacto
- `src/app/api/reports/rep-commissions/whatsapp/route.ts` — WhatsApp L036-C intacto
- `src/lib/reports/helpers.ts` — helpers L036-C intactos
- `src/lib/reports/pdfBuilder.ts` — builder L036-C intacto
- `src/types/index.ts` — tipos intactos
- Todo schema SQL — sem migração

---

## 7. Validação TypeScript

```
cd /home/claude/va14/VisitAgro-main
node_modules/.bin/tsc --noEmit
# Saída: (vazia — 0 erros)
# Exit code: 0
```

---

## 8. Validação de fluxo

| Cenário | Comportamento esperado |
|---------|----------------------|
| Representative tenta `PUT /api/orders/[id]` com ID alheio | 403 + auditLog |
| Representative tenta `DELETE /api/orders/[id]` com ID alheio | 403 + auditLog |
| Representative opera sobre próprio pedido via PUT/DELETE | Funciona normalmente |
| Admin opera sobre qualquer pedido via PUT/DELETE | Sem alteração — guard não ativa |
| Botão WhatsApp na tab Comissões | Chama `/api/reports/rep-commissions/whatsapp` |
| Botão WhatsApp na tab Vendas | Chama `/api/reports/sales-by-representative/whatsapp` |
| Representative copia WhatsApp — tab Vendas | Texto apenas com seus pedidos |
| Admin copia WhatsApp — tab Vendas sem filtro rep | Texto consolidado com agrupamento por representante |
| Admin copia WhatsApp — tab Vendas com rep selecionado | Texto individual do representante escolhido |

---

## 9. Riscos

| Risco | Mitigação |
|-------|-----------|
| `prev.user_id` nulo em pedido antigo — representative bloqueado indevidamente | Guard usa `prev.user_id !== userId` — se `user_id` for null, representative é bloqueado (comportamento conservador seguro). Admin não é afetado. |
| Query extra no DELETE para representative | Custo mínimo — apenas quando `role === 'representative'`; admin/manager: zero overhead |
| `navigator.clipboard` indisponível em HTTP | Vercel usa HTTPS em produção — sem risco em deploy |

---

## 10. Dívida técnica remanescente

| ID | Descrição | Status |
|----|-----------|--------|
| DT-REP-01 | Guard PUT/DELETE orders/[id] para representative | ✅ Fechado neste lote |
| DT-REP-05 | WhatsApp para relatório de vendas | ✅ Fechado neste lote |
| DT-REP-06 | Paginação nos relatórios | Postergado — sem demanda atual |
| DT-REP-07 | Export CSV | Lote futuro |

---

## 11. Handoff para revisão

**Arquivos para revisar (3):**
1. `src/app/api/orders/[id]/route.ts` — guard PUT + guard DELETE
2. `src/app/api/reports/sales-by-representative/whatsapp/route.ts` — novo endpoint
3. `src/app/dashboard/reports/page.tsx` — roteamento WhatsApp por tab

**O que revisar:**
1. Guard PUT: `role === 'representative' && prev.user_id !== userId` → 403
2. Guard DELETE: query extra + mesma lógica de propriedade
3. `handleCopyWhatsApp`: rota correta por tab
4. Botão WhatsApp visível em ambas as tabs
5. `tsc --noEmit` → exit 0
6. Regressão: admin/manager/user sem impacto nos guards
