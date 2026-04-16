# Patch V2 — Produto Composto
# VisitAgro v0.9.5 — CORREÇÃO COMPLETA
# Gerado em: 2026-04-15

## ✅ Problemas corrigidos nesta versão

| Problema (V1) | Correção (V2) |
|---|---|
| POST/PUT sem transação | RPC `upsert_composite_product` — tudo atômico no banco |
| GET não retornava `is_composite` sempre | SELECT explícito + normalização `Boolean(p.is_composite)` |
| DELETE não respeitava soft-delete nos vínculos | `isProductUsedAsComponent` filtra compostos não-deletados |
| Soft-delete de composto deixava vínculos órfãos | `clearCompositeComponents` limpa antes do soft-delete |
| Validação incompleta de componentes | RPC valida: existe, workspace, não-deletado, ativo, não-composto |
| UNIQUE constraint podia gerar erro 500 opaco | RPC valida duplicatas antes de inserir — retorna 400 claro |
| `calculateCompositeCost` retornava parcial silencioso | RPC faz Σ com validação prévia de cada componente |
| BFS com múltiplas queries desnecessárias | Removido — impossível com bloqueio de composto-de-composto |
| Frontend não tipava `is_composite` como boolean | `normalizeProduct()` + `Boolean(p.is_composite)` |
| `components` no payload chegava na tabela `products` | Desestruturado antes do UPDATE — nunca vai ao banco |

---

## 📁 Conteúdo do pacote

```
visitagro-composite-v2/
├── APLICAR_PATCH_V2.md              ← este arquivo
├── sql/
│   └── 020_product_components.sql   ← migration + RPC (executar primeiro)
├── src/
│   ├── lib/
│   │   └── productCompositeHelper.ts
│   ├── types/
│   │   └── index.ts
│   └── app/
│       ├── api/products/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── dashboard/products/
│           └── page.tsx
```

---

## 🔢 Ordem de aplicação

### Passo 1 — Banco (OBRIGATÓRIO antes do deploy)

Executar no Supabase SQL Editor:

```
sql/020_product_components.sql
```

Este arquivo cria:
- `is_composite` em `products`
- tabela `product_components`
- índices
- RPC `upsert_composite_product` (transação atômica)

**A migration é segura para reaplicação** (`IF NOT EXISTS`, `OR REPLACE`).

### Passo 2 — Arquivo novo

```
src/lib/productCompositeHelper.ts   ← NOVO
```

### Passo 3 — Arquivos alterados (substituir completamente)

```
src/types/index.ts
src/app/api/products/route.ts
src/app/api/products/[id]/route.ts
src/app/dashboard/products/page.tsx
```

### Passo 4 — Validar build

```bash
npm run build
# Espera: zero erros TypeScript
```

---

## 🔒 Como a transação foi resolvida

A RPC `upsert_composite_product` no PostgreSQL executa em PL/pgSQL:
1. Valida todos os componentes (loop)
2. Calcula custo total
3. INSERT ou UPDATE no produto
4. DELETE + INSERT nos componentes

Tudo dentro de um bloco `BEGIN...EXCEPTION WHEN OTHERS THEN RETURN error`.

O Supabase trata cada chamada RPC como uma transação de banco isolada.
Se qualquer passo falhar, nada é persistido.

**Sem transação manual no Node.js** — a garantia está no banco.

---

## 🗑️ Como o soft-delete foi tratado

**Deletar produto simples que é componente:**
- `isProductUsedAsComponent()` busca vínculos filtrando `composite.deleted_at IS NULL`
- Bloqueia apenas se o composto vinculado NÃO está deletado
- Mensagem de erro clara com nome do produto composto

**Deletar produto composto:**
- `clearCompositeComponents()` apaga todos os vínculos em `product_components`
- Depois aplica o soft-delete no produto
- Sem vínculos órfãos

**RPC — componentes da validação:**
- Verifica `deleted_at IS NULL` de cada componente antes de aceitar

---

## 🔄 Escolha arquitetural: Opção A (composto-de-composto bloqueado)

Componente **não pode** ser um produto composto.

Consequências:
- Ciclos de composição são **impossíveis por construção**
- BFS foi **removido** — era complexidade sem valor
- Validação mais simples, previsível e rápida
- Se futuramente necessário, reabilitar com BFS + flag explícito

---

## ✅ Checklist final

- [x] Produto simples: criar, editar, listar — sem regressão
- [x] Produto composto: criar com componentes — atômico via RPC
- [x] Produto composto: editar — componentes substituídos atomicamente
- [x] GET listagem: `is_composite` sempre presente e boolean
- [x] GET por ID: retorna componentes quando composto
- [x] DELETE simples em uso: erro 400 com nome do composto
- [x] DELETE composto: limpa vínculos + soft-delete
- [x] Componente deletado: RPC rejeita com mensagem clara
- [x] Componente inativo: RPC rejeita com mensagem clara
- [x] Composto de composto: bloqueado na RPC
- [x] Duplicata de componente: detectada no backend e na RPC
- [x] `components` não vaza para o UPDATE da tabela products
- [x] `is_composite` normalizado para boolean no frontend
- [x] Dados antigos (is_composite null/undefined): tratados como false
- [x] Venda com produto composto: rep_commission_pct do composto preservado
- [x] Custo calculado: Σ real dos componentes, sem parcial silencioso
- [x] Multi-workspace: isolamento garantido em todas as queries e na RPC

---

## 🔙 Rollback

```sql
-- Remover RPC
DROP FUNCTION IF EXISTS public.upsert_composite_product(text, text, jsonb, jsonb);

-- Remover estrutura
DROP TABLE IF EXISTS public.product_components;
ALTER TABLE public.products DROP COLUMN IF EXISTS is_composite;
DROP INDEX IF EXISTS idx_product_components_composite;
DROP INDEX IF EXISTS idx_product_components_component;
DROP INDEX IF EXISTS idx_product_components_workspace;
DROP INDEX IF EXISTS idx_products_is_composite;
```

Restaurar os arquivos .ts/.tsx da versão anterior.

---

## ⚠️ Arquivos NÃO incluídos (sem mudança necessária)

- `src/app/dashboard/sales/page.tsx` — sem mudança
- `src/lib/commissionHelper.ts` — não afetado
- `src/app/api/orders/route.ts` — não afetado
- `src/app/api/orders/[id]/route.ts` — não afetado
- Todos os demais arquivos do projeto
