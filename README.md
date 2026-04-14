# VisitAgroPro — Sistema de Gestão de Visitas em Campo

> **Versão atual:** 0.9.4 — 14/04/2026
> **Status:** ✅ Estável para produção (correções críticas aplicadas)

Sistema web para gerenciamento de visitas comerciais em campo,
com mapa interativo, cadastro de clientes, controle de vendas,
comissões e relatórios. Desenvolvido em Next.js 14 + Supabase.

---

## ⚡ Status dos Módulos

| Módulo | Rota | Status |
|--------|------|--------|
| Login + brute-force | `/auth/login` | ✅ OK |
| Clientes | `/dashboard/clients` | ✅ OK |
| Produtos | `/dashboard/products` | ✅ OK |
| Indicadores | `/dashboard/referrals` | ✅ OK |
| Vendas / Pedidos | `/dashboard/sales` | ✅ OK |
| Comissões indicadores | `/dashboard/commissions` | ✅ OK |
| Mapa + check-in | `/dashboard/map` | ✅ OK |
| Configurações | `/dashboard/settings` | ✅ OK |
| Manutenção | `/dashboard/maintenance` | ✅ OK |
| Logs administrativos | `/dashboard/logs` | ✅ OK (admin-only) |
| Comissões representantes | — | 🔴 Pendente |
| Controle de KM | — | 🟡 Pendente |
| Ambientes / talhões | — | 🟡 Pendente |
| Pré-cadastros / leads | — | 🟡 Pendente |

---

## 🚀 Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Next.js (App Router) | 14.2.35 |
| UI | React | 18 |
| Estilos | Tailwind CSS | 3.4 |
| Ícones | Lucide React | 0.378 |
| Mapas | Leaflet + react-leaflet | 1.9 / 4.2 |
| Geocodificação | Nominatim (OpenStreetMap) | gratuito |
| CEP | ViaCEP API | gratuito |
| Estado Global | Zustand (persist) | 4.5 |
| Banco de Dados | Supabase (PostgreSQL 15) | — |
| Autenticação | JWT HS256 próprio + bcrypt | jsonwebtoken / bcryptjs |
| Deploy | Vercel (região gru1 — São Paulo) | — |
| Node.js | Runtime | ≥ 20.x &lt; 21 |

---

## 📁 Estrutura de Diretórios

```
visitagropro/
├── src/
│   ├── app/
│   │   ├── auth/login/page.tsx           ← Tela de login
│   │   ├── dashboard/
│   │   │   ├── page.tsx                  ← Dashboard com stats e mapa rápido
│   │   │   ├── map/page.tsx              ← Mapa completo de clientes
│   │   │   ├── clients/page.tsx          ← CRUD clientes + geocodificação
│   │   │   ├── products/page.tsx         ← CRUD produtos + categorias
│   │   │   ├── sales/page.tsx            ← Pedidos + itens + comissões
│   │   │   ├── commissions/page.tsx      ← Comissões pendentes/pagas
│   │   │   ├── referrals/page.tsx        ← Indicadores + dados bancários
│   │   │   ├── maintenance/page.tsx      ← Reprocessamento + limpeza
│   │   │   ├── logs/page.tsx             ← Audit log do sistema
│   │   │   └── settings/page.tsx         ← Empresa, perfil, senha
│   │   └── api/
│   │       ├── auth/login/route.ts        ← POST (público)
│   │       ├── auth/change-password/      ← POST (JWT)
│   │       ├── clients/route.ts           ← GET/POST
│   │       ├── clients/[id]/route.ts      ← GET/PUT/DELETE
│   │       ├── products/route.ts          ← GET/POST
│   │       ├── products/[id]/route.ts     ← GET/PUT/DELETE
│   │       ├── orders/route.ts            ← GET/POST
│   │       ├── orders/[id]/route.ts       ← GET/PUT/DELETE
│   │       ├── commissions/route.ts       ← GET
│   │       ├── commissions/[id]/route.ts  ← PUT (pagar)
│   │       ├── referrals/route.ts         ← GET/POST
│   │       ├── referrals/[id]/route.ts    ← PUT/DELETE
│   │       ├── categories/route.ts        ← GET/POST/PUT/DELETE
│   │       ├── cep/[cep]/route.ts         ← GET (proxy ViaCEP)
│   │       ├── settings/route.ts          ← GET
│   │       ├── settings/company/route.ts  ← POST
│   │       └── admin/
│   │           ├── cleanup/route.ts       ← POST
│   │           ├── logs/route.ts          ← GET
│   │           ├── pin/route.ts           ← POST
│   │           └── reprocess/route.ts     ← POST
│   ├── components/
│   │   ├── layout/DashboardShell.tsx      ← Sidebar + navegação
│   │   └── map/
│   │       ├── InteractiveMap.tsx         ← Mapa Leaflet completo
│   │       └── LeafletProvider.tsx        ← SSR-safe wrapper
│   ├── lib/
│   │   ├── apiFetch.ts                   ← fetch autenticado (injeta JWT)
│   │   ├── auth.ts                       ← verifyPassword, JWT
│   │   ├── supabase.ts                   ← cliente anon (client)
│   │   ├── supabaseAdmin.ts              ← service_role (server-only)
│   │   └── commissionHelper.ts           ← geração de comissões
│   ├── store/authStore.ts                ← Zustand auth state
│   └── types/index.ts
├── scripts/
│   ├── generate-password-hash.js
│   ├── generate-hash-standalone.js
│   └── insert_admin.sql
├── schema_completo_v09.sql               ← Schema para projeto novo
├── schema_fix.sql                        ← Migration para banco existente
├── middleware.ts                         ← Proteção JWT de /api/*
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── .env.example
```

---

## 🔑 API Routes

### Autenticação (pública)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login → retorna JWT (username ou email) |
| POST | `/api/auth/change-password` | Troca senha (requer JWT) |

### Clientes / Produtos / Pedidos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/clients` | Listar / criar |
| GET/PUT/DELETE | `/api/clients/:id` | Buscar / atualizar / excluir |
| GET/POST | `/api/products` | Listar / criar |
| GET/PUT/DELETE | `/api/products/:id` | Buscar / atualizar / desativar |
| GET/POST | `/api/orders` | Listar / criar (+ itens em order_items) |
| GET/PUT/DELETE | `/api/orders/:id` | Buscar / atualizar status / cancelar |
| GET/POST/PUT/DELETE | `/api/categories` | CRUD categorias |

### Comercial
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/commissions` | Comissões do indicador |
| PUT | `/api/commissions/:id` | Pagar comissão |
| GET/POST | `/api/referrals` | Listar / criar indicadores |
| PUT/DELETE | `/api/referrals/:id` | Atualizar / desativar |

### Utilitários
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/cep/:cep` | Proxy ViaCEP |
| GET | `/api/settings` | Config + empresa |
| POST | `/api/settings/company` | Salvar empresa |
| GET | `/api/admin/logs` | 200 registros audit_log |
| POST | `/api/admin/reprocess` | Reprocessar comissões |
| POST | `/api/admin/cleanup` | Limpar dados por grupo |
| POST | `/api/admin/pin` | Configurar PIN admin |

> Todas as rotas exceto `/api/auth/login` exigem `Authorization: Bearer <token>`

---

## 🛡️ Segurança

### Como funciona o JWT
```
Login:
  POST /api/auth/login
  ↓ busca user por username/email (maybeSingle — sem crash)
  ↓ verifyPassword(plaintext, bcrypt_hash)
  ↓ generateToken({ id, username, email, role, workspace })
  ↓ { user, token } → Zustand persiste em localStorage

Requisições autenticadas:
  apiFetch('/api/xxx') → injeta Authorization: Bearer <token>
  ↓ middleware.ts (Edge Runtime)
  ↓ decode JWT (sem bcrypt — rápido)
  ↓ verifica expiração
  ↓ injeta x-user-id, x-user-name, x-user-role nos headers
  ↓ handler recebe dados validados
```

### Variáveis de ambiente
```bash
# .env.local (nunca commitar)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
JWT_SECRET=string-aleatoria-min-32-chars
JWT_EXPIRES_IN=28800
```

Gere o JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ⚙️ Deploy

### 1. Supabase
```sql
-- Projeto novo: executar inteiro
schema_completo_v09.sql

-- Banco existente: executar migration segura
schema_fix.sql
```

Login padrão após schema: `admin` / `admin123`
**Troque imediatamente em** `/dashboard/settings`

### 2. Vercel
```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel
vercel --prod

# Ou via dashboard: importar repositório GitHub
# Configurar 4 variáveis de ambiente antes do deploy
```

### 3. Desenvolvimento local
```bash
npm install
cp .env.example .env.local
# Preencher variáveis
npm run dev
# http://localhost:3000
```

---

## ✅ Status das Funcionalidades

### 🟢 Implementado e funcionando
- Login JWT + bcrypt, proteção de rotas
- Dashboard com stats, cards e mapa rápido
- Mapa completo: marcadores coloridos por status, popups com edição inline, filtros, busca Nominatim, geolocalização do usuário
- Clientes: CRUD, geocodificação, CEP automático, lat/lng
- Produtos: CRUD, modelo, cor, categoria, comissão do representante
- Categorias: criar, editar, excluir (soft delete)
- Pedidos: múltiplos itens, cálculo automático, comissão ao marcar como pago
- Comissões do indicador: listar, filtrar, pagar com 1 clique
- Indicadores: CRUD completo com dados bancários
- Manutenção: reprocessamento, limpeza de dados, PIN de segurança
- Audit log: visualização de todas as ações
- Configurações: empresa, perfil, troca de senha

### 🟡 Parcialmente implementado
- Histórico de visitas por cliente (tabela existe, interface na fila)
- Comissões do representante (tabela existe, interface não criada)

### 🔴 Não implementado ainda
- Upload de fotos (produtos, comprovantes)
- PDF/impressão de pedido
- Desconto por pedido (campo no banco, falta campo no formulário)
- Filtro de comissões por período

---

## 📝 Histórico de Correções

### v0.9 — 2026-04
| Tipo | Bug | Solução |
|------|-----|---------|
| 🔴 Crítico | Todos os cards do dashboard redirecionavam para login | `apiFetch.ts` injeta JWT em todas as chamadas |
| 🔴 Crítico | Mapa trava/congela após salvar coordenadas | `key="main-map"` no `MapContainer` |
| 🔴 Crítico | Redirect para login imediatamente após fazer login | Hydration guard em todas as 9 páginas |
| 🔴 Crítico | Vendas: "could not find items column" | Destructuring `{ items, ...orderData }` antes do INSERT |
| 🔴 Crítico | Login falha com hash bcrypt | `bcryptjs` adicionado às deps + import direto |
| 🔴 Crítico | Admin não consegue entrar | Hash real em `insert_admin.sql` |
| 🟡 Médio | Rotas API públicas (sem middleware) | `middleware.ts` criado |
| 🟡 Médio | Categorias sem edição/exclusão | `PUT` + `DELETE` em `/api/categories` |
| 🟡 Médio | Settings era placeholder | Página completa com empresa + senha |
