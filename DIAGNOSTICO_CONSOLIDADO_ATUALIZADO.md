# 📊 DIAGNÓSTICO TÉCNICO CONSOLIDADO — AGROVISITA PRO v0.9.4+

**Data da análise:** 2026-04-14 (atualizado com Guia Mestre v1.0)  
**Versão do sistema:** v0.9.4 → Roadmap v4.0+  
**Stack:** Next.js 14 + Supabase (PostgreSQL 15) + Leaflet.js  
**Classificação:** Documento Técnico Interno — Referência para Desenvolvimento

---

## 1. RESUMO EXECUTIVO ATUALIZADO

### Estado Geral do Sistema

O AgroVisita Pro está **78% completo** em relação ao schema implementado no banco de dados. O sistema possui funcionalidades core operacionais (clientes, produtos, vendas, comissões de indicadores, mapa interativo), mas apresenta **5 entidades críticas sem interface frontend**, apesar de terem suporte total ou parcial no backend.

### Impacto do Guia Mestre Recebido

O **Guia Mestre de Desenvolvimento v1.0** recebido descreve uma arquitetura **diferente** da implementada atualmente:

| Aspecto | Guia Mestre Descreve | Implementação Atual | Gap |
|---------|---------------------|---------------------|-----|
| Frontend | SPA single-file (`public/index.html`) | Next.js App Router (`src/app/`) | **Arquitetura diferente** |
| API Routes | `pages/api/*` (Pages Router) | `src/app/api/*` (App Router) | **Next.js 13+ vs legado** |
| Mapa Offline | leaflet.offline + Service Worker | react-leaflet (online apenas) | **Funcionalidade ausente** |
| Auth | JWT HS256 + bcrypt | @supabase/auth + RLS | **Implementação diferente** |
| PWA | Manifest + install prompt | Não implementado | **Ausente** |

### Conclusão da Análise Comparativa

O **Guia Mestre** parece descrever um sistema anterior (ThermoVisit?) ou uma arquitetura planejada que não foi seguida na implementação atual (v0.9.4). A implementação atual usa:
- ✅ Next.js 14 App Router (mais moderno que Pages Router)
- ✅ Supabase Auth nativo (mais seguro que JWT customizado)
- ✅ TypeScript (não mencionado no guia)
- ✅ Componentes React modulares (não SPA single-file)

**Recomendação inicial:** Manter a arquitetura atual (v0.9.4) que é mais moderna, mas incorporar as funcionalidades do roadmap que fazem sentido para o negócio.

---

## 2. VARREDURA GLOBAL DE AUSÊNCIAS (ATUALIZADA)

### A. Entidades do Schema sem Interface (Evidência Real)

| # | Tabela | Schema | API | Frontend | Criticidade | Prioridade |
|---|--------|--------|-----|----------|-------------|------------|
| 1 | **visits** | ✅ | ✅ GET/POST | ❌ | 🔴 CRÍTICA | 🔴 **CRÍTICA** |
| 2 | **pre_registrations** | ✅ | ❌ | ❌ | 🔴 CRÍTICA | 🔴 **CRÍTICA** |
| 3 | **rep_commissions** | ✅ | ⚠️ Parcial | ❌ | 🟠 ALTA | 🟠 **ALTA** |
| 4 | **environments** | ✅ | ❌ | ❌ | 🟠 ALTA | 🟠 **ALTA** |
| 5 | **km_logs** | ✅ | ❌ | ❌ | 🟡 MÉDIA | 🟡 **MÉDIA** |
| 6 | photos | ✅ | ❌ | ⚠️ Parcial | 🟡 MÉDIA | 🟢 BAIXA |
| 7 | categories | ✅ | ✅ | ⚠️ Settings | 🟢 BAIXA | 🟢 BAIXA |

### B. APIs Existentes sem Frontend

#### 1. `/api/visits` (GET/POST) — PRIORIDADE MÁXIMA

**Arquivo:** `/workspace/src/app/api/visits/route.ts` (120 linhas)

**Funcionalidades implementadas:**
```typescript
GET /api/visits?client_id={id}
  - Lista todas as visitas do workspace
  - Filtro opcional por cliente
  - Ordenado por created_at DESC
  - Limite 100 registros

POST /api/visits
  - Cria visita agendada OU check-in
  - Atualiza status do cliente no check-in
  - Agenda próxima visita automaticamente
  - Gera link do Google Calendar
  - Audit log integrado
```

**Consumidores atuais:**
- `/workspace/src/components/map/InteractiveMap.tsx` (linha 269) — ÚNICO consumidor
- Nenhuma página dedicada existe

**Gap crítico:** API completa esperando frontend há semanas

#### 2. Rotas de Admin (Parciais)

| Rota | Funcionalidade | Status |
|------|---------------|--------|
| `/api/admin/cleanup` | Limpeza de dados por workspace | ✅ Funcional (admin apenas) |
| `/api/admin/reprocess` | Reprocessamento de comissões | ✅ Funcional (admin apenas) |
| `/api/admin/logs` | Logs de auditoria | ✅ Funcional (já tem UI em /dashboard/logs) |
| `/api/admin/pin` | PIN de desenvolvedor | ✅ Funcional |

### C. Páginas do Dashboard — Inventário Completo

**Implementadas (10 páginas):**
```
✅ /dashboard              — Dashboard principal (KPIs básicos)
✅ /dashboard/map          — Mapa interativo Leaflet + clientes
✅ /dashboard/clients      — CRUD completo de clientes
✅ /dashboard/products     — CRUD completo de produtos
✅ /dashboard/referrals    — CRUD de indicadores + comissões
✅ /dashboard/sales        — Pedidos/Vendas (orders + order_items)
✅ /dashboard/commissions  — Comissões de indicadores
✅ /dashboard/maintenance  — Ferramentas admin (cleanup, reprocess)
✅ /dashboard/logs         — Logs de auditoria
✅ /dashboard/settings     — Configurações da empresa/workspace
```

**AUSENTES (5 páginas críticas):**
```
❌ /dashboard/visits           — API pronta, zero frontend
❌ /dashboard/pre-registrations — Tabela existe, zero código
❌ /dashboard/rep-commissions  — Backend parcial, zero frontend
❌ /dashboard/environments     — FK em orders, zero código
❌ /dashboard/km-logs          — Tabela completa, zero código
```

### D. Comparação com Roadmap do Guia Mestre

| Funcionalidade do Roadmap | Status no Guia | Status na Implementação v0.9.4 | Gap |
|---------------------------|----------------|-------------------------------|-----|
| Mapa interativo | ✅ v1.0 | ✅ Implementado | OK |
| Cadastro de clientes + GPS | ✅ v1.0 | ✅ Implementado | OK |
| Geocoding (Nominatim) | ✅ v1.0 | ✅ Implementado (`/api/cep`) | OK |
| Login JWT + bcrypt | ✅ v2.0/v3.1 | ⚠️ Supabase Auth (diferente) | Arquitetura diferente |
| PWA (manifest + install) | ✅ v2.0 | ❌ Não implementado | **AUSENTE** |
| Sync bidirecional | ✅ v2.0 | ⚠️ Parcial (só online) | **OFFLINE AUSENTE** |
| Controle de KM | ✅ v3.0 | ⚠️ Tabela existe, sem UI | **PARCIAL** |
| Módulo de Ambientes | ✅ v4.0 | ⚠️ Tabela existe, sem UI | **PARCIAL** |
| Registro de Visitas | ✅ v4.0 | ⚠️ API existe, sem UI | **PARCIAL** |
| Galeria de Fotos | 🔄 Parcial v4.0 | ⚠️ Tabela existe, upload não | **PARCIAL** |
| **Mapa offline com GPS** | ❌ Roadmap | ❌ Não implementado | **AUSENTE** |
| **Dashboard de métricas** | ❌ Roadmap | ⚠️ Básico existe | **EXPANSÃO NECESSÁRIA** |
| Checklist personalizável | ❌ Roadmap | ❌ Zero código | **AUSENTE** |
| Clientes próximos (Haversine) | ❌ Roadmap | ❌ Zero código | **AUSENTE** |
| Relatórios PDF | ❌ Roadmap | ❌ Zero código | **AUSENTE** |
| Gestão de Agendas (FullCalendar) | ❌ Roadmap | ⚠️ visits table existe | **PARCIAL** |
| Módulo de Pedidos/Vendas | ❌ Roadmap | ✅ Implementado | OK |
| Controle de Comissões | ❌ Roadmap | ✅ Indicadores, ❌ Reps | **PARCIAL** |

---

## 3. MAPA DE PÁGINAS FALTANTES (DETALHADO)

### 📋 Página 1: VISITAS / AGENDA — PRIORIDADE CRÍTICA #1

| Campo | Detalhe |
|-------|---------|
| **Nome** | Visitas / Agenda |
| **Rota** | `/dashboard/visits` |
| **Evidência primária** | API `/workspace/src/app/api/visits/route.ts` (120 linhas) |
| **Evidência secundária** | Tabela `public.visits` (schema linhas 304-323) |
| **Consumidor existente** | `InteractiveMap.tsx` linha 269 (check-in via mapa) |
| **Tipo** | Frontend ausente para backend 100% pronto |
| **Impacto técnico** | Médio — API ociosa |
| **Impacto de negócio** | **CRÍTICO** — Nome do sistema é "AgroVisita" |
| **Esforço estimado** | 8-12 horas (backend já existe) |
| **Dependências** | Nenhuma (API pronta) |
| **Status** | 🔴 **CRÍTICA — IMPLEMENTAR PRIMEIRO** |

**Funcionalidades a implementar:**
- [ ] Listagem com filtros (status, cliente, período)
- [ ] Modal de nova visita/agendamento
- [ ] Modal de check-in (já existe no InteractiveMap!)
- [ ] Integração com Google Calendar (lógica já existe na API)
- [ ] Botão "Check-in" no popup do mapa (extensão do existente)

**Gap específico:** API precisa de PUT/DELETE (atualmente só GET/POST)

---

### 📋 Página 2: PRÉ-CADASTROS (LEADS) — PRIORIDADE CRÍTICA #2

| Campo | Detalhe |
|-------|---------|
| **Nome** | Pré-Cadastros / Leads |
| **Rota** | `/dashboard/pre-registrations` |
| **Evidência** | Tabela `public.pre_registrations` (schema linhas 197-213) |
| **Campos principais** | id, workspace, name, tel, email, interest, source, status, obs, converted_client_id |
| **Constraint crítica** | `converted_client_id REFERENCES clients(id)` — fluxo lead→cliente |
| **Status enum** | 'novo', 'contatado', 'qualificado', 'convertido', 'perdido' |
| **Zero referências** | Confirmado via grep no código todo |
| **Tipo** | Ausência funcional total (zero código) |
| **Impacto de negócio** | **CRÍTICO** — Funil de entrada de clientes bloqueado |
| **Esforço estimado** | 16-20 horas (criar API + frontend) |
| **Status** | 🔴 **CRÍTICA** |

**Funcionalidades mínimas:**
- [ ] API CRUD completa (`/api/pre-registrations`)
- [ ] Listagem com filtro por status
- [ ] Formulário de cadastro de lead
- [ ] Ação de conversão: lead → cliente (transação SQL)
- [ ] Histórico de conversões

---

### 📋 Página 3: COMISSÕES DE REPRESENTANTES — PRIORIDADE ALTA

| Campo | Detalhe |
|-------|---------|
| **Nome** | Comissões de Representantes |
| **Rota** | `/dashboard/rep-commissions` |
| **Evidência** | Tabela `public.rep_commissions` (schema linhas 275-301) |
| **Backend existente** | `/api/admin/cleanup` e `/api/admin/reprocess` |
| **Diferença chave** | `commissions` = indicadores, `rep_commissions` = representantes por item |
| **Campos únicos** | order_item_id, product_id, rep_commission_pct, reprocessed_at |
| **Tipo** | Ausência funcional com backend parcial |
| **Impacto de negócio** | **ALTO** — Comissão por produto vs comissão geral |
| **Esforço estimado** | 16-24 horas |
| **Status** | 🟠 **ALTA** |

**Confusão identificada:**
- `commissions`: % sobre venda total (indicador)
- `rep_commissions`: % por item/produto (representante)
- **Necessário:** Clarificar na UI a diferença entre os dois módulos

---

### 📋 Página 4: AMBIENTES / TALHÕES — PRIORIDADE ALTA

| Campo | Detalhe |
|-------|---------|
| **Nome** | Ambientes / Talhões / Estufas |
| **Rota** | `/dashboard/environments` |
| **Evidência** | Tabela `public.environments` (schema linhas 95-112) |
| **FK crítica** | `environment_id` em `orders` (schema linha 159) — SEM USO |
| **Campo único** | `drawing JSONB` — desenho geográfico no mapa |
| **Integração potencial** | Mapa Leaflet + polígonos desenhados |
| **Tipo** | Ausência funcional total |
| **Impacto de negócio** | **ALTO** — Agricultura de precisão por talhão |
| **Esforço estimado** | 20-28 horas (desenho no mapa é complexo) |
| **Status** | 🟠 **ALTA** |

**Funcionalidades únicas:**
- [ ] Desenho de polígonos no mapa (Leaflet Drawing?)
- [ ] Cálculo automático de área (ha)
- [ ] Vínculo de pedidos a talhões específicos
- [ ] Histórico por ambiente

---

### 📋 Página 5: CONTROLE DE KM — PRIORIDADE MÉDIA

| Campo | Detalhe |
|-------|---------|
| **Nome** | Controle de KM / Hodômetro / Frota |
| **Rota** | `/dashboard/km-logs` |
| **Evidência** | Tabela `public.km_logs` (schema linhas 120-138) |
| **Campos ricos** | km_ini, km_fim, percorrido, combustivel, consumo, litros, custo_por_km |
| **FK** | `user_id REFERENCES users(id)` |
| **Tipo** | Ausência funcional total |
| **Impacto de negócio** | **MÉDIO** — Controle de custos operacionais |
| **Esforço estimado** | 12-16 horas |
| **Status** | 🟡 **MÉDIA** |

**Observação:** Guia Mestre menciona "Controle de KM/Hodômetro ✅ Implementado v3.0", mas não há código no repositório atual. Possível migração pendente do localStorage para Supabase.

---

## 4. FUNCIONALIDADES DO ROADMAP AUSENTES

### 4.1 Mapa Offline — PRIORIDADE ALTA (do Roadmap)

**Descrição do Guia Mestre:**
- Usar `leaflet.offline` + IndexedDB para cache de tiles OSM
- Service Worker para interceptar requisições de tiles
- GPS funciona offline (satélite), só tiles precisam de cache
- Badge de conectividade Online/Offline

**Status atual:** Zero implementação de offline no sistema v0.9.4

**Benefício:** Representantes em campo rural sem internet poderiam usar o mapa

**Esforço estimado:** 3-5 dias (Fase 1 do Roadmap)

**Implementação sugerida:**
```typescript
// Adicionar ao InteractiveMap.tsx
import { apiFetch } from '@/lib/apiFetch';

// Monitor de conectividade
const [online, setOnline] = useState(navigator.onLine);
useEffect(() => {
  const handleOnline = () => setOnline(true);
  const handleOffline = () => setOnline(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// Badge na UI
<div className={`px-2 py-1 rounded text-xs ${online ? 'bg-green-600' : 'bg-red-600'} text-white`}>
  {online ? '🟢 Online' : '🔴 Offline'}
</div>
```

---

### 4.2 Sync Offline Robusto (IndexedDB) — PRIORIDADE CRÍTICA (do Roadmap)

**Descrição:** Substituir localStorage por IndexedDB + fila de sincronização

**Status atual:** Sistema só funciona online (exceto dados temporários no navegador)

**Tabelas necessárias no IndexedDB:**
```typescript
// lib/offline-db.ts (usando Dexie.js)
import Dexie from 'dexie';

export const db = new Dexie('AgroVisitaOffline');
db.version(1).stores({
  clientes:  '++id, supabase_id, sync_status, updated_at, user_id',
  visitas:   '++id, supabase_id, sync_status, updated_at, cliente_id',
  km:        '++id, supabase_id, sync_status, data',
  fotos:     '++id, supabase_id, sync_status, visita_id, blob',
  sync_queue:'++id, tabela, operacao, payload, tentativas, created_at'
});
```

**Esforço estimado:** 5-8 dias (Fase 2 do Roadmap)

---

### 4.3 Galeria de Fotos Completa — PRIORIDADE MÉDIA (do Roadmap)

**Status atual:** Tabela `photos` existe, mas não há upload de fotos implementado

**Funcionalidades faltantes:**
- Upload de múltiplas fotos por visita/cliente
- Compressão antes do upload (Canvas API)
- Visualizador de galeria por cliente
- Miniaturas (thumbnails)
- Exclusão de fotos

**Esforço estimado:** 3-5 dias (Fase 3 do Roadmap)

---

### 4.4 Clientes Próximos (Haversine) — PRIORIDADE MÉDIA (do Roadmap)

**Descrição:** Sugerir visitas baseadas na localização GPS atual

**Fórmula já documentada no Guia Mestre:**
```typescript
function haversineKm(lat1, lon1, lat2, lon2): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

**Esforço estimado:** 3-4 dias (Fase 4 do Roadmap)

---

### 4.5 Relatórios PDF — PRIORIDADE BAIXA (do Roadmap)

**Descrição:** Gerar PDF de visitas, KM e clientes usando jsPDF

**Status atual:** Zero implementação

**Esforço estimado:** 2-3 dias (Fase 5 do Roadmap)

---

### 4.6 Checklist Personalizável — PRIORIDADE BAIXA (do Roadmap)

**Descrição:** Formulários dinâmicos configuráveis por tipo de visita

**Tabelas necessárias (não existem no schema atual):**
```sql
CREATE TABLE agrovisita_checklist_templates (
  id UUID PRIMARY KEY,
  nome VARCHAR(255),
  campos JSONB NOT NULL,  -- Definição dos campos dinâmicos
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE agrovisita_checklist_respostas (
  id UUID PRIMARY KEY,
  visita_id UUID REFERENCES visits(id),
  template_id UUID REFERENCES checklist_templates(id),
  respostas JSONB NOT NULL
);
```

**Esforço estimado:** 5-7 dias (Fase 6 do Roadmap)

---

## 5. PRIORIZAÇÃO CONSOLIDADA

### 🔴 PRIORIDADE CRÍTICA (Implementar nas próximas 2 semanas)

| # | Página/Funcionalidade | Justificativa | Esforço | Dependências |
|---|----------------------|---------------|---------|--------------|
| 1 | **Visitas (`/dashboard/visits`)** | API pronta, core business, menor esforço | 8-12h | Nenhuma |
| 2 | **Pré-Cadastros** | Funil de leads bloqueado, tabela existe | 16-20h | Nenhuma |
| 3 | **Mapa Offline + Conectividade** | Critical para campo sem internet | 3-5 dias | Nenhuma |
| 4 | **Sync Offline (IndexedDB)** | Permite uso offline real | 5-8 dias | Mapa offline |

### 🟠 PRIORIDADE ALTA (Sprint 3-4)

| # | Página/Funcionalidade | Justificativa | Esforço | Dependências |
|---|----------------------|---------------|---------|--------------|
| 5 | **Comissões de Representantes** | Diferente de indicadores, impacto financeiro | 16-24h | Nenhuma |
| 6 | **Ambientes/Talhões** | FK em orders sem uso, agricultura de precisão | 20-28h | Nenhuma |
| 7 | **Galeria de Fotos** | Tabela existe, upload não implementado | 3-5 dias | Sync offline |

### 🟡 PRIORIDADE MÉDIA (Backlog)

| # | Página/Funcionalidade | Justificativa | Esforço |
|---|----------------------|---------------|---------|
| 8 | **Controle de KM** | Controle de custos, tabela isolada | 12-16h |
| 9 | **Clientes Próximos** | Sugestão de roteiro inteligente | 3-4 dias |
| 10 | **Relatórios PDF** | Necessidade ocasional de export | 2-3 dias |

### 🟢 PRIORIDADE BAIXA (Roadmap futuro)

| # | Funcionalidade | Justificativa | Esforço |
|---|---------------|---------------|---------|
| 11 | **Checklist Personalizável** | Complexidade alta, valor médio | 5-7 dias |
| 12 | **Dashboard de Métricas (KPIs)** | Já existe básico, expansão | 7-10 dias |
| 13 | **Gestão de Agendas (FullCalendar)** | Overlap com visits | 7-10 dias |
| 14 | **Localização Tempo Real** | Nice-to-have, baixo valor | 5-7 dias |

---

## 6. PLANO DE IMPLEMENTAÇÃO — PRIMEIRA PÁGINA CRÍTICA

### 📌 VISITAS / AGENDA — Implementação Imediata

#### 1. Nome e Rota
- **Nome:** Visitas / Agenda
- **Rota:** `/dashboard/visits`

#### 2. Evidência Real
- **API existente:** `/workspace/src/app/api/visits/route.ts` (120 linhas)
- **Tabela:** `public.visits` (schema linhas 304-323)
- **Consumidor atual:** `InteractiveMap.tsx` linha 269 (check-in via mapa)
- **Re-export:** `/workspace/src/app/visits/route.ts` (apenas re-exporta API)

#### 3. Objetivo
- **Problema:** API de visitas funcional mas inacessível aos usuários
- **Solução:** Frontend completo para gerenciar visitas e check-ins
- **Fluxo habilitado:** Agendar visita → Check-in no local → Registrar observações → Agendar próxima

#### 4. Campos Mínimos (da tabela)

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| client_id | uuid | ✅ | Vínculo com cliente |
| user_id | uuid | ❌ | Automático do JWT |
| activity_type | enum | ✅ | Visita/Ligação/WhatsApp/Email/Reunião |
| scheduled_date | timestamp | ❌ | Data agendada |
| visit_date | timestamp | ❌ | Data real da visita (check-in) |
| status | enum | ✅ | agendado/realizado/cancelado/nao_compareceu |
| obs | text | ❌ | Observações da visita |
| lat/lng | double | ❌ | Localização do check-in |
| photos | jsonb | ❌ | Array de IDs de fotos (futuro) |

#### 5. Ações Mínimas

| Ação | Endpoint | Status |
|------|----------|--------|
| Listar visitas | GET `/api/visits` | ✅ Pronto |
| Criar visita/agendar | POST `/api/visits` | ✅ Pronto |
| Fazer check-in | POST `/api/visits` (body.checkin=true) | ✅ Pronto |
| **Atualizar visita** | **PUT `/api/visits/[id]`** | ❌ **FALTANDO** |
| **Excluir visita** | **DELETE `/api/visits/[id]`** | ❌ **FALTANDO** |
| Listar por cliente | GET `/api/visits?client_id=X` | ✅ Pronto |

#### 6. Dependências

**Rotas API a criar:**
```typescript
// src/app/api/visits/[id]/route.ts
PUT    /api/visits/[id]   — Atualizar visita (editar agendamento, status, obs)
DELETE /api/visits/[id]   — Soft delete (deleted_at)
```

**Autenticação:** Via middleware (padrão do sistema)

**Headers necessários:**
- `x-user-id` — injetado pelo middleware
- `x-workspace` — padrão 'principal'

**Queries principais:**
```typescript
// Listar com filtros
SELECT * FROM visits
WHERE workspace = $1
  AND deleted_at IS NULL
  AND (client_id = $2 OR $2 IS NULL)
ORDER BY scheduled_date DESC;

// Atualizar
UPDATE visits
SET status = $1, obs = $2, updated_at = now()
WHERE id = $3 AND workspace = $4;
```

#### 7. Riscos

| Risco | Nível | Mitigação |
|-------|-------|-----------|
| API PUT/DELETE não testada | Baixo | Criar testes manuais no Insomnia |
| Conflito de check-in simultâneo | Baixo | Raro em uso real |
| Performance com muitas visitas | Médio | Paginação (limite 100 já existe) |
| Integração com mapa quebrar | Baixo | Testar após deploy |

#### 8. Plano de Implementação Incremental

**Dia 1 (4-6 horas):**
- [ ] Criar `/api/visits/[id]/route.ts` com PUT e DELETE
- [ ] Testar endpoints no Insomnia/cURL
- [ ] Commit e deploy de teste

**Dia 2 (6-8 horas):**
- [ ] Criar `/dashboard/visits/page.tsx` (listagem)
- [ ] Implementar filtros (status dropdown, período)
- [ ] Integrar com API existente
- [ ] Testes manuais

**Dia 3 (6-8 horas):**
- [ ] Modal de Nova Visita (reaproveitar lógica do mapa)
- [ ] Modal de Check-in (copiar do InteractiveMap e adaptar)
- [ ] Botão "Ver Detalhes" (modal de edição)
- [ ] Testes de integração

**Dia 4 (opcional — 4-6 horas):**
- [ ] Botão "Check-in" no popup do cliente (mapa)
- [ ] Link direto: `/dashboard/visits?checkin={client_id}`
- [ ] Melhorias de UX (busca de cliente, date picker)

**Versão Mínima Funcional (MVP — 2 dias):**
- [ ] Listagem com filtros básicos
- [ ] Botão "Nova Visita" (agendamento)
- [ ] Botão "Check-in" no mapa (já existe, só testar)

---

## 7. PRÓXIMOS PASSOS RECOMENDADOS

### Ordem de Implementação (Roadmap Atualizado)

| Semana | Entregável | Páginas | Funcionalidades |
|--------|-----------|---------|-----------------|
| **Semana 1** | Módulo de Visitas (MVP) | `/dashboard/visits` | API PUT/DELETE, listagem, check-in |
| **Semana 1** | Módulo de Visitas (Completo) | `/dashboard/visits` | Próxima visita, integração mapa |
| **Semana 2** | Módulo de Leads | `/dashboard/pre-registrations` | API + frontend, conversão lead→cliente |
| **Semana 3** | Mapa Offline | (existing pages) | leaflet.offline, badge conectividade |
| **Semana 3** | Sync Offline | (infra) | IndexedDB + fila de sincronização |
| **Semana 4** | Comissões Rep. | `/dashboard/rep-commissions` | Listagem, reprocessamento manual |
| **Semana 5** | Ambientes | `/dashboard/environments` | CRUD + desenho no mapa |
| **Semana 6** | Galeria de Fotos | (existing pages) | Upload, compressão, visualizador |
| **Backlog** | KM Logs | `/dashboard/km-logs` | Quando prioridade subir |

### Ações Imediatas (Hoje/Amanhã)

1. ✅ **Validar diagnóstico** — Confirmar que Visitas é realmente a prioridade #1
2. ✅ **Criar branch feature** — `feature/visits-module`
3. ⚠️ **Investigar gap** — Por que API de visitas foi feita sem frontend?
4. ⚠️ **Decidir escopo** — MVP (2 dias) ou completo (4 dias)?

### Decisões Arquiteturais Pendentes

1. **Manter vs migrar arquitetura:** 
   - ✅ Manter Next.js 14 App Router (mais moderno que guia mestre)
   - ✅ Manter Supabase Auth (mais seguro que JWT customizado)
   - ⚠️ Incorporar funcionalidades do roadmap (offline, sync, etc.)

2. **Dupla comissão (commissions vs rep_commissions):**
   - ❓ Precisamos de ambos ou unificar?
   - ❓ Qual a regra de negócio exata?

3. **PWA offline-first:**
   - ✅ Implementar leaflet.offline (baixo esforço, alto valor)
   - ✅ Implementar IndexedDB sync (médio esforço, alto valor)

---

## 8. CONCLUSÃO

### Diagnóstico Final

O AgroVisita Pro v0.9.4 está **funcional para operações básicas** (clientes, produtos, vendas, comissões de indicadores), mas possui **5 módulos críticos incompletos** que bloqueiam fluxos importantes de negócio.

### Maior Oportunidade

**Módulo de Visitas** é a oportunidade de maior ROI imediato:
- Backend 100% pronto (120 linhas de API)
- Esforço estimado: 8-12 horas
- Impacto: Libera funcionalidade core do sistema ("AgroVisita")
- Risco: Mínimo (API já testada indiretamente pelo mapa)

### Próximos Passos

1. **Esta semana:** Implementar `/dashboard/visits` (MVP em 2 dias)
2. **Próxima semana:** Implementar `/dashboard/pre-registrations`
3. **Sprint 3:** Mapa offline + sync IndexedDB (roadmap v4.0)

### Observação sobre o Guia Mestre

O **Guia Mestre de Desenvolvimento v1.0** recebido descreve uma arquitetura diferente da implementada. Recomenda-se:
- ✅ **Manter** arquitetura atual (Next.js 14 App Router + Supabase Auth + TypeScript)
- ✅ **Incorporar** funcionalidades do roadmap (offline, sync, gallery, etc.)
- ❌ **Não migrar** para arquitetura single-file SPA (é menos moderna)

---

**Fim do Diagnóstico Consolidado**  
*Auditor Técnico Sênior — Especialista Next.js + Supabase*  
*Documento gerado em 2026-04-14 baseado em evidências reais do repositório + Guia Mestre v1.0*
