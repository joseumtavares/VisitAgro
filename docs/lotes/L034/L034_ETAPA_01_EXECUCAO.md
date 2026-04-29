# L034 — ETAPA 01 — EXECUÇÃO

**Lote:** L034  
**Título:** Correção de comissões de representantes — geração, idempotência e reprocessamento  
**Data:** 2026-04-20  
**Executor:** Claude (Agente Executor)  
**Status:** ✅ Pronto para revisão  

---

## 1. Resumo Executivo

O módulo de comissões de representantes do VisitAgro tinha a **estrutura correta** (tabela, colunas, helper, rotas, tela) mas apresentava **três falhas de implementação** identificadas por comparação direta com a fonte de verdade (`visitas/public/index.html — _buildCommissions v10`):

1. **`repCommissionHelper.ts`** — lógica de cálculo correta, mas **reprocessamento ausente**. O helper só sabia gerar, não sabia detectar divergências e substituir pendentes.
2. **`/api/admin/reprocess`** — reprocessava **apenas comissões de indicador** (referral). Comissões de representante não eram tocadas.
3. **Sem índice de unicidade** no banco para `(workspace, order_item_id)` com `status = 'pendente'`, expondo risco de duplicidade em chamadas concorrentes.

As correções foram mínimas e cirúrgicas: dois arquivos de código alterados e uma migration SQL nova.

---

## 2. Diagnóstico — Divergências encontradas

### 2.1 `repCommissionHelper.ts`

| Aspecto | Visitas (fonte de verdade) | VisitAgro antes do L034 |
|---------|---------------------------|-------------------------|
| Geração ao criar pedido pago | ✅ `addOrder → _buildCommissions` | ✅ chamado no POST |
| Geração na transição → pago | ✅ `editOrder → _buildCommissions` | ✅ chamado no PUT |
| Chave de idempotência | `orderItemId` | `order_item_id` ✅ |
| Snapshot do item | `item.repCommissionPct` prioritário | `item.rep_commission_pct` ✅ |
| Pagas são imutáveis | ✅ verifica `status === 'paga'` | ✅ verifica `count > 0` (qualquer status) |
| **Reprocessamento** | ✅ `reprocessCommissions` — detecta divergência por `qty`, `unitPrice`, `repCommissionPct`, remove pendentes, recria | ❌ **Ausente** |

### 2.2 `/api/admin/reprocess`

| Aspecto | Esperado | Antes do L034 |
|---------|----------|---------------|
| Reprocessa indicador | ✅ | ✅ |
| **Reprocessa representante** | ✅ | ❌ Ausente |

### 2.3 Banco de dados

| Aspecto | Esperado | Antes do L034 |
|---------|----------|---------------|
| `rep_id`, `rep_name` | ✅ migration 030 | ✅ |
| `order_item_id` | ✅ schema original | ✅ |
| `reprocessed_at` | ✅ schema original | ✅ |
| **Índice único parcial** por `(workspace, order_item_id) WHERE status='pendente'` | ✅ | ❌ Ausente |

---

## 3. Evidências Usadas

- `/home/claude/visitagro/VisitAgro-main/src/lib/repCommissionHelper.ts` — lido na íntegra
- `/home/claude/visitagro/VisitAgro-main/src/app/api/orders/route.ts` — lido na íntegra
- `/home/claude/visitagro/VisitAgro-main/src/app/api/orders/[id]/route.ts` — lido na íntegra
- `/home/claude/visitagro/VisitAgro-main/src/app/api/admin/reprocess/route.ts` — lido na íntegra
- `/home/claude/visitagro/VisitAgro-main/src/app/api/rep-commissions/route.ts` — lido
- `/home/claude/visitagro/VisitAgro-main/src/types/index.ts` — lido
- `/mnt/user-data/uploads/schema_atual_supabase.sql` — lido na íntegra (banco real)
- `/mnt/user-data/uploads/index.html` — linhas 592–715 (lógica `_buildCommissions`, `addOrder`, `editOrder`, `reprocessCommissions` v10)

---

## 4. Arquivos Alterados

| Arquivo | Ação | Sensibilidade |
|---------|------|---------------|
| `src/lib/repCommissionHelper.ts` | **Substituição completa** | Média |
| `src/app/api/admin/reprocess/route.ts` | **Substituição completa** | Média |
| `sql/040_rep_commissions_indexes.sql` | **Criado** | Baixa |
| `docs/patches/040_rep_commissions_indexes.md` | **Criado** | Baixa |

### Arquivos NÃO alterados (preservados)

- `src/app/api/orders/route.ts` — ✅ já chama `generateRepCommissions` corretamente
- `src/app/api/orders/[id]/route.ts` — ✅ já chama `generateRepCommissions` na transição
- `src/app/api/rep-commissions/route.ts` — ✅ GET e filtros corretos
- `src/app/api/rep-commissions/[id]/route.ts` — ✅ PUT com guard de role
- `src/app/dashboard/rep-commissions/page.tsx` — ✅ tela funcional
- `src/app/dashboard/maintenance/page.tsx` — ✅ chama `/api/admin/reprocess`, resposta compatível
- `src/types/index.ts` — ✅ `RepCommission` completo e correto
- `sql/030_rep_commissions_rep_id.sql` — ✅ aplicado, não tocar

---

## 5. Detalhes das Correções

### 5.1 `src/lib/repCommissionHelper.ts`

**Âncora de substituição:** Arquivo inteiro. Substitui a versão anterior que exportava apenas `generateRepCommissions`.

**O que mudou:**
- `generateRepCommissions` — lógica de geração preservada com pequeno ajuste: passa `receipt_photo_ids: []` explicitamente e `reprocessed_at: null`, alinhando com o schema.
- **`reprocessRepCommissions` — função nova** que implementa o comportamento de `reprocessCommissions` do visitas:
  - Busca todos os pedidos `pago` com `user_id` definido.
  - Para cada pedido, compara itens elegíveis com comissões pendentes existentes.
  - Detecta divergência por `qty`, `unit_price`, `rep_commission_pct` (mesma lógica do visitas linha 703).
  - Remove as pendentes divergentes.
  - Recria com `reprocessed_at = now()` para rastreabilidade.
  - Preserva pagas (imutáveis).

### 5.2 `src/app/api/admin/reprocess/route.ts`

**Âncora de substituição:** Arquivo inteiro. Substitui a versão que só tocava em `commissions` (indicador).

**O que mudou:**
- Importa `reprocessRepCommissions` do helper corrigido.
- Executa em sequência: (1) reprocessamento de indicador, (2) reprocessamento de representante.
- Resposta JSON **compatível com o frontend atual**: mantém campos `processed` e `created` (indicador) e adiciona objeto `rep` com métricas de representante.
- Frontend (`maintenance/page.tsx`) não precisa de alteração: lê `reprocessResult.processed` e `reprocessResult.created` que continuam presentes.

### 5.3 `sql/040_rep_commissions_indexes.sql`

Três índices novos na tabela `rep_commissions`:
1. `UNIQUE` parcial `(workspace, order_item_id) WHERE status = 'pendente'` — garante unicidade de pendentes por item no banco.
2. `(workspace, rep_id, status)` — performance na listagem da tela.
3. `(order_id, status)` — performance no reprocessamento.

---

## 6. Cenários de Validação

### 6.1 Pedido criado já pago
1. Criar pedido com status `pago` e produto com `rep_commission_pct > 0`.
2. Verificar em `rep_commissions`: deve existir 1 linha por item elegível, com `status = 'pendente'` e `reprocessed_at = null`.

### 6.2 Pedido criado pendente → atualizado para pago
1. Criar pedido com status `pendente`.
2. Atualizar status para `pago`.
3. Verificar: comissão gerada, `order_item_id` correto.

### 6.3 Item sem rep_commission_pct
1. Criar pedido com item sem percentual de comissão.
2. Verificar: nenhuma `rep_commission` gerada para esse item.

### 6.4 Múltiplos itens, product_ids diferentes
1. Criar pedido com 3 itens elegíveis.
2. Verificar: 3 linhas em `rep_commissions`, cada uma com `order_item_id` distinto.

### 6.5 Dois itens com mesmo product_id mas order_item_id diferentes
1. Criar pedido com 2 linhas do mesmo produto.
2. Verificar: 2 comissões geradas (não 1), cada uma com `order_item_id` do respectivo item.

### 6.6 Reprocessamento via /api/admin/reprocess
1. Deletar manualmente comissões pendentes de um pedido pago.
2. Chamar POST /api/admin/reprocess com PIN.
3. Verificar: comissões recriadas com `reprocessed_at` preenchido.

### 6.7 Comissão paga é preservada no reprocessamento
1. Marcar uma comissão como `paga`.
2. Chamar reprocessamento.
3. Verificar: comissão paga não foi removida nem alterada.

### 6.8 Comissão pendente divergente é corrigida
1. Alterar manualmente `qty` em `rep_commissions` de uma comissão pendente.
2. Chamar reprocessamento.
3. Verificar: comissão pendente antiga removida, nova criada com valor correto.

---

## 7. Riscos Remanescentes

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Pedidos antigos sem `user_id` não geram comissão de rep | Estrutural — por design | Documentado; na transição para pago o PUT já tenta resolver `user_id` |
| Race condition em inserção simultânea antes da migration 040 | Baixa | Migration 040 adiciona índice único; código já verifica `count` antes |
| Frontend de manutenção não exibe métricas de rep no reprocessamento | Cosmético | `maintenance/page.tsx` lê `created` (indicador) — informação de rep fica no audit_log. Evolução futura opcional |

---

## 8. Ordem de Aplicação

```
1. sql/040_rep_commissions_indexes.sql     → Supabase SQL Editor
2. src/lib/repCommissionHelper.ts          → substituir arquivo
3. src/app/api/admin/reprocess/route.ts   → substituir arquivo
4. Deploy (Vercel)
5. Validar cenários 6.1 a 6.8
```

---

## 9. Handoff para Revisão

**Revisores devem verificar:**

- [ ] `reprocessRepCommissions` — lógica de detecção de divergência idêntica à do visitas (linhas 696–704 do `index.html`).
- [ ] Resposta do `reprocess` mantém `processed` e `created` (compatibilidade com frontend).
- [ ] Migration 040 usa `IF NOT EXISTS` (idempotente).
- [ ] `generateRepCommissions` não foi alterada na lógica de geração — apenas alinhamento de campos com schema.
- [ ] Nenhum arquivo fora do escopo foi alterado.
