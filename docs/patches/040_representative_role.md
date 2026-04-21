# 040_representative_role — Patch SQL

## 1. Identificação
- arquivo_sql: `sql/040_representative_role.sql`
- data: 2026-04-20
- versão/release relacionada: v0.9.7
- autor: Claude / VisitAgro

## 2. Objetivo
Adicionar suporte ao role `'representative'` na tabela `users`, permitindo
o cadastro de representantes comerciais como usuários autenticáveis do sistema.

## 3. Estruturas afetadas
- **tabelas:** `public.users` (constraint), `public.rep_regions` (índices)
- **colunas:** `users.role` — ampliação do CHECK constraint
- **índices:** `idx_users_role_workspace`, `idx_rep_regions_workspace_rep`, `idx_rep_regions_rep_id`
- **functions/RPC:** nenhuma
- **triggers:** nenhum
- **policies:** nenhuma alteração (RLS não se aplica ao service_role)

## 4. Compatibilidade
- **impacto em código existente:** Baixo — a constraint existente é substituída por versão mais permissiva
- **necessidade de rollout coordenado:** Sim — aplicar SQL ANTES do deploy do código
- **ordem de deploy:** 1. SQL → 2. deploy do código Next.js

## 5. Passo a passo de aplicação
1. Abrir Supabase SQL Editor
2. Colar o conteúdo de `sql/040_representative_role.sql`
3. Executar — sem necessidade de manutenção de dados existentes
4. Validar com a query de verificação abaixo

## 6. Validação pós-aplicação
```sql
-- Verificar constraint atualizada
SELECT constraint_name, check_clause
  FROM information_schema.check_constraints
 WHERE constraint_name = 'users_role_check';
-- Deve incluir 'representative' no ARRAY

-- Verificar índices criados
SELECT indexname FROM pg_indexes
 WHERE tablename IN ('users', 'rep_regions')
   AND indexname LIKE 'idx_%';

-- Teste de inserção com novo role
INSERT INTO users (id, username, pass_hash, hash_algo, role, workspace, active)
VALUES (gen_random_uuid()::text, 'test_rep_' || floor(random()*9999)::text,
        'x', 'bcrypt', 'representative', 'principal', false)
RETURNING id, username, role;
-- Não deve gerar constraint violation
-- Depois: DELETE FROM users WHERE username LIKE 'test_rep_%' AND active = false;
```

## 7. Rollback
```sql
-- Reverter constraint para versão original
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role = ANY (ARRAY['admin','user','manager']));

-- Remover índices (opcionais - não causam problema se mantidos)
DROP INDEX IF EXISTS idx_users_role_workspace;
DROP INDEX IF EXISTS idx_rep_regions_workspace_rep;
DROP INDEX IF EXISTS idx_rep_regions_rep_id;
```

## 8. Arquivos de código que dependem deste patch
- `src/app/api/representatives/route.ts`
- `src/app/api/representatives/[id]/route.ts`
- `src/app/api/representatives/[id]/password/route.ts`
- `src/app/api/representatives/[id]/status/route.ts`
- `src/app/api/representatives/[id]/regions/route.ts`
- `src/app/api/representatives/[id]/regions/[regionId]/route.ts`
- `src/types/index.ts` (UserRole)

## 9. Atualizações documentais obrigatórias
- docs/index.md (adicionar referência ao patch 040)
- docs/changelog.md (registrar v0.9.7)
- docs/setup-banco.md (mencionar migration 040 na lista de patches)
