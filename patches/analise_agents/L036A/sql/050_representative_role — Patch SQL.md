# 050_representative_role — Patch SQL (Controle de Acesso)

## 1. Identificação
- **arquivo_sql:** `sql/050_representative_role.sql`
- **** 2026-04-21
- **versão/release relacionada:** v0.9.7
- **lote:** L036-A
- **autor:** Claude / VisitAgro

## 2. Objetivo
Adicionar `'representative'` ao CHECK constraint da tabela `users.role` e criar índices de performance em `rep_regions`, habilitando controle de acesso baseado em perfil para módulo de Vendas e Comissões de Representantes.

## 3. Contexto do problema
O sistema não possuía filtro por perfil na API de pedidos (`GET /api/orders`). Qualquer usuário autenticado recebia **todos os pedidos do workspace**, independentemente de ter criado ou não. Este patch SQL é pré-requisito para a correção aplicada no lote L036-A.

## 4. Estruturas afetadas
| Estrutura | Tipo | Alteração |
|-----------|------|-----------|
| `public.users` | CHECK constraint | Adiciona `'representative'` ao ARRAY de roles válidos |
| `public.rep_regions` | Índice | `idx_rep_regions_rep_id` |
| `public.rep_regions` | Índice | `idx_rep_regions_workspace` (composite) |

**Não altera:**
- Tabelas existentes (não cria novas)
- Dados existentes (não remove, não migra)
- Functions, triggers ou policies

## 5. Compatibilidade
- **Impacto em código existente:** Baixo — constraint é ampliado, não restringido
- **Necessidade de rollout coordenado:** Sim — aplicar SQL ANTES do deploy do código
- **Ordem de deploy:** 1. SQL → 2. Código Next.js (API + UI)
- **Idempotente:** Sim — usa `DROP CONSTRAINT IF EXISTS`, `CREATE INDEX IF NOT EXISTS`

## 6. Passo a passo de aplicação

### 6.1 Pré-aplicação
```sql
-- Confirmar que rep_regions existe:
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name = 'rep_regions';
-- Esperado: 1

-- Confirmar constraint atual de users.role:
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_role_check';
-- Esperado: conter 'admin','user','manager' (sem 'representative' ainda)
```

### 6.2 Aplicação
1. Abrir Supabase SQL Editor
2. Colar conteúdo de `sql/050_representative_role.sql`
3. Executar — transação única com BEGIN/COMMIT
4. Sem necessidade de manutenção de dados existentes

### 6.3 Pós-aplicação
```sql
-- Verificar constraint atualizado:
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND conname = 'users_role_check';
-- Deve incluir 'representative' no ARRAY

-- Verificar índices criados:
SELECT indexname FROM pg_indexes
WHERE tablename = 'rep_regions'
  AND indexname IN ('idx_rep_regions_rep_id', 'idx_rep_regions_workspace');
-- Esperado: 2 linhas

-- Teste de inserção com novo role:
INSERT INTO public.users (username, pass_hash, role, workspace, active)
VALUES ('rep_test_050', 'placeholder', 'representative', 'principal', true)
ON CONFLICT DO NOTHING;

-- Validar inserção:
SELECT id, username, role FROM public.users WHERE username = 'rep_test_050';
-- Deve retornar 1 linha com role='representative'

-- Limpar teste:
DELETE FROM public.users WHERE username = 'rep_test_050';
```

## 7. Matriz de permissão por perfil

Após aplicação deste patch + código L036-A:

| Role | GET /api/orders | PUT /api/orders/[id] | DashboardShell | sales/page.tsx |
|------|-----------------|----------------------|----------------|----------------|
| admin | todos os pedidos | qualquer pedido | vê Indicadores, Com. Indicadores | pode alterar status |
| manager | todos os pedidos | qualquer pedido | vê Indicadores, Com. Indicadores | pode alterar status |
| user | todos os pedidos | qualquer pedido | vê Indicadores, Com. Indicadores | pode alterar status |
| representative | **apenas seus pedidos** (user_id) | qualquer pedido* | **oculto**: Indicadores, Com. Indicadores | **não pode** alterar status |

\* Guard de propriedade em PUT/DELETE é dívida técnica L036-B

## 8. Rollback

```sql
-- Reverter constraint para versão original (sem 'representative')
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role = ANY (ARRAY['admin'::text, 'user'::text, 'manager'::text]));

-- Remover índices (opcionais - não causam problema se mantidos)
DROP INDEX IF EXISTS public.idx_rep_regions_rep_id;
DROP INDEX IF EXISTS public.idx_rep_regions_workspace;
```

**Atenção:** Rollback só deve ser feito se NÃO houver usuários com `role='representative'` no banco. Caso contrário, a operação falhará.

## 9. Arquivos de código que dependem deste patch

| Arquivo | Dependência |
|---------|-------------|
| `src/types/index.ts` | `UserRole` inclui `'representative'` |
| `src/app/api/orders/route.ts` | Filtra por `role === 'representative'` |
| `src/app/dashboard/sales/page.tsx` | UX condicional por perfil |
| `src/components/layout/DashboardShell.tsx` | `hideForRepresentative` |

## 10. Riscos conhecidos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Usuários existentes sem `user_id` em pedidos antigos | Baixo | Representative só vê pedidos criados após aplicação |
| Nome da constraint variar em instalações legadas | Baixo | Script usa nome padrão do PG; documentar pré-checagem |
| Validação SQL obsoleta (`consrc`) | Alto | Usar `pg_get_constraintdef(oid)` em vez de `consrc` |

## 11. Atualizações documentais obrigatórias

- [ ] `docs/changelog.md` — registrar lote L036-A
- [ ] `docs/index.md` — referenciar patch 050
- [ ] `docs/lotes/L036-A_ETAPA_01_EXECUCAO.md` — execução real
- [ ] `docs/lotes/L036-A_ETAPA_03_AUDITORIA.md` — auditoria técnica

## 12. Relação com outros patches

| Patch | Relação |
|-------|---------|
| `040_representative_role.md` | Pré-requisito — adiciona tabelas e estrutura de representantes |
| `030_rep_commissions_rep_id.sql` | Complementar — comissões de representantes |
| L034 | Correção de `repCommissionHelper` — já aplicado |

---

**Nota:** Este patch é parte do lote L036-A (Controle de acesso por perfil). Não aplicar isoladamente sem o código correspondente.