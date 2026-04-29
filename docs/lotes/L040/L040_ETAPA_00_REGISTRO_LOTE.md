# ABERTURA FORMAL — LOTE L040
**VisitAgro | lote_id: L040**

---

## 📋 RESUMO DO LOTE
**Título:** UI de Histórico de Visitas + Botão "Converter em Cliente" nos Leads  

**Objetivo funcional:**  
Entregar duas ausências de UI com API já pronta e funcional:

- Página `/dashboard/visits` — listagem de visitas (histórico de check-ins e agendamentos), com filtros por status e atividade, cards mobile, ações de visualização.  
- Botão "Converter em Cliente" na página `/dashboard/pre-registrations`.

**Regras do lote:**
- Zero alteração de schema (sem migration SQL)
- Zero alteração de rotas (APIs já existem e funcionam)

---

## 📚 BASE DOCUMENTAL USADA

| Documento | Evidência lida |
|----------|---------------|
| docs/AGENTES.md | Estrutura de entrega e padrões confirmados |
| docs/playbook-operacional.md | Fluxo A→E, DoR/DoD |
| docs/index.md | Estado dos lotes |
| docs/changelog.md | Último lote: L038 |
| docs/ui/responsividade.md | Regras de responsividade |
| docs/padrao_de_comentarios.md | JSDoc obrigatório |
| src/app/api/visits/route.ts | GET e POST funcionais |
| src/app/api/pre-registrations/[id]/convert/route.ts | POST funcional |
| src/app/dashboard/pre-registrations/pre-registrations-page.tsx | Sem botão de conversão |
| src/app/dashboard/commissions/page.tsx | Referência de UI |
| src/components/layout/DashboardShell.tsx | Sem item de visitas |
| src/types/index.ts | Tipagens existentes |
| sql/schema_atual_supabase.sql | Estrutura confirmada |

**Conflito identificado:**  
`docs/index.md` desatualizado — não é responsabilidade deste lote corrigir.

---

## 🟢 CLASSIFICAÇÃO DO ESTADO DO LOTE
**Estado:** PRONTO PARA EXECUÇÃO  

**Justificativa:**
- APIs funcionais e confirmadas
- UI padronizada já definida
- Sem dependência externa
- Escopo pequeno e controlado

---

## ✅ ESCOPO INCLUÍDO

### Entrega 1 — Página `/dashboard/visits`
**Arquivo:** `src/app/dashboard/visits/page.tsx`

Funcionalidades:
- GET `/api/visits`
- GET `/api/clients` (join client-side)
- Filtros: status + activity_type
- Busca por texto
- Cards mobile (≥5 colunas)
- Tabela desktop
- Hydration guard
- Somente leitura

---

### Entrega 2 — Botão "Converter em Cliente"
**Arquivo:** `src/app/dashboard/pre-registrations/pre-registrations-page.tsx`

Funcionalidades:
- Botão visível quando `status !== 'convertido'`
- Modal de confirmação
- POST `/api/pre-registrations/[id]/convert`
- Toast sucesso/erro
- Reload da lista após conversão
- Botão com `min-h-[44px]`

---

### Alteração adicional
**Arquivo:** `src/components/layout/DashboardShell.tsx`

Adicionar item no menu:
```ts
{ href: '/dashboard/visits', label: 'Visitas', icon: <CalendarCheck /> }