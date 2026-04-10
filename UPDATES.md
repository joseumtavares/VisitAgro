# UPDATES.md — VisitAgroPro v0.9.x → v1.0
> Planejamento atualizado em 09/04/2026 | Baseado no Guia Mestre de Desenvolvimento + código real v0.9.2

---

## ✅ JÁ IMPLEMENTADO (v0.1 → v0.9.2)

### Autenticação & Segurança
- [x] Login JWT HS256 + bcrypt (rounds 12) com fallback sha256 legado
- [x] Middleware Edge com verificação HMAC-SHA256 via Web Crypto API (v0.9.1)
- [x] JWT_SECRET obrigatório — sem fallback hardcoded (v0.9.1)
- [x] Proteção de todas as rotas `/api/*` exceto `/api/auth/login`
- [x] Delay anti-timing no login (300-500ms randomizado)
- [x] Logout com limpeza de estado Zustand
- [x] Troca de senha autenticada (`/api/auth/change-password`)
- [x] Audit log de ações (tabela `audit_log`)
- [ ] Rate limiting ativo no login (tabela `rate_limits` existe no schema, **não está sendo usada**)
- [ ] Bloqueio por tentativas (`failed_logins`, `locked_until` existem na tabela `users`)

### Mapa & GPS
- [x] Mapa interativo Leaflet + OpenStreetMap (SSR-safe via `dynamic`)
- [x] Marcadores coloridos por status do cliente
- [x] Filtros de status no mapa completo
- [x] Busca de endereço no mapa (Nominatim, debounced)
- [x] Botão "Minha localização" (GPS nativo)
- [x] Popup com info completa do cliente
- [x] **Editar cliente inline no popup** — agora disponível em ambos os modos (mapa completo e Mapa Rápido) — v0.9.2
- [x] Mapa Rápido no Dashboard (modo compacto)
- [x] Auto-centralização nos clientes cadastrados
- [x] GPS Picker no cadastro de clientes — v0.9.2
- [ ] Mapa offline com cache de tiles (leaflet.offline + IndexedDB) — **Roadmap M-01**
- [ ] Indicador visual Online/Offline — **Roadmap B-02**
- [ ] Clientes próximos por Haversine — **Roadmap M-03**

### Clientes
- [x] CRUD completo (cadastro, edição, exclusão soft)
- [x] Busca por nome, telefone e cidade
- [x] Filtro por status
- [x] Busca de CEP via ViaCEP
- [x] Geocoding por endereço (Nominatim)
- [x] Colar link Google Maps e extrair lat/lng automaticamente
- [x] Marcar localização pelo GPS (GpsPickerMap) — v0.9.2
- [x] Mini-mapa inline após localização definida
- [ ] Upload de foto (frente/verso documento, comprovante residência) — **Roadmap M-02**
- [ ] Histórico de visitas por cliente na listagem
- [ ] Clientes próximos (Haversine) — **Roadmap M-03**

### Visitas & Check-in
- [x] API `/api/visits` com GET e POST — v0.9.2
- [x] **Botão Check-in no mapa** (abre modal) — v0.9.2
- [x] Modal Check-in: tipo de atividade, status do cliente, observações — v0.9.2
- [x] Registro de check-in com GPS automático (se disponível) — v0.9.2
- [x] Agendamento de próxima visita com data/hora — v0.9.2
- [x] **Botão "Adicionar ao Google Calendar"** — v0.9.2
- [ ] Tela de agenda/calendário dedicada (FullCalendar) — **Roadmap A-02**
- [ ] Histórico de visitas por cliente (tela de detalhes)
- [ ] Checklist personalizável por visita — **Roadmap M-04**
- [ ] Filtro de visitas por período e tipo

### Produtos
- [x] CRUD completo com soft delete
- [x] Busca por nome
- [x] **Campos completos**: nome, modelo, SKU, categoria, cor, preço venda, custo, estoque, unidade, % comissão rep, FINAME, NCM, descrição — v0.9.2
- [x] Seleção de categoria dinâmica (busca `/api/categories`)
- [ ] Upload de fotos do produto (Supabase Storage) — **Roadmap M-02**
- [ ] Filtro por categoria na listagem

### Vendas / Pedidos
- [x] Listagem com busca e filtro por status
- [x] Totalizadores por status
- [x] Cadastro com múltiplos produtos, indicador, forma de pagamento
- [x] Cálculo automático de comissão do indicador
- [x] Alteração de status na listagem
- [x] Geração automática de comissão ao marcar "Pago"
- [x] Numeração atômica de pedidos (SEQUENCE + trigger) — sem race condition
- [ ] Filtro por período (data)
- [ ] PDF/impressão do pedido — **Roadmap M-05**
- [ ] Desconto por pedido (campo existe no banco)

### Comissões de Indicadores
- [x] Listagem com busca e filtro por status
- [x] Totalizadores (a pagar, pago, total)
- [x] Confirmar pagamento com 1 clique
- [x] Registro de data/hora do pagamento
- [x] **Renomeado para "Comissões Indicadores"** no menu — v0.9.2
- [ ] Upload de comprovante de pagamento
- [ ] Filtro por indicador e período

### Indicadores (Referrals)
- [x] CRUD completo
- [x] Dados bancários: banco, agência, conta, Pix
- [x] Tipo de comissão: valor fixo ou percentual

### Configurações
- [x] Dados da empresa (nome, endereço, contato)
- [x] Troca de senha
- [x] **Gerenciamento de categorias de produtos** — v0.9.2
- [x] Visualização dos status disponíveis (cliente, pedido)
- [ ] PIN de segurança para manutenção (estava na página maintenance)
- [ ] Categorias de clientes (campo `category` existe na tabela, fixo no código)
- [ ] Status personalizáveis (médio prazo)

### Administração
- [x] Manutenção: PIN de segurança, reprocessamento de comissões, limpeza por grupo
- [x] Logs de auditoria (últimas 200 ações)
- [x] Reprocessamento de pedidos pagos sem comissão

### Infraestrutura
- [x] Next.js 14.2.35 (CVE corrigido)
- [x] Node 20.x (fixado)
- [x] Vercel + região gru1 + maxDuration 15s
- [x] Singleton supabaseAdmin
- [x] apiFetch centralizado com injeção de token
- [x] .gitignore cobrindo .env.local e .next
- [ ] CSP / Security Headers no `next.config.mjs`
- [ ] Rate limiting ativo

---

## 🚧 PRÓXIMAS IMPLEMENTAÇÕES

### Sprint 1 — Correções Imediatas (esta semana)

| # | Item | Arquivo | Esforço |
|---|------|---------|---------|
| S1-01 | **Chekin fix**: `updated_at` removido do payload (coluna pode não existir) | `visits/route.ts` | ✅ Feito v0.9.2 |
| S1-02 | **Renomear menu**: "Comissões" → "Comissões Indicadores" | `DashboardShell.tsx` | ✅ Feito v0.9.2 |
| S1-03 | **Produtos**: adicionar todos campos do schema (modelo, SKU, cor, FINAME, NCM, custo, % comissão) | `products/page.tsx` + `products/route.ts` | ✅ Feito v0.9.2 |
| S1-04 | **Configurações**: aba de categorias de produtos (CRUD) | `settings/page.tsx` | ✅ Feito v0.9.2 |
| S1-05 | **GpsPickerMap**: criar componente faltante (erro de import) | `GpsPickerMap.tsx` | ✅ Feito v0.9.2 |
| S1-06 | Ativar rate limiting no login usando tabela `rate_limits` do schema | `api/auth/login/route.ts` | 4h |
| S1-07 | `settings/page.tsx`: migrar `authFetch` local para `apiFetch` | `settings/page.tsx` | 30min |

### Sprint 2 — Funcionalidades de Campo (próximas 2 semanas)

| # | Item | Descrição | Esforço |
|---|------|-----------|---------|
| S2-01 | **Histórico de visitas** no card do cliente | Listar visitas por cliente em modal ou drawer | 6h |
| S2-02 | **Tela de agenda** (visitas agendadas) | Lista de visitas com status "agendado", com opção de marcar como realizada | 8h |
| S2-03 | **Upload de fotos** de produtos | Integração com Supabase Storage, bucket `agrovisita-fotos` | 8h |
| S2-04 | **Filtro por período** em Vendas e Visitas | Inputs de data início/fim | 4h |
| S2-05 | **Comissão do representante** no fechamento de pedido | Calcular e registrar em `rep_commissions` | 6h |
| S2-06 | **Indicador visual Online/Offline** no header | Badge + desabilitar botões que precisam de internet | 2h |

### Sprint 3 — Dashboard e Relatórios (1 mês)

| # | Item | Descrição | Esforço |
|---|------|-----------|---------|
| S3-01 | **KPIs visuais** no Dashboard | Chart.js: barras de visitas/mês, pizza de status de clientes, conversão | 12h |
| S3-02 | **Relatório PDF de visitas** | jsPDF + autoTable, filtro por período | 8h |
| S3-03 | **Relatório PDF de pedidos** | Comprovante de venda por pedido | 6h |
| S3-04 | **Clientes próximos** no mapa | Haversine: botão "Ver clientes próximos" ordenados por distância | 6h |
| S3-05 | **Controle de KM** | Registro de hodômetro por rota/visita | 10h |

### Sprint 4 — PWA e Offline (2 meses)

| # | Item | Descrição | Esforço |
|---|------|-----------|---------|
| S4-01 | **Mapa offline** | leaflet.offline + IndexedDB, botão "Salvar área offline" | 16h |
| S4-02 | **Fila de sync offline** | IndexedDB via Dexie.js, processa ao reconectar | 20h |
| S4-03 | **Checklist por visita** | Templates configuráveis em JSON (tabela `checklist_templates`) | 20h |
| S4-04 | **PWA install prompt** | manifest.json, service worker, ícones | 8h |

---

## 📋 SCHEMA — Tabelas Existentes vs Utilizadas

| Tabela | Schema | Em uso | Obs |
|--------|--------|--------|-----|
| `users` | ✅ | ✅ | Completo |
| `clients` | ✅ | ✅ | Completo |
| `products` | ✅ | ✅ | Campos completos adicionados v0.9.2 |
| `categories` | ✅ | ✅ | CRUD em Configurações v0.9.2 |
| `orders` | ✅ | ✅ | Completo |
| `order_items` | ✅ | ✅ | Completo |
| `referrals` | ✅ | ✅ | Completo |
| `commissions` | ✅ | ✅ | Comissões de indicadores |
| `visits` | ✅ | ✅ | Check-in implementado v0.9.2 |
| `companies` | ✅ | ✅ | Settings empresa |
| `settings` | ✅ | ✅ | Config workspace |
| `audit_log` | ✅ | ✅ | Logs de ação |
| `rep_commissions` | ✅ | ❌ | Comissão do representante — **pendente** |
| `environments` | ✅ | ❌ | Módulo de ambientes/estufas — **pendente** |
| `km_logs` | ✅ | ❌ | Controle de KM — **Sprint 3** |
| `photos` | ✅ | ❌ | Galeria georreferenciada — **Sprint 2** |
| `rate_limits` | ✅ | ❌ | Rate limiting login — **Sprint 1** |

---

## 🐛 BUGS CONHECIDOS / DÍVIDA TÉCNICA

| # | Severity | Descrição | Status |
|---|----------|-----------|--------|
| B-01 | 🔴 | Erro "DOCTYPE is not valid JSON" no checkin — `updated_at` no payload | ✅ Corrigido v0.9.2 |
| B-02 | 🟠 | `settings/page.tsx` usa `authFetch` local em vez de `apiFetch` | Pendente |
| B-03 | 🟠 | Rate limiting não ativo no login (brute force possível) | Sprint 1 |
| B-04 | 🟡 | `userId` não capturado em `auditLog` da maioria das rotas | Sprint 1 |
| B-05 | 🟡 | ESLint 8 deprecated | Baixa prioridade |
| B-06 | 🟡 | Sem validação de schema (Zod) nas rotas de API | Sprint 3 |
| B-07 | 🟢 | `gerar_projeto.js` ainda na raiz do repositório | Remover |

---

## 📁 ARQUIVOS ENTREGUES NO v0.9.2

```
src/
├── app/
│   ├── api/
│   │   ├── visits/route.ts              ← FIX: remove updated_at, suporte next_visit_date
│   │   └── products/route.ts            ← NOVO: retorna todos os campos do schema
│   └── dashboard/
│       ├── products/page.tsx            ← NOVO: formulário completo (modelo, SKU, cor, FINAME, NCM, custo...)
│       └── settings/page.tsx            ← NOVO: aba de Categorias de Produtos
└── components/
    ├── layout/
    │   └── DashboardShell.tsx           ← FIX: "Comissões" → "Comissões Indicadores"
    └── map/
        ├── GpsPickerMap.tsx             ← NOVO: componente GPS Picker (estava faltando)
        └── InteractiveMap.tsx           ← NOVO: Check-in modal + Editar no mapa compacto
```

---

## 🏗️ ARQUITETURA DE REFERÊNCIA (Guia Mestre)

### Supabase Storage — Bucket para Fotos
```sql
-- Criar bucket via dashboard Supabase ou SQL:
-- Nome: agrovisita-fotos (público)
-- Tamanho máximo por arquivo: 5MB
-- Tipos aceitos: image/jpeg, image/png, image/webp
```

### Rate Limiting — Implementação Pendente
```typescript
// Usar tabela rate_limits já existente no schema
// Sliding window: máximo 5 tentativas em 15 minutos por IP
// Bloquear: retornar 429 com Retry-After header
```

### Google Calendar — Formato de URL (implementado no Check-in)
```
https://www.google.com/calendar/render?action=TEMPLATE
  &text=TÍTULO_ENCODED
  &dates=YYYYMMDDTHHMMSSZ/YYYYMMDDTHHMMSSZ
  &details=DESCRIÇÃO_ENCODED
```
Não requer OAuth — abre direto no Google Calendar do usuário logado.

---

*Gerado automaticamente com base no Guia Mestre de Desenvolvimento e análise do código v0.9.2*
