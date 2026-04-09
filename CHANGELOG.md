# CHANGELOG — VisitaGroPro

Todas as alterações notáveis deste projeto estão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

---

## [0.9.1] — 2026-04-09

### 🔒 Segurança (crítico)

- **fix: verificação de assinatura HMAC-SHA256 no middleware**
  O middleware anterior só decodificava o payload base64 e verificava a expiração (`exp`),
  sem validar a assinatura do token. Qualquer atacante com acesso ao formato JWT poderia
  forjar um token com payload arbitrário (ex.: `role: admin`) e passar pela autenticação.
  Agora o middleware usa `crypto.subtle.verify()` (Web Crypto API, disponível no Edge
  Runtime) para verificar a assinatura HMAC-SHA256 antes de qualquer outra operação.
  — `middleware.ts`

- **fix: remoção do JWT_SECRET hardcoded em auth.ts**
  Havia um fallback `|| 'TROQUE-EM-PRODUCAO-...'` na constante `SECRET`. Se a variável
  `JWT_SECRET` não estivesse configurada na Vercel, a aplicação subia com um segredo
  público, permitindo forjar tokens válidos. Agora a aplicação lança exceção imediata
  se a variável não estiver presente — falha rápida e explícita em vez de falha silenciosa.
  — `src/lib/auth.ts`

### 🐛 Correções de bug

- **fix: fetch() puro substituído por apiFetch() em clients/page.tsx**
  A função `save()` usava `fetch()` sem o header `Authorization`, recebendo 401 do
  middleware. Cadastro e edição de clientes falhavam silenciosamente ou redirecionavam
  para o login. Substituído por `apiFetch()` que injeta o token automaticamente.
  — `src/app/dashboard/clients/page.tsx`

- **fix: fetch() puro substituído por apiFetch() em referrals/page.tsx**
  Mesmo problema: `save()` de indicadores usava `fetch()` puro. Cadastro e edição
  de indicadores falhavam com 401.
  — `src/app/dashboard/referrals/page.tsx`

- **fix: race condition na geração de order_number**
  O código contava linhas da tabela (`SELECT COUNT(*)`) para atribuir o número do pedido.
  Duas requisições simultâneas gerariam o mesmo número. O schema v09 já possui
  `CREATE SEQUENCE order_number_seq` e o trigger `trg_set_order_number` que atribui o
  número automaticamente e de forma atômica no banco. Removidas as 3 linhas de contagem
  manual; o insert não passa mais `order_number` — o trigger cuida disso.
  — `src/app/api/orders/route.ts`

### ♻️ Refatorações

- **refactor: unificação do cliente Supabase admin**
  `clients/route.ts`, `clients/[id]/route.ts` e `products/route.ts` tinham função
  `getAdmin()` inline duplicada que criava um novo `SupabaseClient` a cada requisição
  (sem singleton). Substituídos pelo `import { getAdmin } from '@/lib/supabaseAdmin'`
  que reutiliza o singleton e mantém consistência com os demais routes.
  — `src/app/api/clients/route.ts`
  — `src/app/api/clients/[id]/route.ts`
  — `src/app/api/products/route.ts`

- **refactor: mensagens de erro internas não expostas ao cliente**
  `clients/route.ts` agora retorna mensagens genéricas ao cliente e loga o detalhe
  internamente via `console.error`, evitando vazar nomes de colunas ou queries do
  Supabase para o browser.

### 📦 Dependências e configuração

- **chore: upgrade next 14.2.3 → 14.2.35**
  Versão 14.2.3 continha vulnerabilidade de segurança divulgada em dezembro de 2025
  (ver https://nextjs.org/blog/security-update-2025-12-11). Atualizado para 14.2.35,
  última versão da linha 14.x com todos os patches de segurança aplicados.
  `eslint-config-next` atualizado junto para manter compatibilidade.

- **chore: engines.node fixado em "20.x"**
  O valor anterior `>=18.17.0` causava warning da Vercel e poderia fazer upgrade
  automático para um novo major Node.js. Fixado em `20.x` (LTS ativo).

- **chore: remoção de gerar_projeto.js do bundle**
  Script de scaffolding (29 KB) estava na raiz do projeto e seria incluído no deploy.
  Não é carregado pelo Next.js, mas expunha detalhes da arquitetura interna.

- **chore: .gitignore criado**
  Adicionado `.gitignore` cobrindo `node_modules`, `.next`, `.env.local` e artefatos
  de build para evitar commits acidentais de dados sensíveis.

- **docs: .env.example atualizado**
  Adicionadas instruções claras sobre JWT_SECRET ser obrigatório, instrução de geração
  com `openssl rand -base64 48` e nota de que `SUPABASE_SERVICE_ROLE_KEY` nunca deve
  ser exposta no browser.

---

## [0.9.0] — 2026-04-09

### Adicionado
- Schema completo v09 com `CREATE SEQUENCE order_number_seq` e trigger
  `trg_set_order_number` para geração atômica de números de pedido
- API de categorias (`/api/categories`)
- `schema_completo_v09.sql` substituindo scripts parciais anteriores

---

## [0.8.1] — 2026-04-09

### Corrigido
- Centralização de todas as chamadas fetch() das páginas do dashboard em `apiFetch()`
  para injeção automática do token JWT (correção parcial — clients e referrals save()
  permaneciam com fetch() puro, corrigidos na v0.9.1)

---

## [0.8.0] — 2026-04-08

### Adicionado
- `apiFetch.ts` — wrapper autenticado sobre fetch()
- Fix: `.maybeSingle()` no login (era `.single()`, crashava com PGRST116)
- Fix: extração de `items` do body antes do insert em `orders` (coluna inexistente)

---

## [0.7.0] — 2026-04-07

### Adicionado
- `supabaseAdmin.ts` com singleton e `auditLog()`
- Geração automática de comissão ao marcar pedido como "pago"
- Proteção JWT em todas as rotas `/api/*` via `middleware.ts`

---

## [0.6.0] — 2026-04-06

### Adicionado
- Dashboard com KPIs, mapa compacto, totalizadores de vendas e comissões
- Módulo de Indicadores com dados bancários e chave Pix
- Módulo de Manutenção: PIN de segurança, reprocessamento de comissões, limpeza

---

## [0.5.0] — 2026-04-05

### Adicionado
- Mapa interativo (Leaflet + OpenStreetMap) com marcadores por status
- Busca de endereço por CEP (ViaCEP) e geocoding via Nominatim
- Edição inline de clientes no popup do mapa

---

## [0.1.0] — 2026-04-03

### Adicionado
- Projeto inicial: Next.js 14 App Router + Supabase + Tailwind CSS
- Login JWT (HS256) com suporte a bcrypt e SHA-256 legacy
- CRUD de Clientes, Produtos, Pedidos e Comissões
- Deploy na Vercel (região gru1)
