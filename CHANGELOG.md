# CHANGELOG — VisitaGroPro

Todas as alterações notáveis deste projeto estão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

---

## [0.9.4] — 2026-04-14

### 🔴 Correções críticas de runtime

- **fix: seed obrigatório da tabela `workspaces` em `scripts/insert_admin.sql`**
  Todas as tabelas do schema possuem `FK NOT NULL` para `workspaces(id)`. Sem a row
  `principal` previamente inserida, qualquer operação de INSERT (clients, products,
  orders, users, settings) falharia com violação de FK em instalação limpa.
  O seed idempotente (`ON CONFLICT DO NOTHING`) foi adicionado como **primeira instrução**
  do arquivo, antes de qualquer outro INSERT.
  — `scripts/insert_admin.sql`

### 🔒 Segurança

- **fix: `/api/auth/login` migrado para `getAdmin()` + proteção de brute-force**
  A rota criava sua própria instância de `createClient` (Supabase) a cada request,
  contornando o singleton e ignorando os campos `failed_logins`, `locked_until` e
  `last_login` do schema. Agora:
  - Usa `getAdmin()` do módulo centralizado
  - Verifica `locked_until` antes de processar a senha
  - Incrementa `failed_logins` a cada tentativa inválida
  - Bloqueia o usuário por 15 min após 5 falhas consecutivas (`locked_until`)
  - Reseta `failed_logins` e atualiza `last_login` no login bem-sucedido
  - Remove campos sensíveis (`pass_hash`, `hash_algo`, `failed_logins`,
    `locked_until`, `last_login`) da resposta ao cliente
  - Registra evento em `audit_log` via `auditLog()`
  — `src/app/api/auth/login/route.ts`

- **fix: `/api/admin/logs` restrito a `role = 'admin'`**
  Qualquer usuário autenticado conseguia acessar todos os logs de auditoria do sistema.
  Agora a rota usa `getRequestContext()` para verificar o role e retorna `403` para
  usuários não-admin. Contrato `{ logs: [...] }` preservado.
  — `src/app/api/admin/logs/route.ts`

- **fix: `/api/auth/change-password` valida workspace do usuário**
  A rota buscava o usuário apenas por `id`, sem validar `workspace` nem `active`.
  Em teoria, um token de um workspace poderia alterar senha de usuário de outro.
  Agora usa `getRequestContext()` e filtra por `id + workspace + active = true`.
  O update também aplica o filtro de workspace. Adicionado `auditLog` no sucesso.
  — `src/app/api/auth/change-password/route.ts`

- **fix: `supabaseAdmin.ts` marcado como server-only**
  Adicionado `import 'server-only'` para impedir que `getAdmin()` (que expõe a
  `SUPABASE_SERVICE_ROLE_KEY`) seja importado acidentalmente em componentes
  client-side e vaze no bundle público.
  — `src/lib/supabaseAdmin.ts`

### 🐛 Correções de bug

- **fix: `apiFetch` não força `Content-Type: application/json` em FormData**
  O helper anterior sempre injetava `Content-Type: application/json`, o que corromperia
  uploads `multipart/form-data` (fotos de visitas, comprovantes de comissão). Agora
  o header só é injetado quando o body **não** é uma instância de `FormData`.
  Headers existentes no `init` também não são mais sobrescritos.
  — `src/lib/apiFetch.ts`

- **fix: `remove()` em clients silenciava erros de DELETE**
  A função recarregava a lista mesmo quando o backend retornava erro (ex.: FK
  constraint). O registro continuava no banco mas desaparecia temporariamente da
  UI. Agora verifica `r.ok` e exibe `setError()` com a mensagem do backend.
  — `src/app/dashboard/clients/page.tsx`

- **fix: `remove()` em referrals silenciava erros de DELETE**
  Mesmo problema da página de clientes.
  — `src/app/dashboard/referrals/page.tsx`

- **fix: `confirmPayment()` em commissions silenciava erro do PUT**
  A confirmação de pagamento de comissão não verificava a resposta do servidor.
  Adicionado estado `error`, verificação de `r.ok` e early return em caso de falha.
  — `src/app/dashboard/commissions/page.tsx`

- **fix: logs/page.tsx não tratava resposta 403 nem erros de carregamento**
  A função `load()` atribuía `j.logs` sem verificar `r.ok`, causando falha silenciosa.
  Agora trata 403 com mensagem "Acesso restrito a administradores" e demais erros com
  mensagem genérica visível na tela.
  — `src/app/dashboard/logs/page.tsx`

### 🏗️ Qualidade de código

- **refactor: `src/types/index.ts` sincronizado com o schema atual**
  - `User`: removido `pass_hash` (campo sensível nunca deve trafegar ao frontend);
    adicionados `name`, `workspace`, `company_id`, `last_login`, `updated_at`
  - `Client`: adicionados `tel2`, `category`, `maps_link`, `zip_code`, `obs`,
    `indicado`, `deleted_at`, `updated_at`
  - `Product`: adicionados `cost_price`, `model`, `color`, `sku`, `finame_code`,
    `ncm_code`, `unit`, `deleted_at`, `updated_at`
  - `Order`: adicionados `version`, `commission_value`, `commission_type`,
    `commission_pct`, `discount`, `environment_id`, `deleted_at`, `updated_at`,
    relações opcionais `clients` e `referrals`
  - `Commission`: campos completos alinhados ao schema (`referral_name`,
    `client_name`, `order_date`, `order_total`, `receipt_photo_ids`, `workspace`)
  - Adicionadas interfaces: `OrderItem`, `Referral`, `Visit`, `Category`, `Company`
  - Adicionados tipos: `CommissionStatus`, `ActivityType`
  — `src/types/index.ts`

---

## [0.9.3] — 2026-04-10

### Correções críticas de build/runtime

- fix: criação de `src/app/api/visits/route.ts` (arquivo não existia no repo)
- fix: resolução do erro `Unexpected token '<', '<!DOCTYPE'` no check-in
- fix: atualização de `products/page.tsx` com formulário completo

### Novidades

- feat: modal de check-in no mapa com agendamento de próxima visita
- feat: componente `GpsPickerMap.tsx`
- feat: aba de categorias em Configurações
- feat: menu renomeado para "Comissões Indicadores"

---

## [0.9.2] — 2026-04-09

### Segurança (crítico)

- fix: verificação de assinatura HMAC-SHA256 no middleware
- fix: remoção do JWT_SECRET hardcoded em auth.ts

### Correções de bug

- fix: fetch() puro substituído por apiFetch() em clients, referrals
- fix: race condition na geração de order_number
- fix: hydration guard nas páginas do dashboard

---

## [0.9.1] — 2026-04-08

- Versão inicial funcional com login, clientes, produtos, vendas, mapa e comissões
