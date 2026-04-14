# 🛠️ Setup do Banco de Dados — VisitAgroPro

> **Versão:** 0.9.4 — Atualizado em 14/04/2026

---

## ⚠️ LEIA ANTES DE EXECUTAR QUALQUER SQL

O schema atual usa a tabela `workspaces` como **dependência central**: todas as
tabelas (`clients`, `products`, `orders`, `users`, `visits`, `categories`, etc.)
possuem uma FK NOT NULL para `workspaces(id)`.

**A row `'principal'` deve existir em `workspaces` ANTES de qualquer outro INSERT.**
O script `scripts/insert_admin.sql` já cuida disso como primeira instrução.

---

## Passo a Passo — Instalação limpa

### 1. Criar o schema no Supabase

No **SQL Editor** do Supabase, execute o arquivo `schema_atual_supabase.sql`.

> Se já existirem tabelas de versão anterior com estrutura diferente:
> ```sql
> DROP TABLE IF EXISTS
>   order_items, commissions, rep_commissions, orders,
>   visits, clients, products, categories, referrals,
>   settings, companies, users, workspaces,
>   audit_log, environments, photos, pre_registrations,
>   geocode_cache, refresh_tokens, rate_limits, km_logs
> CASCADE;
> ```

### 2. Desabilitar RLS nas tabelas operacionais

Execute `scripts/migration_v2.sql` no SQL Editor. Esse script também adiciona
colunas que podem estar faltando em instalações parciais (`tel2`, `category`,
`model`, `color`, `bank_name`, etc.) e insere o registro padrão de `settings`.

### 3. Inserir o workspace padrão e o usuário admin

Execute `scripts/insert_admin.sql` no SQL Editor.

O script, em ordem:
1. Insere a row `'principal'` em `workspaces` (idempotente)
2. Insere a empresa padrão em `companies` (idempotente)
3. Remove admin com hash placeholder inválido
4. Insere/atualiza o admin com hash bcrypt real para a senha `admin123`
5. Insere o registro padrão em `settings` (idempotente)

> **Senha padrão:** `admin123`
> Troque imediatamente após o primeiro login em **Configurações → Senha**.

### 4. Configurar variáveis de ambiente na Vercel

| Variável | Tipo | Onde encontrar |
|----------|------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Supabase → Settings → API → service\_role |
| `JWT_SECRET` | **Secret** | Gere com: `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | Secret | `28800` (8 horas em segundos) |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` **nunca** deve ter prefixo `NEXT_PUBLIC_`.
> ⚠️ `JWT_SECRET` deve ter pelo menos 32 caracteres aleatórios.

### 5. Fazer deploy e verificar

```bash
# Local
npm install
npm run dev
# Acessar http://localhost:3000 — deve redirecionar para /auth/login

# Vercel
git push origin main
# Acompanhar build em vercel.com/dashboard
```

---

## Verificações pós-instalação

```sql
-- 1. Confirmar workspace principal
SELECT id, name, slug FROM workspaces WHERE id = 'principal';
-- Deve retornar 1 linha

-- 2. Confirmar usuário admin
SELECT id, username, role, active, left(pass_hash, 15) || '...' AS hash
FROM users WHERE username = 'admin';
-- Deve retornar 1 linha com hash iniciando em '$2a$12$'

-- 3. Confirmar settings
SELECT workspace, company_id FROM settings WHERE workspace = 'principal';
-- Deve retornar 1 linha

-- 4. Testar FK (deve funcionar sem erro)
INSERT INTO clients (id, workspace, name, status)
VALUES (gen_random_uuid()::text, 'principal', 'Teste FK', 'interessado');
DELETE FROM clients WHERE name = 'Teste FK';
```

---

## Estrutura das tabelas principais

### `workspaces` (nova — central)
```sql
id          TEXT PRIMARY KEY   -- 'principal' é o valor padrão
name        TEXT NOT NULL
slug        TEXT UNIQUE NOT NULL
settings    JSONB DEFAULT '{}'
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

### `users`
```sql
id           TEXT PRIMARY KEY
username     TEXT UNIQUE NOT NULL  -- campo "identifier" no login
email        TEXT UNIQUE           -- alternativa ao username
pass_hash    TEXT NOT NULL         -- hash bcrypt (rounds=12) ou sha256
hash_algo    TEXT DEFAULT 'bcrypt' -- 'bcrypt' | 'sha256'
role         TEXT DEFAULT 'user'   -- 'admin' | 'user' | 'manager'
active       BOOLEAN DEFAULT true
workspace    TEXT REFERENCES workspaces(id)
failed_logins INTEGER DEFAULT 0   -- proteção brute-force
locked_until  TIMESTAMPTZ          -- bloqueio após 5 falhas (15 min)
last_login    TIMESTAMPTZ
```

### `orders` (campo crítico)
```sql
version  INTEGER NOT NULL DEFAULT 0  -- optimistic locking
-- O PUT /api/orders/:id EXIGE o campo version no body.
-- Sem ele, a API retorna 409.
```

---

## Trocar a senha do admin via script

```bash
node scripts/generate-password-hash.js minha-nova-senha
# Copiar o SQL gerado e executar no Supabase SQL Editor
```

---

## Proteção de brute-force (v0.9.4)

O login agora registra tentativas inválidas:

| Tentativas inválidas | Comportamento |
|---------------------|---------------|
| 1–4 | Retorna 401, delay aleatório |
| 5+ | Bloqueia por 15 min, retorna 423 |

Para desbloquear manualmente:
```sql
UPDATE users
SET failed_logins = 0, locked_until = NULL
WHERE username = 'admin';
```

---

## PIN de manutenção

Operações destrutivas (cleanup, reprocess) exigem um PIN configurado em
**Configurações → Manutenção → Configurar PIN**. O PIN é armazenado como
hash SHA-256 em `settings.dev_pin_hash`.

Para resetar o PIN via SQL:
```sql
UPDATE settings SET dev_pin_hash = NULL WHERE workspace = 'principal';
```
