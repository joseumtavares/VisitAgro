# Patch SQL — 040_rep_commissions_indexes

**Lote:** L034  
**Migration:** `sql/040_rep_commissions_indexes.sql`  
**Data:** 2026-04-20  
**Responsável:** Executor L034  

---

## Objetivo

Adicionar índices que garantem idempotência e performance para comissões de representantes, após a correção de lógica do lote L034.

## Tabelas/colunas afetadas

| Tabela | Operação | Detalhe |
|--------|----------|---------|
| `rep_commissions` | `CREATE UNIQUE INDEX` (parcial) | `(workspace, order_item_id)` WHERE `status = 'pendente'` |
| `rep_commissions` | `CREATE INDEX` | `(workspace, rep_id, status)` |
| `rep_commissions` | `CREATE INDEX` | `(order_id, status)` |

## Por que é necessário

A correção de lógica no `repCommissionHelper.ts` garante idempotência via consulta `count` antes de inserir. O índice único parcial reforça essa garantia no banco, impedindo race condition caso duas chamadas concorrentes passem pela verificação de count simultaneamente.

## Compatibilidade

- Todas as colunas referenciadas (`workspace`, `order_item_id`, `rep_id`, `status`, `order_id`) já existem na tabela conforme `schema_atual_supabase.sql`.
- Não altera estrutura, não remove dados.
- `IF NOT EXISTS` torna a migration idempotente.

## Risco

**Baixo.** Apenas adição de índices. Em tabelas com muitos registros pode haver lock breve durante `CREATE INDEX`, mas o Supabase executa `CREATE INDEX CONCURRENTLY` equivalente para tabelas sem lock bloqueante. Executar em horário de baixo uso é suficiente.

## Ordem de aplicação

Aplicar **após** fazer deploy do código do lote L034 (ou simultaneamente). Não há dependência de sequência crítica — o código funciona sem o índice único, porém com menor garantia de unicidade em cenários de alta concorrência.

## Rollback

```sql
DROP INDEX IF EXISTS public.uq_rep_commissions_pending_item;
DROP INDEX IF EXISTS public.idx_rep_commissions_rep_id_workspace;
DROP INDEX IF EXISTS public.idx_rep_commissions_order_status;
```

## Validação pós-aplicação

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'rep_commissions'
  AND indexname IN (
    'uq_rep_commissions_pending_item',
    'idx_rep_commissions_rep_id_workspace',
    'idx_rep_commissions_order_status'
  );
-- Esperado: 3 linhas.
```
