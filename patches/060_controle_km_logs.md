# Patch SQL — 060_controle_km_logs

**Lote:** L040.1  
**Migration:** `sql/060_controle_km_logs.sql`  
**Data:** 2026-04-28

---

## Objetivo

1. Adequar `public.km_logs` ao padrão de tenancy do VisitAgro (`workspace`).
2. Garantir unicidade diária ativa por workspace + user + data.
3. Adicionar colunas faltantes (`workspace`, `created_at`, `updated_at`).
4. Criar índices de performance e constraint de integridade.
5. Criar trigger de `updated_at`.

## Por que é necessário

O schema de referência (`sql/schema_atual_supabase.sql`) possui `km_logs` mas sem `workspace`, sem `created_at`, sem `updated_at` e sem constraints de unicidade diária. O padrão do projeto (`getAdmin()` com `service_role`) exige filtros explícitos de tenancy na aplicação — portanto `workspace` deve existir na tabela como coluna indexada.

## Tabelas/colunas afetadas

| Tabela | Operação | Detalhe |
|---|---|---|
| `km_logs` | `ADD COLUMN IF NOT EXISTS` | `workspace text NOT NULL DEFAULT 'principal'` |
| `km_logs` | `ADD COLUMN IF NOT EXISTS` | `created_at timestamptz NOT NULL DEFAULT now()` |
| `km_logs` | `ADD COLUMN IF NOT EXISTS` | `updated_at timestamptz NOT NULL DEFAULT now()` |
| `km_logs` | `ADD CONSTRAINT` (idempotente via DO$$) | `CHECK (km_fim >= km_ini)` |
| `km_logs` | `CREATE INDEX IF NOT EXISTS` | `idx_km_logs_workspace_user_data` WHERE deleted_at IS NULL |
| `km_logs` | `CREATE UNIQUE INDEX IF NOT EXISTS` | `uq_km_logs_active_daily` WHERE deleted_at IS NULL |
| `public` | `CREATE OR REPLACE FUNCTION` | `fn_set_updated_at()` |
| `km_logs` | `CREATE TRIGGER` | `trg_km_logs_updated_at` |

## Compatibilidade

- Todas as operações são idempotentes (`IF NOT EXISTS`, `IF EXISTS`, `DO$$`).
- O `DEFAULT 'principal'` em `workspace` é temporário para idempotência — permite executar em banco com dados existentes.
- **Ação pós-migration:** se houver registros existentes com `workspace = 'principal'` mas pertencentes a outro workspace, atualizar manualmente via SQL antes de remover o DEFAULT.
- A função `fn_set_updated_at()` usa `CREATE OR REPLACE` — idempotente mesmo se já existir de outro módulo.

## Risco

**Médio.** A adição de `ADD COLUMN IF NOT EXISTS` com `NOT NULL DEFAULT` pode demorar em tabelas grandes (Postgres reescreve). Em `km_logs` sem dados reais, o impacto é nulo. Em produção com dados: executar em horário de baixo uso.

O `CREATE UNIQUE INDEX` pode falhar se já existirem duplicatas ativas (mesmo workspace + user + data). Verificar antes com:

```sql
SELECT workspace, user_id, data, COUNT(*)
FROM public.km_logs
WHERE deleted_at IS NULL
GROUP BY workspace, user_id, data
HAVING COUNT(*) > 1;
```

Se retornar linhas: resolver duplicatas antes de aplicar a migration (soft-delete os duplicados excedentes).

## Rollback

```sql
DROP TRIGGER IF EXISTS trg_km_logs_updated_at ON public.km_logs;
DROP FUNCTION IF EXISTS public.fn_set_updated_at();
DROP INDEX IF EXISTS public.uq_km_logs_active_daily;
DROP INDEX IF EXISTS public.idx_km_logs_workspace_user_data;
ALTER TABLE public.km_logs DROP CONSTRAINT IF EXISTS chk_km_logs_km_fim_gte_ini;
ALTER TABLE public.km_logs
  DROP COLUMN IF EXISTS workspace,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at;
```

## Validação pós-aplicação

```sql
-- 1. Confirmar colunas existem
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'km_logs'
ORDER BY ordinal_position;

-- 2. Confirmar constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.km_logs'::regclass;

-- 3. Confirmar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'km_logs';
-- Esperado: idx_km_logs_workspace_user_data e uq_km_logs_active_daily

-- 4. Confirmar trigger
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'km_logs';
-- Esperado: trg_km_logs_updated_at
```
