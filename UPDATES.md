# UPDATES.md — VisitAgroPro
> Última atualização: 10/04/2026 — v0.9.3

---

## ✅ RESUMO EXECUTIVO

A versão **v0.9.3** consolida as correções críticas iniciadas na v0.9.2 e resolve definitivamente os dois erros persistentes reportados em produção:

1. **Erro no check-in:** `Unexpected token '<', '<!DOCTYPE'`
   - Causa raiz: o arquivo `src/app/api/visits/route.ts` **não existia no repositório GitHub**, então o deploy da Vercel retornava HTML 404 para `/api/visits`.
   - Correção: criação do arquivo `src/app/api/visits/route.ts` no projeto.

2. **Erro ao cadastrar produto:** `"client_id obrigatório"`
   - Causa raiz: o arquivo `src/app/dashboard/products/page.tsx` no repositório ainda era uma versão antiga, incompatível com a API atual.
   - Correção: substituição da página de produtos pela versão completa e compatível com o schema atual.

Além disso, esta entrega consolida:
- formulário completo de produtos;
- check-in no mapa com agendamento;
- componente GPS Picker;
- aba de categorias em Configurações;
- auditoria das pendências reais ainda não implementadas.

---

## 📦 ARQUIVOS DESTA ENTREGA (v0.9.3)

| Arquivo | Caminho no repositório | Status | Motivo |
|---------|-------------------------|--------|--------|
| `visits/route.ts` | `src/app/api/visits/route.ts` | **NOVO** | Resolve erro `<!DOCTYPE` no check-in |
| `products/page.tsx` | `src/app/dashboard/products/page.tsx` | Atualizado | Formulário completo + correção do fluxo de cadastro |
| `GpsPickerMap.tsx` | `src/components/map/GpsPickerMap.tsx` | **NOVO** | Componente referenciado e ausente no repo |
| `InteractiveMap.tsx` | `src/components/map/InteractiveMap.tsx` | Atualizado | Modal de check-in + edição no mapa compacto |
| `DashboardShell.tsx` | `src/components/layout/DashboardShell.tsx` | Atualizado | Menu renomeado para **Comissões Indicadores** |
| `products/route.ts` | `src/app/api/products/route.ts` | Atualizado | Retorna todos os campos do schema |
| `settings/page.tsx` | `src/app/dashboard/settings/page.tsx` | Atualizado | Aba de categorias de produtos |

> ⚠️ Os arquivos marcados como **NOVO** não existiam no GitHub. Sem eles, o deploy da Vercel retornava rotas quebradas ou erro 404 em HTML.

---

## 🔴 DIAGNÓSTICO DAS CORREÇÕES CRÍTICAS

### 1) Check-in quebrando com `Unexpected token '<', '<!DOCTYPE'`

**Causa raiz confirmada**
- `src/app/api/visits/route.ts` nunca havia sido commitado no GitHub.
- Em produção, `/api/visits` respondia com HTML 404.
- O frontend tentava fazer parse desse HTML como JSON.

**Correção aplicada**
- Criação da rota `src/app/api/visits/route.ts` no repositório.
- Suporte ao fluxo real de check-in com `POST /api/visits`.

---

### 2) Cadastro de produto retornando `"client_id obrigatório"`

**Causa raiz confirmada**
- A página `src/app/dashboard/products/page.tsx` no repositório era antiga.
- Ela não refletia o formulário atual nem o comportamento esperado da API.
- O erro de `client_id` pertence à rota de visitas, indicando chamada errada, cache antigo ou fluxo inconsistente no frontend anterior.

**Correção aplicada**
- Substituição da página de produtos pela versão atualizada.
- Formulário completo alinhado com o schema e com a rota `/api/products`.

---

## 🧾 HISTÓRICO CONSOLIDADO DE VERSÕES

### v0.9.3
- [x] FIX: criação de `src/app/api/visits/route.ts` no repositório
- [x] FIX: resolução definitiva do erro `<!DOCTYPE` no check-in
- [x] FIX: atualização de `products/page.tsx` com formulário completo
- [x] FIX: alinhamento entre frontend de produtos e API atual
- [x] AUDITORIA: mapeamento consolidado das pendências e módulos incompletos

### v0.9.2
- [x] GPS Picker no cadastro de clientes (`GpsPickerMap.tsx`)
- [x] Check-in de visitas com modal no mapa
- [x] Registro de visita com GPS automático
- [x] Agendamento de próxima visita com data/hora
- [x] Botão **Adicionar ao Google Calendar**
- [x] Edição inline do cliente no popup do mapa
- [x] Edição também disponível no Mapa Rápido do Dashboard
- [x] Menu renomeado para **Comissões Indicadores**
- [x] Aba de **Categorias de Produtos** em Configurações
- [x] Produtos com campos completos do schema
- [x] `products/route.ts` retornando todos os campos necessários

### v0.9.1
- [x] Middleware com HMAC-SHA256 via Web Crypto API
- [x] `JWT_SECRET` obrigatório, sem fallback hardcoded
- [x] `apiFetch` aplicado em fluxos críticos
- [x] Remoção da race condition na numeração de pedidos
- [x] Upgrade para Next.js `14.2.35`
- [x] Node `20.x`

---

## ✅ ESTADO ATUAL POR MÓDULO

### Autenticação & Segurança
- [x] Login JWT HS256 + bcrypt
- [x] Fallback sha256 legado
- [x] Middleware protegendo `/api/*` exceto login
- [x] Delay anti-timing no login
- [x] Troca de senha autenticada
- [x] Audit log de ações
- [ ] Rate limiting ativo no login
- [ ] Bloqueio por tentativas com `failed_logins` / `locked_until`
- [ ] CSP / security headers no `next.config.mjs`

### Mapa & GPS
- [x] Mapa Leaflet + OpenStreetMap
- [x] Marcadores por status
- [x] Busca de endereço
- [x] Botão "Minha localização"
- [x] Popup com dados do cliente
- [x] Edição inline do cliente
- [x] Mapa Rápido no Dashboard
- [x] GPS Picker no cadastro
- [ ] Mapa offline com cache de tiles
- [ ] Indicador online/offline
- [ ] Clientes próximos por Haversine

### Clientes
- [x] CRUD completo
- [x] Busca por nome, telefone e cidade
- [x] Filtro por status
- [x] ViaCEP
- [x] Geocoding por endereço
- [x] Extração de lat/lng por link do Google Maps
- [x] Mini mapa após localização definida
- [ ] Upload de fotos
- [ ] Histórico de visitas por cliente

### Visitas & Check-in
- [x] API `/api/visits`
- [x] Check-in no mapa
- [x] Modal com tipo de atividade, status e observações
- [x] Registro com GPS
- [x] Agendamento de próxima visita
- [x] Link para Google Calendar
- [ ] Tela dedicada de visitas agendadas
- [ ] Histórico de visitas por cliente
- [ ] Filtro por período e tipo
- [ ] Checklist personalizável por visita

### Produtos
- [x] CRUD completo com soft delete
- [x] Busca por nome
- [x] Campos completos do schema:
  - nome
  - modelo
  - SKU
  - categoria
  - cor
  - preço de venda
  - custo
  - estoque
  - unidade
  - % comissão representante
  - FINAME
  - NCM
  - descrição
- [x] Seleção dinâmica de categorias
- [ ] Upload de fotos
- [ ] Filtro por categoria

### Vendas / Pedidos
- [x] Listagem com busca e filtro por status
- [x] Totalizadores por status
- [x] Cadastro com múltiplos produtos
- [x] Cálculo automático de comissão do indicador
- [x] Alteração de status na listagem
- [x] Geração de comissão ao marcar como pago
- [x] Numeração atômica de pedidos
- [ ] Filtro por período
- [ ] PDF / impressão do pedido
- [ ] Desconto por pedido

### Comissões / Indicadores
- [x] CRUD de indicadores
- [x] Dados bancários e Pix
- [x] Comissão fixa ou percentual
- [x] Listagem de comissões
- [x] Totalizadores
- [x] Confirmação de pagamento
- [x] Registro de data/hora de pagamento
- [ ] Upload de comprovante
- [ ] Filtro por indicador e período
- [ ] Comissão de representante (`rep_commissions`)

### Configurações & Administração
- [x] Dados da empresa
- [x] Troca de senha
- [x] Categorias de produtos
- [x] Página de manutenção
- [x] Logs de auditoria
- [x] Reprocessamento de pedidos pagos sem comissão
- [ ] Migrar `authFetch` local de `settings/page.tsx` para `apiFetch`
- [ ] Melhorar captura de `userId` no audit log
- [ ] Categorias de clientes
- [ ] Status customizáveis

---

## ⚠️ PENDÊNCIAS CONFIRMADAS

### Telas / fluxos ainda ausentes
| Item | Status |
|------|--------|
| `/dashboard/visits` — tela de visitas agendadas | Pendente |
| Histórico de visitas por cliente | Pendente |
| `/dashboard/km` — controle de KM | Pendente |
| Agenda/calendário de visitas | Pendente |

### Módulos previstos no schema, mas sem API/UI
| Tabela | Status atual |
|--------|--------------|
| `rep_commissions` | Sem API e sem UI |
| `environments` | Sem API e sem UI |
| `km_logs` | Sem API e sem UI |
| `photos` | Sem API e sem UI |
| `rate_limits` | Existe no banco, mas não está em uso |

### Dívida técnica ainda aberta
| ID | Descrição | Prioridade |
|----|-----------|------------|
| DT-01 | Rate limiting não ativo no login | Alta |
| DT-02 | `settings/page.tsx` ainda usa `authFetch` local | Média |
| DT-03 | `userId` ausente em parte dos registros de audit log | Média |
| DT-04 | Sem validação de schema com Zod nas rotas | Média |
| DT-05 | ESLint 8 deprecated | Baixa |
| DT-06 | `gerar_projeto.js` ainda na raiz do repositório | Baixa |

---

## 🗺️ ROADMAP CONSOLIDADO

### Sprint 1 — Imediato (após deploy v0.9.3)
| # | Item | Arquivo(s) | Esforço |
|---|------|------------|---------|
| S1-01 | Tela de visitas agendadas (`/dashboard/visits`) | `src/app/dashboard/visits/page.tsx` | 6h |
| S1-02 | Rate limiting no login | `src/app/api/auth/login/route.ts` | 3h–4h |
| S1-03 | Migrar `settings/page.tsx` para `apiFetch` | `src/app/dashboard/settings/page.tsx` | 30min |
| S1-04 | Histórico de visitas no popup do cliente | `src/components/map/InteractiveMap.tsx` | 4h |
| S1-05 | Capturar `userId` no audit log das rotas principais | APIs diversas | 3h |

### Sprint 2 — Curto prazo
| # | Item | Arquivo(s) | Esforço |
|---|------|------------|---------|
| S2-01 | Upload de fotos de produtos | `src/app/api/products/[id]/photos/route.ts` | 8h |
| S2-02 | Upload de fotos de clientes | `src/app/api/clients/[id]/photos/route.ts` | 6h |
| S2-03 | Filtro por categoria na listagem de produtos | `src/app/dashboard/products/page.tsx` | 2h |
| S2-04 | Filtro por período em vendas e visitas | `sales/page.tsx` + visitas | 4h |
| S2-05 | Comissão do representante | `src/app/api/rep-commissions/route.ts` | 6h–8h |
| S2-06 | Indicador visual online/offline | layout/header | 2h |

### Sprint 3 — Médio prazo
| # | Item | Arquivo(s) |
|---|------|------------|
| S3-01 | Controle de KM | `src/app/api/km/route.ts` + `src/app/dashboard/km/page.tsx` |
| S3-02 | Dashboard com gráficos (Chart.js) | `src/app/dashboard/page.tsx` |
| S3-03 | Relatório PDF de visitas | `src/app/api/reports/visits/route.ts` |
| S3-04 | Relatório PDF de pedidos | módulo de vendas |
| S3-05 | Clientes próximos (Haversine) | `src/components/map/InteractiveMap.tsx` |
| S3-06 | Validação de schema com Zod nas APIs | rotas `/api/*` |

### Sprint 4 — Offline / PWA
| # | Item | Descrição |
|---|------|-----------|
| S4-01 | Mapa offline | cache de tiles + IndexedDB |
| S4-02 | Fila de sincronização offline | Dexie / IndexedDB |
| S4-03 | Checklist por visita | templates configuráveis |
| S4-04 | Instalação como PWA | manifest + service worker |

---

## 🧩 BANCO DE DADOS — STATUS DE USO

| Tabela | Schema | API | UI | Status |
|--------|:------:|:---:|:--:|--------|
| `users` | ✅ | ✅ | ✅ | OK |
| `clients` | ✅ | ✅ | ✅ | OK |
| `products` | ✅ | ✅ | ✅ | OK |
| `categories` | ✅ | ✅ | ✅ | OK |
| `orders` | ✅ | ✅ | ✅ | OK |
| `order_items` | ✅ | ✅ | ✅ | OK |
| `referrals` | ✅ | ✅ | ✅ | OK |
| `commissions` | ✅ | ✅ | ✅ | OK |
| `visits` | ✅ | ✅ | ✅ parcial | Check-in OK, sem tela de listagem |
| `companies` | ✅ | ✅ | ✅ | OK |
| `settings` | ✅ | ✅ | ✅ | OK |
| `audit_log` | ✅ | ✅ | ✅ | OK |
| `rep_commissions` | ✅ | ❌ | ❌ | Pendente |
| `environments` | ✅ | ❌ | ❌ | Pendente |
| `km_logs` | ✅ | ❌ | ❌ | Pendente |
| `photos` | ✅ | ❌ | ❌ | Pendente |
| `rate_limits` | ✅ | ❌ | ❌ | Pendente |

---

## 📌 CONCLUSÃO

A **v0.9.3** estabiliza os fluxos mais críticos do sistema e fecha os problemas reais de produção identificados até aqui:
- check-in funcional;
- produtos alinhados com o schema;
- mapa com edição e visita agendada;
- categorias de produtos em configurações.

O próximo foco deve ser:
1. **visitas agendadas**,  
2. **rate limiting**,  
3. **histórico de visitas**,  
4. **módulos pendentes do schema** (`photos`, `km_logs`, `rep_commissions`).

---