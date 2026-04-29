# L040 — ETAPA 01 — EXECUÇÃO

**VisitAgro | lote_id: L040**
**Data de execução:** 2026-04-28
**Executado por:** Agente Sênior Fullstack + Revisor + Auditor

---

## 1. Resumo Executivo

Lote L040 entregue com escopo exato definido no ETAPA_00. Duas ausências de UI
foram preenchidas com as APIs já existentes e funcionais:

- **Entrega 1:** `src/app/dashboard/visits/page.tsx` — página de Histórico de Visitas (novo arquivo).
- **Entrega 2:** `src/app/dashboard/pre-registrations/pre-registrations-page.tsx` — botão "Converter em Cliente" adicionado.
- **Entrega 3:** `src/components/layout/DashboardShell.tsx` — item "Visitas" inserido no menu de navegação.

Zero alteração de schema. Zero alteração de rotas de API.

---

## 2. Evidências Usadas

| Arquivo lido | Propósito |
|---|---|
| `AGENTES.md` | Regras operacionais e formato de entrega |
| `docs/playbook-operacional.md` | Fluxo e DoD |
| `src/app/api/visits/route.ts` | Contrato GET /api/visits confirmado |
| `src/app/api/pre-registrations/[id]/convert/route.ts` | Contrato POST /api/.../convert confirmado |
| `src/app/dashboard/pre-registrations/pre-registrations-page.tsx` | Arquivo base para patch L040 |
| `src/components/layout/DashboardShell.tsx` | Âncora exata para inserção do item Visitas |
| `src/types/index.ts` | Tipo Visit confirmado |
| `docs/ui/responsividade.md` | Regras mobile-first |

---

## 3. Causa Raiz

Dívidas técnicas DT04 (Visits API sem frontend) e DT05 (pre-registrations sem conversão)
identificadas na AUDITORIA_TECNICA_COMPLETA_v0.9.4.md. As APIs existiam e funcionavam;
faltava apenas a camada de UI.

---

## 4. Escopo Executado

### 4.1 Entrega 1 — `src/app/dashboard/visits/page.tsx` (NOVO)

- Consome `GET /api/visits` + `GET /api/clients` (join client-side para nome)
- Filtros: status (agendado/realizado/cancelado/nao_compareceu) + activity_type
- Busca por texto (cliente + observação)
- **Cards mobile** (`sm:hidden`) — obrigatório para 6 colunas (docs/ui/responsividade.md)
- **Tabela desktop** (`hidden sm:block`) com overflow-x controlado
- Hydration guard padrão Zustand persist
- Link "Ir para o Mapa" (check-in ocorre no InteractiveMap)
- Somente leitura — criação via check-in no mapa preservada

### 4.2 Entrega 2 — `pre-registrations-page.tsx` (PATCH)

Adições exclusivas L040 (nenhuma lógica L038/anterior alterada):
- Import `UserPlus` de lucide-react
- Estado: `convertTarget`, `converting`, `convertToast`
- Função `showConvertToast` — toast temporário (3,5 s)
- Função `handleConvert` — POST `/api/pre-registrations/[id]/convert`
- **Toast de resultado** (fixed, z-9999, acima de todos os modais)
- **Botão "Converter"** na tabela desktop — visível apenas quando `status !== 'convertido'`
- **Botão "Converter"** nos cards mobile — idem
- **Modal de confirmação** — confirmar antes de chamar a API

### 4.3 Entrega 3 — `DashboardShell.tsx` (PATCH MÍNIMO)

- Import `CalendarCheck` adicionado ao bloco de imports lucide-react
- Item `{ href: '/dashboard/visits', label: 'Visitas', icon: <CalendarCheck /> }` inserido
  após o item Mapa e antes de Configurações

---

## 5. Arquivos Alterados

| Arquivo | Tipo | Sensibilidade | Operação |
|---|---|---|---|
| `src/app/dashboard/visits/page.tsx` | NOVO | — | Criação |
| `src/app/dashboard/pre-registrations/pre-registrations-page.tsx` | ALTERADO | Média | Patch com novos estados e UI |
| `src/components/layout/DashboardShell.tsx` | ALTERADO | Alta | Dois pontos cirúrgicos (import + array) |

---

## 6. Arquivos Preservados

- `src/app/api/visits/route.ts` — intocado
- `src/app/api/pre-registrations/[id]/convert/route.ts` — intocado
- `src/app/dashboard/pre-registrations/page.tsx` — intocado (re-exporta o page-component)
- `middleware.ts` — intocado
- `src/lib/**` — intocado
- `src/types/index.ts` — intocado
- `sql/**` — intocado (zero migration)

---

## 7. Riscos e Mitigação

| Risco | Classificação | Mitigação |
|---|---|---|
| `handleConvert` sem rollback automático | `melhoria_opcional_baixo_risco` | Modal de confirmação exige ação consciente do usuário |
| Join client-side pode mostrar `—` para clientes soft-deleted | `preservado` | Comportamento aceitável; GET /api/clients já filtra deleted_at |
| `CalendarCheck` pode não existir em lucide-react 0.378 | `correcao_obrigatoria_verificar` | Verificar versão; fallback é trocar por `Calendar` |

> **Verificação obrigatória antes de deploy:** confirmar que `CalendarCheck` existe em
> `lucide-react@0.378.0`. Caso não exista, substituir por `Calendar` no import e no NAV_ITEMS.

---

## 8. Auto-Revisão Técnica

- [x] Paths reais verificados contra arquivos do repositório
- [x] Escopo ETAPA_00 respeitado (zero migration, zero rota nova)
- [x] DashboardShell alterado com diff mínimo (2 pontos cirúrgicos)
- [x] pre-registrations-page: lógica L038 (MapParamsReader, FASE A/B, geoSearch, CRUD) preservada
- [x] Hydration guard presente na página nova
- [x] Mobile-first: cards + tabela desktop conforme docs/ui/responsividade.md
- [x] Botões com min-h-[44px] em todas as ações
- [x] Filtros com w-full no mobile, w-auto no sm
- [x] Toast de conversão com z-[9999] para não ser ocultado por modais
- [x] CRITICAL marcado no handleConvert sobre payload esperado pela API

---

## 9. Auditoria de Regressão

| Item auditado | Classificação |
|---|---|
| Fluxo FASE A/B (MapParamsReader) | `preservado` |
| CRUD de leads (save, remove) | `preservado` |
| Modal de edição/criação | `preservado` |
| GPS / geoSearch | `preservado` |
| Filtros de status e origem | `preservado` |
| Regras de navegação adminOnly / hideForRepresentative | `preservado` |
| Logout no DashboardShell | `preservado` |
| Contrato GET /api/visits | `preservado` |
| Contrato POST /api/.../convert | `preservado` |
| CalendarCheck em lucide 0.378 | `evidencia_insuficiente` — validar antes do deploy |

---

## 10. Validação Local

```bash
# 1. Verificar que CalendarCheck existe no pacote instalado
grep -r "CalendarCheck" node_modules/lucide-react/dist/ | head -3

# 2. Lint
npm run lint

# 3. Build
npm run build

# 4. Fluxo manual — Visitas
# - Logar → navegar para /dashboard/visits
# - Verificar lista de visitas
# - Testar filtros de status e atividade
# - Testar busca por texto
# - Verificar cards no mobile (375px) e tabela no desktop (≥640px)

# 5. Fluxo manual — Converter Lead
# - Navegar para /dashboard/pre-registrations
# - Clicar no ícone UserPlus de um lead com status != convertido
# - Verificar modal de confirmação
# - Confirmar → verificar toast de sucesso
# - Verificar que o lead mudou para status "Convertido"
# - Verificar que o lead convertido não exibe mais o botão de conversão

# 6. Verificar item "Visitas" no menu lateral (desktop e mobile)
```

---

## 11. Impacto Documental

- `docs/changelog.md` — registrar L040 (UI de Visitas + Converter Lead)
- `docs/index.md` — atualizar status dos módulos DT04 e DT05 para ✅ Implementado
- `README.md` — atualizar tabela de módulos: Visitas e Pré-cadastros com conversão

> Atualização documental não incluída neste pacote — deve ser feita no próximo commit
> ou em lote documental separado.

---

## 12. Handoff para Validação

Responsável pela validação deve:

1. Aplicar os 3 arquivos na ordem indicada abaixo.
2. Verificar se `CalendarCheck` existe em lucide-react 0.378 (passo crítico).
3. Executar `npm run lint` e `npm run build`.
4. Validar fluxo de Visitas em 375px e ≥640px.
5. Validar fluxo de conversão de lead.
6. Confirmar que o menu lateral exibe "Visitas" entre "Mapa" e "Configurações".

---

## Commit sugerido

**Summary:**
```
feat: UI visitas e conversão de lead (L040)
```

**Description:**
```
Lote: L040

Objetivo:
- Criar página /dashboard/visits (Histórico de Visitas)
- Adicionar botão "Converter em Cliente" em /dashboard/pre-registrations
- Inserir item "Visitas" no menu do DashboardShell

Arquivos principais:
- src/app/dashboard/visits/page.tsx (NOVO)
- src/app/dashboard/pre-registrations/pre-registrations-page.tsx (PATCH)
- src/components/layout/DashboardShell.tsx (PATCH mínimo)

Validação:
- npm run lint: A VALIDAR
- npm run build: A VALIDAR
- Testes manuais: A VALIDAR

Riscos:
- Verificar CalendarCheck em lucide-react@0.378 antes do deploy

Rollback:
- Reverter commit; os 3 arquivos são independentes do backend
```
