# Patch SQL — 050_representative_role

**Lote:** L036-A  
**Migration:** `sql/050_representative_role.sql`  
**Data:** 2026-04-21  

---

## Objetivo

1. Adicionar `'representative'` ao CHECK constraint de `users.role`.
2. Criar índices de performance em `rep_regions`.

## Por que é necessário

O banco real (schema 2026-04-21) já possui a tabela `rep_regions` e o role `'representative'` no CHECK — conforme `schema_atual_supabase.sql` do documento. Contudo, **o schema do repositório** (`sql/schema_atual_supabase.sql`) ainda registrava apenas `['admin','user','manager']`. Esta migration sincroniza o repositório com o banco real e garante que ambientes de staging ou novos deploys herdem o estado correto.

## Tabelas/colunas afetadas

| Tabela | Operação | Detalhe |
|--------|----------|---------|
| `users` | `DROP + ADD CONSTRAINT` | Substitui `users_role_check` adicionando `'representative'` |
| `rep_regions` | `CREATE INDEX` | `(rep_id)` |
| `rep_regions` | `CREATE INDEX` | `(workspace, rep_id)` |

## Compatibilidade

- Migration usa `IF NOT EXISTS` nos índices e `DROP CONSTRAINT IF EXISTS` → idempotente.
- `rep_regions` já existe no banco real — sem `CREATE TABLE`.
- Usuários já cadastrados com roles existentes não são afetados.

## Risco

**Baixo.** `ALTER TABLE ... DROP/ADD CONSTRAINT` em `users` adquire `ACCESS EXCLUSIVE LOCK` brevemente. Executar em horário de baixo uso. Em produção ativa, o lock é tipicamente < 50ms para tabela de usuários pequena.

## Rollback

```sql
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role = ANY (ARRAY['admin','user','manager']));
DROP INDEX IF EXISTS public.idx_rep_regions_rep_id;
DROP INDEX IF EXISTS public.idx_rep_regions_workspace;
```

## Validação pós-aplicação

```sql
-- Deve conter 'representative':
SELECT pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_role_check';

-- Deve retornar 2 linhas:
SELECT indexname FROM pg_indexes
WHERE tablename = 'rep_regions'
  AND indexname IN ('idx_rep_regions_rep_id', 'idx_rep_regions_workspace');
```
