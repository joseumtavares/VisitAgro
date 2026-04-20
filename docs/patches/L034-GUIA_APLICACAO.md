# GUIA DE APLICAÇÃO — Lote L034

**Lote:** L034  
**Título:** Correção de comissões de representantes — geração, idempotência e reprocessamento  
**Data:** 2026-04-20  
**Branch sugerida:** `feature/l034-rep-commissions-fix`

---

## 1. Resumo da Implementação

Este lote corrige as três lacunas do módulo de comissões de representantes:

1. **`repCommissionHelper.ts`** — adiciona `reprocessRepCommissions`, função que detecta divergências por `order_item_id`, preserva pagas e substitui pendentes inconsistentes (comportamento do `visitas/reprocessCommissions v10`).
2. **`/api/admin/reprocess`** — agora reprocessa também comissões de representante (antes só processava indicador).
3. **`sql/040_rep_commissions_indexes.sql`** — adiciona índice único parcial e dois índices de performance.

A lógica de **geração** (POST/PUT em orders) **não foi alterada** — já estava correta.

---

## 2. Arquivos Novos

| Arquivo | Descrição |
|---------|-----------|
| `sql/040_rep_commissions_indexes.sql` | Migration com 3 índices novos em `rep_commissions` |
| `docs/patches/040_rep_commissions_indexes.md` | Documentação da migration |
| `docs/lotes/L034_ETAPA_01_EXECUCAO.md` | Registro do lote |

---

## 3. Arquivos Alterados

| Arquivo | Ação | Sensibilidade |
|---------|------|---------------|
| `src/lib/repCommissionHelper.ts` | Substituição completa | Média |
| `src/app/api/admin/reprocess/route.ts` | Substituição completa | Média |

---

## 4. Arquivos com Maior Risco de Conflito

- `src/lib/repCommissionHelper.ts` — arquivo central; se outro branch o editou em paralelo, merge manual necessário.
- `src/app/api/admin/reprocess/route.ts` — verificar se outro lote adicionou lógica após a importação de `generateCommission`.

---

## 5. Ordem Obrigatória de Aplicação

```
PASSO 1 — Banco de dados
  Executar no Supabase SQL Editor:
  → sql/040_rep_commissions_indexes.sql

PASSO 2 — Código
  Substituir:
  → src/lib/repCommissionHelper.ts
  → src/app/api/admin/reprocess/route.ts

PASSO 3 — Documentação
  Adicionar ao repositório:
  → docs/patches/040_rep_commissions_indexes.md
  → docs/lotes/L034_ETAPA_01_EXECUCAO.md

PASSO 4 — Deploy
  → Vercel (push para branch → PR → merge)

PASSO 5 — Validação
  → Ver seção 8 abaixo
```

---

## 6. Dependências

| Tipo | Detalhe |
|------|---------|
| Banco | Migration 030 (`sql/030_rep_commissions_rep_id.sql`) deve já ter sido aplicada — confirmar que `rep_commissions` tem colunas `rep_id`, `rep_name`, `order_item_id`, `reprocessed_at` |
| API | Nenhuma nova rota criada |
| Frontend | Nenhuma alteração necessária |
| Ambiente | Nenhuma nova variável de ambiente |

---

## 7. Verificação Pré-aplicação

Antes de aplicar, confirmar no Supabase que as colunas existem:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'rep_commissions'
  AND column_name IN ('rep_id','rep_name','order_item_id','reprocessed_at');
-- Esperado: 4 linhas
```

Se retornar menos de 4 linhas, aplicar primeiro a migration `030_rep_commissions_rep_id.sql`.

---

## 8. Validação Mínima Após Aplicação

### 8.1 Banco

```sql
-- Confirmar índices criados
SELECT indexname FROM pg_indexes
WHERE tablename = 'rep_commissions'
  AND indexname IN (
    'uq_rep_commissions_pending_item',
    'idx_rep_commissions_rep_id_workspace',
    'idx_rep_commissions_order_status'
  );
-- Esperado: 3 linhas
```

### 8.2 API — reprocessamento

```bash
# POST /api/admin/reprocess com PIN correto
# Resposta esperada inclui campo "rep":
# {
#   "ok": true,
#   "processed": N,
#   "created": N,
#   "rep": {
#     "ordersChecked": N,
#     "ordersChanged": N,
#     "created": N,
#     "errors": []
#   }
# }
```

### 8.3 Fluxo manual

1. Criar pedido com produto que tenha `rep_commission_pct > 0`, status `pago`.
2. Verificar em `rep_commissions`: 1 linha por item elegível.
3. Deletar manualmente essa linha no banco.
4. Chamar `POST /api/admin/reprocess`.
5. Verificar: linha recriada com `reprocessed_at` preenchido.

---

## 9. Riscos Conhecidos

| Risco | Nível | Observação |
|-------|-------|------------|
| Pedidos antigos sem `user_id` não geram rep commission | Estrutural | Por design; documentado em L034_ETAPA_01 |
| Race condition antes da migration 040 | Baixo | Migration 040 mitiga com índice único |
| Frontend de manutenção não exibe métricas de rep | Cosmético | Evolução futura; não bloqueia funcionalidade |
