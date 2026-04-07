# 📍 VisitaPRO v3.2 — Backend Seguro

Sistema de gestão de visitas em campo com mapa OpenStreetMap.
Migrado para Next.js 14 + API Routes — **a anon key do Supabase nunca chega ao browser**.

---

## 🔐 O que mudou na v3.2

| Vulnerabilidade | v3.1 | v3.2 |
|----------------|------|------|
| Anon key exposta no cliente | ❌ Sim | ✅ Nunca — vive no servidor |
| Rate limiting | ❌ Só client-side | ✅ Servidor (IP + usuário) |
| Audit log | ❌ Não | ✅ Tabela `audit_log` no Supabase |
| JWT | ❌ sessionStorage simples | ✅ HS256 assinado pelo servidor |
| Verificação de senha | ⚠️ RPC direto do browser | ✅ Apenas via `/api/auth/login` |
| Headers de segurança | ❌ Não | ✅ CSP, HSTS, X-Frame-Options |

---

## 🚀 Deploy — Passo a Passo

### 1. Supabase — Novo Projeto

1. Acesse [supabase.com](https://supabase.com) e crie um **novo projeto**
2. Aguarde o banco inicializar (~2 min)
3. Vá em **SQL Editor** e execute os scripts **nesta ordem**:

```
1. new_schema.sql
2. migration_v3_km.sql
3. migration_v31_security.sql
4. migration_v32_backend.sql
```

4. Crie o usuário admin com bcrypt (no SQL Editor):
```sql
SELECT visitapro_upsert_user('admin', 'J12u08m19t79@', 'admin');
```

5. Anote as chaves em **Settings → API**:
   - `URL` (Project URL)
   - `anon` key (public)
   - `service_role` key (secret) ← **nunca expor**

---

### 2. GitHub — Novo Repositório

```bash
# Clone ou crie novo repositório
git init visitapro-v32
cd visitapro-v32

# Copie todos os arquivos deste ZIP para a pasta
# Confirme que NÃO há .env.local no repositório

git add .
git commit -m "VisitaPRO v3.2 — Next.js backend seguro"
git remote add origin https://github.com/SEU_USUARIO/visitapro-v32.git
git push -u origin main
```

---

### 3. Vercel — Novo Projeto

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe o repositório GitHub criado acima
3. Framework: **Next.js** (detectado automaticamente)
4. **Antes de clicar em Deploy**, configure as variáveis:

---

### 4. Variáveis de Ambiente na Vercel

Em **Settings → Environment Variables**, adicione:

| Nome | Valor | Onde encontrar |
|------|-------|---------------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` (service_role) | Supabase → Settings → API → secret |
| `SUPABASE_ANON_KEY` | `eyJhbG...` (anon) | Supabase → Settings → API → public |
| `JWT_SECRET` | string aleatória ≥ 32 chars | Gere abaixo |

**Como gerar o JWT_SECRET:**
```bash
# No terminal (Linux/Mac):
openssl rand -base64 32

# Ou no console do navegador:
Array.from(crypto.getRandomValues(new Uint8Array(32)))
  .map(b => b.toString(16).padStart(2,'0')).join('')
```

> ⚠️ Marque todas como **Production + Preview + Development**

---

### 5. Deploy

1. Clique em **Deploy**
2. Aguarde o build (~2 min)
3. Acesse a URL gerada pela Vercel
4. Clique no indicador de status no header → **Testar conexão**
5. Login: `admin` / `J12u08m19t79@`

---

## 🏗️ Estrutura de Arquivos

```
visitapro/
├── package.json                 ← Next.js 14 + jose + @supabase/supabase-js
├── next.config.js               ← Headers de segurança + CSP + rewrite
├── middleware.js                ← Valida JWT em /api/* na Edge
├── .env.example                 ← Template das variáveis de ambiente
├── .gitignore
│
├── lib/
│   ├── supabase.js              ← Cliente service_role (server-only)
│   ├── auth.js                  ← signJwt / verifyJwt HS256
│   ├── rateLimit.js             ← Rate limit via tabela Supabase
│   └── audit.js                 ← Log de eventos de segurança
│
├── pages/api/
│   ├── health.js                ← GET /api/health (público)
│   ├── auth/
│   │   ├── login.js             ← POST /api/auth/login (rate limited + bcrypt)
│   │   └── logout.js            ← POST /api/auth/logout (audit log)
│   ├── clients/
│   │   ├── index.js             ← GET + POST /api/clients
│   │   ├── sync.js              ← POST /api/clients/sync (sync completo)
│   │   └── [id].js              ← PUT + DELETE /api/clients/:id
│   └── km/
│       ├── index.js             ← GET + POST /api/km
│       ├── [id].js              ← DELETE /api/km/:id
│       └── migrate.js           ← POST /api/km/migrate (migração localStorage)
│
├── public/
│   └── index.html               ← Frontend (sem anon key, chama /api/*)
│
├── new_schema.sql               ← Schema base (v2)
├── migration_v3_km.sql          ← Tabela KM (v3)
├── migration_v31_security.sql   ← bcrypt + RPC + brute-force (v3.1)
├── migration_v32_backend.sql    ← rate_limits + audit_log (v3.2)
└── README.md
```

---

## 🔑 Endpoints da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/health` | Público | Status do backend |
| POST | `/api/auth/login` | Público | Login → retorna JWT |
| POST | `/api/auth/logout` | JWT | Registra logout |
| GET | `/api/clients` | JWT | Lista clientes |
| POST | `/api/clients` | JWT | Cria/atualiza cliente |
| POST | `/api/clients/sync` | JWT | Sync completo bidirecional |
| PUT | `/api/clients/:id` | JWT | Atualiza cliente |
| DELETE | `/api/clients/:id` | JWT | Remove cliente |
| GET | `/api/km` | JWT | Lista registros KM |
| POST | `/api/km` | JWT | Cria/atualiza KM |
| DELETE | `/api/km/:id` | JWT | Remove KM |
| POST | `/api/km/migrate` | JWT | Migra KM do localStorage |

---

## 🛡️ Segurança Implementada

- **Zero anon key no browser** — toda comunicação passa pelas API Routes
- **JWT HS256** assinado com `JWT_SECRET` (env var), expira em 8h
- **Rate limiting duplo** — 20 req/min por IP + 5 req/min por usuário no login
- **bcrypt via pgcrypto** — verificação de senha no banco (SECURITY DEFINER)
- **Audit log** — todo login (sucesso/falha), logout e sync registrado
- **Content Security Policy** — bloqueia execução de scripts externos não autorizados
- **HSTS** — força HTTPS por 2 anos
- **X-Frame-Options: DENY** — previne clickjacking
- **Ownership nas rotas** — usuário só acessa seus próprios dados
- **Input sanitization** — todos os campos limitados e validados no servidor

---

## 🚧 Roadmap — Próximas Versões

| Prioridade | Funcionalidade |
|-----------|----------------|
| 🔴 Alta | **Supabase Auth nativo** — 2FA, refresh token JWT, auditoria nativa |
| 🔴 Alta | **Blacklist de tokens** — invalidação server-side no logout |
| 🟡 Média | **Upstash Redis** para rate limiting (mais performático) |
| 🟡 Média | **Checklist personalizável** por visita |
| 🟡 Média | **Relatórios automatizados** com filtros por período |
| 🔵 Baixa | **Galeria de fotos georreferenciadas** |
| 🔵 Baixa | **Roteirização** entre clientes no mapa |
| 🔵 Baixa | **FastAPI** para rotas de negócio complexas (KM, relatórios) |
