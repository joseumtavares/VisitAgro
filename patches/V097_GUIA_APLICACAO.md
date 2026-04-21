# GUIA DE APLICAÇÃO — Módulo de Representantes
## VisitAgro v0.9.7 — Lote L034

---

## 1. Resumo da Implementação

Implementação completa do módulo de representantes comerciais no VisitAgro.
Representantes são usuários do sistema com `role='representative'`, autenticáveis
via login/senha, vinculados às vendas (`orders.user_id`) e com regiões de atuação
gerenciadas via tabela `rep_regions` (já existente no banco).

A **correção crítica** é que `orders.user_id` agora nunca será `null` — ao criar
uma venda, o backend garante o preenchimento correto baseado no role do usuário
logado, desbloqueando a geração automática de comissões de representantes.

---

## 2. Objetivo do lote

- Cadastrar representantes em Configurações → aba "Representantes"
- Gerenciar regiões de atuação por representante
- Corrigir `orders.user_id = null` (bloqueador de comissões)
- Exibir seletor de representante no formulário de vendas (admin/manager)
- Conectar fluxo completo: vendas → rep_commissions

---

## 3. Arquivos Novos

| Arquivo | Propósito |
|---------|-----------|
| `sql/040_representative_role.sql` | Migration: adiciona `'representative'` ao CHECK de `users.role` |
| `src/app/api/representatives/route.ts` | GET (listar) / POST (criar) representantes |
| `src/app/api/representatives/[id]/route.ts` | GET (detalhe) / PUT (editar) |
| `src/app/api/representatives/[id]/password/route.ts` | POST — redefinir senha |
| `src/app/api/representatives/[id]/status/route.ts` | PATCH — ativar/desativar |
| `src/app/api/representatives/[id]/regions/route.ts` | GET/POST regiões |
| `src/app/api/representatives/[id]/regions/[regionId]/route.ts` | DELETE região |
| `src/components/settings/RepresentativesTab.tsx` | Componente completo da aba |
| `docs/patches/040_representative_role.md` | Documentação do patch SQL |

---

## 4. Arquivos Alterados

| Arquivo | Sensibilidade | O que mudou |
|---------|---------------|-------------|
| `src/types/index.ts` | Alta | Adicionado `'representative'` a `UserRole`; adicionada interface `Representative` e `RepRegion` |
| `src/app/api/orders/route.ts` | Alta | Corrigido preenchimento de `user_id` (usa `getRequestContext`; lógica por role) |
| `src/app/dashboard/settings/page.tsx` | Média | Nova aba "Representantes"; import de `RepresentativesTab` |
| `src/app/dashboard/sales/page.tsx` | Média | Seletor de representante para admin/manager; coluna de rep na tabela |

---

## 5. Arquivos Sensíveis / Risco de Conflito

- `src/app/api/orders/route.ts` — arquivo crítico para fluxo de vendas
- `src/types/index.ts` — contratos usados em múltiplos módulos

---

## 6. ORDEM OBRIGATÓRIA DE APLICAÇÃO

```
1. BANCO (OBRIGATÓRIO PRIMEIRO)
   → Executar: sql/040_representative_role.sql no Supabase SQL Editor

2. TIPOS
   → Substituir: src/types/index.ts

3. APIS NOVAS
   → Criar: src/app/api/representatives/ (todos os arquivos)

4. COMPONENTE
   → Criar: src/components/settings/RepresentativesTab.tsx

5. ARQUIVOS ALTERADOS
   → Substituir: src/app/api/orders/route.ts
   → Substituir: src/app/dashboard/settings/page.tsx
   → Substituir: src/app/dashboard/sales/page.tsx

6. DEPLOY + VALIDAÇÃO
```

**NÃO pular o passo 1** — sem a migration, a inserção de `role='representative'`
falhará com `check_constraint` violation.

---

## 7. Dependências

### Banco
- `public.users` — tabela existente; apenas ampliação de constraint
- `public.rep_regions` — tabela existente; sem alterações estruturais
- Sem novas tabelas

### API
- Todas as rotas `/api/representatives/*` requerem JWT (`middleware.ts` já protege)
- Role `'representative'` deve existir no banco antes do deploy

### Frontend
- `apiFetch` (existente em `src/lib/apiFetch.ts`) — sem alterações
- `useAuthStore` (existente) — `user.role` é lido para determinar permissões

### Autenticação
- Representante faz login exatamente como qualquer usuário (`/api/auth/login`)
- JWT gerado é idêntico; role='representative' fica no payload

---

## 8. Validação Mínima Após Aplicação

### 8.1 Banco
```sql
-- Confirmar constraint
SELECT constraint_name FROM information_schema.check_constraints
 WHERE constraint_name = 'users_role_check';

-- Criar representante de teste
INSERT INTO users (id, username, pass_hash, hash_algo, role, workspace, active, name)
VALUES (gen_random_uuid()::text, 'rep_teste', '$2a$12$xxx', 'bcrypt', 'representative', 'principal', true, 'Rep Teste')
ON CONFLICT DO NOTHING;
```

### 8.2 API (via cURL ou Postman)
```bash
# Listar representantes (precisa de JWT de admin)
GET /api/representatives
→ HTTP 200, { representatives: [...] }

# Criar representante
POST /api/representatives
{ "name": "João", "username": "joao", "password": "123456" }
→ HTTP 201
```

### 8.3 Venda com user_id
```sql
-- Criar uma venda como representante logado
-- Depois verificar:
SELECT id, user_id, status
  FROM orders
 ORDER BY created_at DESC
 LIMIT 5;
-- user_id NÃO deve ser null em novas vendas
```

### 8.4 Fluxo manual
1. Admin → Configurações → aba "Representantes" → criar representante
2. Fazer logout e login como o representante criado
3. Criar uma venda
4. Verificar: `orders.user_id` = id do representante
5. Marcar venda como "pago" → verificar `rep_commissions` gerado

---

## 9. Riscos Conhecidos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Migration não aplicada antes do deploy | Alta se esquecida | Validação pós-SQL obrigatória |
| Vendas antigas com `user_id = null` | Baixa (sem retroação) | Não afeta comissões futuras |
| Conflito em `src/types/index.ts` se houver outra branch | Média | Merge manual simples — apenas adição de tipos |
| `orders/route.ts` com lógica diferente em branch paralela | Média | Conferir âncoras no diff antes de substituir |
