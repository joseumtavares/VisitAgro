# L031_rep_commissions_post_fix — ETAPA 01 EXECUÇÃO

## 1. Resumo executivo

Patch mínimo com 3 correções cirúrgicas no módulo de comissões de representantes:

1. **`src/lib/repCommissionHelper.ts`** — o insert em `rep_commissions` não verificava o erro retornado antes de incrementar `created`, gerando falso positivo de sucesso silencioso.
2. **`src/app/api/orders/route.ts` (POST)** — o campo `user_id` não era gravado explicitamente no pedido (vinha do spread do body sem garantia), e `generateRepCommissions` nunca era chamado quando o pedido nascia já como `pago`.
3. **`src/app/dashboard/sales/page.tsx`** — a coluna "Comissão" e o resumo "Comissão indicador" no modal misturavam comissão de indicador (que pertence a `/dashboard/commissions`) na tela de vendas. Ambos foram removidos.

Nenhum arquivo de banco foi alterado. A tabela `rep_commissions` e as colunas `rep_id`, `rep_name` em `orders` já existem pelo patch `sql/030_rep_commissions_rep_id.sql` aplicado anteriormente.

---

## 2. Evidências usadas

- `src/app/api/orders/route.ts` — documento índice 48 (POST original)
- `src/app/api/orders/[id]/route.ts` — documento índice 92 (PUT com geração de rep_commissions já funcionando — padrão replicado para o POST)
- `src/lib/repCommissionHelper.ts` — arquivo do zip `visitagro-rep-commissions-v3.zip` + documento índice 51
- `src/app/dashboard/sales/page.tsx` — documento índice 93
- `sql/030_rep_commissions_rep_id.sql` — documento índice 63 (confirma colunas rep_id/rep_name já existentes)

---

## 3. Causa raiz

### Bug A — repCommissionHelper.ts
```ts
// ANTES (linha ~85)
await admin.from('rep_commissions').insert([{...}]);
created++;   // ← incrementa mesmo se o insert falhou silenciosamente
```
O Supabase JS retorna `{ data, error }`. Ignorar o `error` significa que falhas de banco (FK violation, constraint, etc.) ficavam invisíveis e `created` ficava com valor maior do que o real.

### Bug B — orders/route.ts POST: user_id não persistido
```ts
// ANTES
const { data: order, error } = await admin.from('orders').insert([{
  ...orderData,   // ← body sem garantia de user_id
  id: orderId,
  workspace,
  // user_id nunca setado explicitamente
}])
```
O frontend (`/dashboard/sales`) não inclui `user_id` no payload. O spread de `orderData` não garante o campo. Resultado: `orders.user_id = null` em todos os pedidos criados pelo POST.

Como `generateRepCommissions` tem como primeira guarda `if (!order.user_id) return`, nenhuma comissão de representante era gerada — mesmo quando o pedido nascia como `pago`.

### Bug C — orders/route.ts POST: generateRepCommissions nunca chamado
```ts
// ANTES — só gerava comissão de indicador, nunca de representante
if (body.status === 'pago' && body.referral_id && commissionValue > 0) {
  await generateCommission(admin, order, commissionValue);
}
// ← generateRepCommissions ausente
```

### Bug D — sales/page.tsx: comissão de indicador misturada na UI de vendas
A coluna "Comissão" exibia `o.commission_value` (campo do indicador/referral), e o modal mostrava "Comissão indicador". A separação correta é: indicador → `/dashboard/commissions`; representante → `/dashboard/rep-commissions`.

---

## 4. Escopo executado

| Item | Ação |
|------|------|
| `src/lib/repCommissionHelper.ts` | Verifica `insertError` antes de `created++`; registra log de erro; faz `skipped++` em caso de falha |
| `src/app/api/orders/route.ts` | Seta `user_id: userId ?? null` explicitamente no insert; chama `generateRepCommissions` quando `status === 'pago'`; importa o helper |
| `src/app/dashboard/sales/page.tsx` | Remove coluna "Comissão" da tabela; remove linha "Comissão indicador" do modal; remove `commission_value` do payload enviado |

---

## 5. Arquivos alterados

| Arquivo | Sensibilidade | Tipo |
|---------|--------------|------|
| `src/lib/repCommissionHelper.ts` | Média | Correção de bug (error handling) |
| `src/app/api/orders/route.ts` | Alta | Correção de bug (user_id + generateRepCommissions) |
| `src/app/dashboard/sales/page.tsx` | Média | Remoção de UI incorreta |

---

## 6. Arquivos preservados

- `src/app/api/orders/[id]/route.ts` — sem alteração; PUT já funciona corretamente
- `src/app/api/rep-commissions/route.ts` — sem alteração
- `src/app/api/rep-commissions/[id]/route.ts` — sem alteração
- `src/app/dashboard/rep-commissions/page.tsx` — sem alteração
- `src/app/dashboard/commissions/page.tsx` — sem alteração (tela de indicadores correta)
- `sql/030_rep_commissions_rep_id.sql` — sem alteração (já aplicado)
- Todos os demais arquivos do projeto

---

## 7. Diffs por arquivo

### 7.1 `src/lib/repCommissionHelper.ts`

**Antes** (linha ~85, dentro do loop):
```ts
await admin.from('rep_commissions').insert([{ ... }]);
created++;
```

**Depois**:
```ts
const { error: insertError } = await admin.from('rep_commissions').insert([{ ... }]);

if (insertError) {
  console.error('[repCommissionHelper] insert error:', insertError.message, { order_item_id: item.id });
  skipped++;
  continue;
}

created++;
```

---

### 7.2 `src/app/api/orders/route.ts`

**Adição de import** (topo do arquivo):
```ts
import { generateRepCommissions } from '@/lib/repCommissionHelper';
```

**Antes** (insert do pedido):
```ts
const { data: order, error } = await admin.from('orders').insert([{
  ...orderData,
  id: orderId,
  workspace,
  commission_value: commissionValue,
  commission_type: orderData.commission_type || 'percent',
  created_at: now,
  updated_at: now,
}])
```

**Depois**:
```ts
const { data: order, error } = await admin.from('orders').insert([{
  ...orderData,
  id: orderId,
  workspace,
  user_id: userId ?? null,   // ← explícito; não depende do body
  commission_value: commissionValue,
  commission_type: orderData.commission_type || 'percent',
  created_at: now,
  updated_at: now,
}])
```

**Antes** (depois do insert de items, sem rep_commissions):
```ts
if (body.status === 'pago' && body.referral_id && commissionValue > 0) {
  await generateCommission(admin, order, commissionValue);
}
// fim do POST
```

**Depois**:
```ts
if (body.status === 'pago' && body.referral_id && commissionValue > 0) {
  await generateCommission(admin, order, commissionValue);
}

// Comissões de representante no POST
if (body.status === 'pago' && userId && itemsPayload.length > 0) {
  const { created, skipped } = await generateRepCommissions(admin, order, itemsPayload);
  if (created > 0) {
    await auditLog('[COMISSÃO REP] Geradas automaticamente (POST)', { order_id: orderId, created, skipped, workspace }, userId);
  }
}
```

**Refatoração menor**: `itemsPayload` declarado com `let itemsPayload: any[] = []` fora do `if (orderItems.length)` para estar acessível no bloco de rep_commissions.

---

### 7.3 `src/app/dashboard/sales/page.tsx`

**Antes** — header da tabela:
```tsx
<th ...>Comissão</th>   // ← removido
```

**Antes** — row da tabela:
```tsx
<td ...>{Number(o.commission_value??0).toLocaleString('pt-BR',...)}</td>   // ← removido
```

**Antes** — modal totais:
```tsx
{form.referral_id&&<div ...><span>Comissão indicador</span><span>{calcCommission()...}</span></div>}
// ← bloco inteiro removido
```

**Antes** — payload do save:
```ts
const payload = { ...form, total, commission_value: calcCommission() };
// ← commission_value removido (não pertence ao POST de vendas)
```

**Depois** — modal totais (simplificado):
```tsx
<div className="bg-dark-900 rounded-lg p-4">
  <div className="flex justify-between text-sm">
    <span className="text-dark-400">Total</span>
    <span className="text-white font-bold">{total.toLocaleString(...)}</span>
  </div>
</div>
```

---

## 8. Riscos

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Pedidos antigos sem `user_id` continuam sem rep_commissions | Baixo | Esperado; reprocessamento via `/api/admin/reprocess` não cobre rep_commissions — requer backfill manual se necessário |
| Usuário admin criando pedido em nome de outro rep | Baixo | `user_id` vem do JWT do usuário autenticado; se admin criar, a comissão vai para o admin; comportamento consistente com o PUT |
| Remoção de `commission_value` do payload do POST | Baixo | O backend calcula `commissionValue` internamente; o frontend não precisa enviar |

---

## 9. Validação local

1. `npm run lint` — sem erros esperados
2. `npm run build` — verificar tipagem TypeScript (nenhum tipo novo adicionado)
3. Fluxo manual: criar pedido com status `pago` e produto com `rep_commission_pct > 0`; verificar `/dashboard/rep-commissions` — deve aparecer a comissão
4. Fluxo manual: alterar pedido existente de `pendente` para `pago` via dropdown em `/dashboard/sales` — PUT continua funcionando (não alterado)
5. Verificar `/dashboard/commissions` — comissão de indicador continua aparecendo normalmente
6. Verificar `/dashboard/sales` — coluna Comissão removida, layout sem quebra

---

## 10. Validação de banco/build/fluxo

- Nenhuma migration necessária — `rep_id` e `rep_name` já existem em `rep_commissions` (patch 030)
- Verificar no Supabase: após criar pedido pago, `SELECT * FROM rep_commissions WHERE order_id = '<id>';` deve retornar linhas com `rep_id` preenchido
- Verificar: `SELECT user_id FROM orders WHERE id = '<id>';` deve retornar o UUID do usuário autenticado

---

## 11. Impacto documental

- `docs/changelog.md` — adicionar entrada da v0.9.5 (ou lote L031)
- `docs/index.md` — nenhuma página nova criada; sem alteração necessária
- `docs/patches/` — sem patch SQL novo; sem alteração necessária

---

## 12. Handoff para revisão

**Próximo agente (Revisor — ETAPA 02):**

Prioridades de revisão:
1. Confirmar que `user_id: userId ?? null` não quebra constraint ou trigger no banco (coluna é nullable em `orders`)
2. Confirmar que `itemsPayload` sendo declarado com `let` fora do `if` não gera problema de tipagem
3. Confirmar que a remoção do `calcCommission()` do payload não afeta nenhuma lógica downstream
4. Verificar se a `Interface Order` em `sales/page.tsx` pode ter `commission_value` removida da tipagem local sem impacto

**Arquivos que o revisor NÃO deve tocar:**
- `src/app/api/orders/[id]/route.ts` — PUT funcionando; não faz parte deste lote
- `src/app/dashboard/commissions/page.tsx` — tela de indicadores correta; não faz parte deste lote
- `sql/030_rep_commissions_rep_id.sql` — já aplicado em produção
