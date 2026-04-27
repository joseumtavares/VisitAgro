# 📝 Changelog

> Histórico organizado de mudanças relevantes do VisitAgro.

## [L036-D] — 26/04/2026

### 🔒 Guard de propriedade em orders/[id] + WhatsApp para vendas

- `PUT /api/orders/[id]`: representative recebe 403 ao tentar alterar pedido alheio
- `DELETE /api/orders/[id]`: idem para cancelamento de pedido alheio
- Tentativas não autorizadas registradas via `auditLog`
- `GET /api/reports/sales-by-representative/whatsapp`: resumo de vendas pronto para WhatsApp
- Central de Relatórios: botão WhatsApp disponível nas duas tabs (Comissões e Vendas)
- Zero alteração de schema
- Fecha DT-REP-01 e DT-REP-05

**Arquivos criados:**
- `src/app/api/reports/sales-by-representative/whatsapp/route.ts`
- `docs/lotes/L036-D_ETAPA_01_EXECUCAO.md`

**Arquivos alterados:**
- `src/app/api/orders/[id]/route.ts` (guard PUT + guard DELETE)
- `src/app/dashboard/reports/page.tsx` (WhatsApp roteia por tab)

---

## [L036-C] — 26/04/2026

### 📄 Exportação PDF e resumo WhatsApp — Central de Relatórios

- PDF real gerado no servidor via `pdf-lib v1.17.1` (sem dependência do browser)
- `GET /api/reports/rep-commissions/pdf` — PDF de comissões com logotipo e dados da empresa
- `GET /api/reports/sales-by-representative/pdf` — PDF de vendas (consolidado por rep ou individual)
- `GET /api/reports/rep-commissions/whatsapp` — texto formatado pronto para copiar
- Botões "Baixar PDF" e "Copiar resumo WhatsApp" integrados na Central de Relatórios
- Regras de acesso L036-A preservadas em todos os endpoints
- Responsividade: botões com `min-h-[44px]`, `flex flex-wrap` para mobile
- Zero alteração de schema

**Arquivos criados:**
- `src/lib/reports/helpers.ts`
- `src/lib/reports/pdfBuilder.ts`
- `src/app/api/reports/rep-commissions/pdf/route.ts`
- `src/app/api/reports/rep-commissions/whatsapp/route.ts`
- `src/app/api/reports/sales-by-representative/pdf/route.ts`

**Arquivo alterado:**
- `src/app/dashboard/reports/page.tsx` (botões + handlers de exportação)
- `package.json` (adicionado `pdf-lib ^1.17.1`)

---

## [L036-B] — 24/04/2026

### 📊 Central de Relatórios — comissões e vendas por representante

- Nova página `/dashboard/reports` — entrada única para relatórios
- Endpoint `GET /api/reports/rep-commissions` com filtros por período, status e representante
- Endpoint `GET /api/reports/sales-by-representative` com filtros e agrupamento por representante
- Controle de acesso L036-A preservado: `representative` vê apenas dados próprios
- Admin/manager: dropdown de representantes + tabela consolidada `by_representative`
- Totalizadores calculados no servidor (mesma fonte que os dados do banco)
- Sem PDF, sem WhatsApp (escopo deste lote)
- Zero alteração de schema

**Arquivos criados:**
- `src/app/api/reports/rep-commissions/route.ts`
- `src/app/api/reports/sales-by-representative/route.ts`
- `src/app/dashboard/reports/page.tsx`

**Arquivos alterados:**
- `src/components/layout/DashboardShell.tsx` (nav item Relatórios + import BarChart2)

---

## [L037] — 22/04/2026

### 📱 Responsividade mobile do dashboard e mapa

- Menu hamburguer no header mobile (`lg:hidden`)
- Sidebar colapsável com overlay e animação suave
- Grid do dashboard: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Altura do mapa adaptada com `100dvh` para mobile
- Filtros do mapa com scroll horizontal no mobile
- Botão "Novo Lead aqui" com toque mínimo de 44px e destaque visual
- Área de toque mínima (44px) nos botões do check-in modal
- Zero regressão no layout desktop

**Arquivos alterados:**
- `src/components/layout/DashboardShell.tsx`
- `src/components/map/InteractiveMap.tsx`
- `src/app/dashboard/map/page.tsx`
- `src/app/dashboard/page.tsx`

**Documentação:**
- `docs/patches/L037_responsividade.md`
- 
---

## [0.9.6] — 21/04/2026

### 🔐 Segurança — Controle de Acesso por Perfil (L036-A)
- `GET /api/orders`: filtro por `user_id` quando `role === 'representative'` — representative vê apenas seus próprios pedidos
- `UserRole`: tipo TypeScript atualizado com `'representative'` — alinhado com CHECK constraint do banco
- `DashboardShell`: itens **Indicadores** e **Com. Indicadores** ocultados para `representative`
- `sales/page.tsx`: coluna "Ação" e seletor de status ocultados para `representative` (UX)
- Migration `050_representative_role.sql`: CHECK constraint de `users.role` atualizado + índices em `rep_regions`

### ✅ Preservado sem alteração
- `GET /api/rep-commissions` — já filtrava por `rep_id` para não-admin; comportamento mantido
- `PUT /api/rep-commissions/[id]` — guard admin/manager preservado
- Fluxo de criação de pedidos (POST /api/orders)
- Geração automática de comissões ao pagar pedido

---

## [0.9.5] — 18/04/2026

### 🗺️ Nova funcionalidade
- Cadastro de clientes: botão para selecionar/ajustar localização no mapa
- Reutiliza GpsPickerMap existente — GPS automático, clique no mapa, marcador arrastável
- Card visual de localização com coordenadas, link Google Maps, botões Copiar e Editar
- Fluxos anteriores (CEP, Nominatim, campos manuais) 100% preservados

### 🎨 Branding / UI — L033
- metadata atualizada com `VisitAgro Pro`, favicon e apple touch icon locais
- branding visual do login ajustado para usar logo Fortsul + VisitAgro
- branding do cabeçalho da sidebar substituído pela logo lateral local
- badge institucional adicionado no dashboard acima dos KPIs
- subtítulo do login `Acesse sua conta` preservado

## [0.9.4] — 14/04/2026

### ✅ Correções críticas
- reforço nas rotas sensíveis
- estabilização geral do fluxo autenticado
- ajustes estruturais para ambiente de produção
- melhorias em segurança e consistência operacional

### 🔐 Segurança
- endurecimento do login
- reforço contra tentativas abusivas
- validações adicionais no backend
- melhor separação entre contexto client e server

### 🧭 Navegação e operação
- módulos principais revisados
- rotas administrativas mantidas com acesso restrito
- organização da documentação em formato mais amigável

### 🛠️ Manutenção
- melhoria no reprocessamento
- limpeza administrativa preservada
- base preparada para expansão futura

---

## 📍 Próximos itens previstos

### 🟡 Em andamento / planejado
- L036-B: guard em `PUT /api/orders/[id]` para representative (dívida técnica documentada)
- controle de KM
- ambientes e talhões
- evolução de relatórios analíticos

---

## 🔗 Voltar

- [📖 Central da documentação](./index.md)
- [🆕 Updates da versão 0.9.4](./updates-v094.md)
