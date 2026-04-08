# 🛠️ Setup do Banco de Dados — Agrovisita Pro

## Por que o login falha com "Credenciais inválidas"?

Foram identificados **4 problemas** na versão anterior:

| # | Arquivo | Problema | Correção |
|---|---------|----------|----------|
| 1 | `schema.sql` | Hash bcrypt do usuário admin era um **placeholder inválido** (`...4.4.4.4`) — bcrypt nunca validaria | Hash deve ser gerado com `node scripts/generate-password-hash.js` |
| 2 | `schema.sql` | Tabela `users` tinha coluna `password_hash` mas o código lê `pass_hash` | Tabela recriada com coluna correta `pass_hash` |
| 3 | `route.ts` | `.single()` lançava erro `PGRST116` quando usuário não era encontrado — caindo no catch como erro 500 | Substituído por `.maybeSingle()` |
| 4 | `auth.ts` | `expiresIn: parseInt(JWT_EXPIRES_IN) + 's'` produzia string `'3600s'` inválida para o JWT | Corrigido para `parseInt(JWT_EXPIRES_IN)` (número) |

---

## Passo a Passo

### 1. Rodar o schema no Supabase

No **SQL Editor** do Supabase, execute o conteúdo de `schema.sql`.

> ⚠️ Se já tiver tabelas antigas com estrutura diferente, faça DROP primeiro:
> ```sql
> DROP TABLE IF EXISTS users CASCADE;
> ```

### 2. Gerar o hash da senha do admin

No terminal do projeto:

```bash
node scripts/generate-password-hash.js admin123
```

Saída esperada:
```
Hash: $2a$12$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

── SQL para atualizar no Supabase ──
UPDATE users SET pass_hash = '$2a$12$XXX...' WHERE username = 'admin';
```

### 3. Inserir o hash no banco

Copie o SQL gerado no passo anterior e execute no **SQL Editor** do Supabase.

### 4. Variáveis de ambiente na Vercel

Configure no painel **Settings → Environment Variables**:

| Variável | Tipo | Onde encontrar |
|----------|------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Supabase → Settings → API → service_role |
| `JWT_SECRET` | **Secret** | Gere com: `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | Secret | `28800` (8 horas em segundos) |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` **nunca** deve ter o prefixo `NEXT_PUBLIC_`.

### 5. Verificar o login

Acesse `/auth/login` e use:
- **Usuário:** `admin`
- **Senha:** `admin123` (ou a senha que você definiu no passo 2)

---

## Estrutura da tabela `users` (obrigatória)

```sql
username  TEXT UNIQUE NOT NULL  -- campo "identifier" no formulário
email     TEXT UNIQUE           -- alternativa ao username
pass_hash TEXT NOT NULL         -- hash bcrypt (rounds=12)
hash_algo TEXT DEFAULT 'bcrypt'
active    BOOLEAN DEFAULT true  -- filtrado no login
role      TEXT DEFAULT 'user'
workspace TEXT DEFAULT 'principal'
```
