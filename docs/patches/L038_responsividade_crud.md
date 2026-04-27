# L038 — Responsividade CRUD + Padrão Oficial Mobile-First

**Data:** 26/04/2026  
**Lote:** L038  
**Versão base:** VisitAgro v0.9.4 + L037  
**Autor:** Agente implementador  
**Referência:** docs/ui/responsividade.md

---

## Objetivo

Padronizar a responsividade futura do sistema e aplicar o padrão inicial nas telas CRUD principais, garantindo que novas páginas sejam sempre criadas em mobile-first.

---

## Padrão criado

`docs/ui/responsividade.md` — documento oficial de responsividade. Inclui:

- Breakpoints oficiais (Tailwind)
- Padrão para tabelas (cards mobile vs scroll)
- Critério de escolha por número de colunas
- Padrão para formulários (coluna única no mobile)
- Padrão para botões (min-h-[44px])
- Padrão para filtros
- Padrão para mapa
- Padrão para grid
- Checklist de validação obrigatório por lote
- Exemplos de código prontos para reuso

---

## Arquivos alterados

| Arquivo | Sensibilidade | Tipo de alteração |
|---|---|---|
| `docs/ui/responsividade.md` | Baixa | Criado (completado — versão anterior estava truncada) |
| `AGENTES.md` | Média | Verificado — seção 4.1 já existia e está completa |
| `docs/changelog.md` | Baixa | Entrada L038 adicionada |
| `docs/index.md` | Baixa | Referências L038 adicionadas |
| `docs/patches/L038_responsividade_crud.md` | Baixa | Criado |
| `src/app/dashboard/clients/page.tsx` | Alta | Cards mobile + min-h-[44px] |
| `src/app/dashboard/products/page.tsx` | Alta | Cards mobile + min-h-[44px] |
| `src/app/dashboard/referrals/page.tsx` | Média | Cards mobile + grid-cols-1 sm:grid-cols-2 no form + min-h-[44px] |
| `src/app/dashboard/pre-registrations/pre-registrations-page.tsx` | Alta | Cards mobile + w-full sm:w-auto nos selects + min-h-[44px] |

---

## Telas ajustadas

### clients/page.tsx

**Problema:** tabela com 5 colunas sem alternativa mobile.

**Solução:**
- `sm:hidden` → bloco de cards mobile com nome, status, contato, localização
- `hidden sm:block` → tabela desktop preservada
- `min-h-[44px]` → botões Editar e Remover nos cards
- `min-h-[44px]` → botão "Novo Cliente" e botões do modal
- `flex flex-col sm:flex-row` → footer do modal empilha no mobile

**Preservado:** toda lógica (CEP, Nominatim, mapa picker, GPS, save, remove, form).

---

### products/page.tsx

**Problema:** tabela com 8 colunas (nome, categoria, SKU, venda, custo, estoque, comissão, ações) — inviável no mobile.

**Solução:**
- `sm:hidden` → cards mobile com nome, badge composto, SKU, preço de venda, estoque, categoria
- `hidden sm:block` → tabela desktop preservada
- `min-h-[44px]` → botões nos cards e no modal
- `flex flex-col sm:flex-row` → footer do modal empilha no mobile

**Preservado:** toda lógica de produto composto (is_composite, components, recalcCostPreview, eligibleComponents, loadingEdit, openEdit async).

---

### referrals/page.tsx

**Problema:** `grid-cols-2` sem breakpoint no formulário; tabela sem alternativa mobile.

**Correções:**
- `grid-cols-2 gap-4` → `grid-cols-1 sm:grid-cols-2 gap-4` (formulário principal)
- `grid grid-cols-2 gap-3` → `grid grid-cols-1 sm:grid-cols-2 gap-3` (dados bancários)
- `sm:hidden` → cards mobile com nome, comissão, contato, dados bancários
- `hidden sm:block` → tabela desktop preservada
- `min-h-[44px]` → todos os botões de ação e modal
- `flex flex-col sm:flex-row` → footer do modal empilha no mobile

**Preservado:** lógica CRUD, tipos commission_type, campos bancários.

---

### pre-registrations/pre-registrations-page.tsx

**Problema:** tabela com 7 colunas sem alternativa mobile; selects de filtro sem largura controlada.

**Solução:**
- `sm:hidden` → cards mobile com nome, status, contato, origem/indicador, interesse, localização
- `hidden sm:block` → tabela desktop preservada
- `w-full sm:w-auto` → selects de filtro (status e origem)
- `min-h-[44px]` → botões do header, busca GPS, salvar e cancelar no modal
- `flex flex-col sm:flex-row` → footer do modal empilha no mobile

**Preservado:** MapParamsReader, FASE A/B (edição via URL), geoSearch, useCurrentGps, Suspense, toda lógica de filtros, CRUD completo.

---

## Estratégia aplicada

### Critério para cards vs scroll

| Página | Colunas | Estratégia |
|---|---|---|
| clients | 5 | Cards mobile (≥4 colunas) |
| products | 8 | Cards mobile (≥6 colunas) |
| referrals | 5 | Cards mobile (≥4 colunas) |
| pre-registrations | 7 | Cards mobile (≥6 colunas) |

### Padrão aplicado (consistente em todas as páginas)

```tsx
{/* Mobile: cards */}
<div className="sm:hidden space-y-3">
  {items.map(item => (
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 space-y-3">
      ...campos relevantes...
      <div className="flex gap-2 pt-1">
        <button className="flex-1 min-h-[44px] ...">Editar</button>
        <button className="flex-1 min-h-[44px] ...">Remover</button>
      </div>
    </div>
  ))}
</div>

{/* Desktop: tabela */}
<div className="hidden sm:block bg-dark-800 rounded-xl ...">
  <div className="overflow-x-auto">
    <table>...</table>
  </div>
</div>
```

---

## Validação obrigatória

### Mobile (375px)

- [ ] Clientes: cards empilhados, sem overflow horizontal
- [ ] Produtos: cards com nome, preço, estoque visíveis
- [ ] Indicadores: cards com nome e comissão visíveis
- [ ] Pré-cadastros: cards com nome, status, contato visíveis
- [ ] Todos os filtros: selects ocupam largura total
- [ ] Todos os formulários: coluna única
- [ ] Todos os botões de ação: área mínima de toque 44px
- [ ] Botão "Novo" em cada CRUD: visível e acessível
- [ ] Modais: abrem corretamente, footer empilhado

### Tablet (768px)

- [ ] Transição de cards para tabela funciona em sm (640px)
- [ ] Formulários: 2 colunas a partir de sm
- [ ] Filtros: inline

### Desktop (≥1024px)

- [ ] Tabelas preservadas com todas as colunas
- [ ] Sidebar intacta (L037 não afetado)
- [ ] Nenhum layout quebrado

### Funcional

- [ ] CRUD clients: criar, editar, remover funcionam
- [ ] CRUD products: produto simples e composto funcionam
- [ ] CRUD referrals: comissão fixa e percentual funcionam
- [ ] Pre-registrations: FASE A/B (edição via mapa URL) funciona
- [ ] Nenhuma regra de negócio alterada

---

## Rollback

Sem alterações de banco, API ou contratos. Rollback seguro: restaurar os 4 arquivos de página para a versão anterior ao patch.

Identificar blocos L038 pelo comentário:
```
// L038:
```

---

## Riscos conhecidos

| Risco | Mitigação |
|---|---|
| Conflito com lote paralelo em clients/page.tsx (ex: L037 ou outro) | Comparar diff; reaplicar apenas os blocos `// L038:` |
| products/page.tsx usa tipos de `src/types/index.ts` (Product, ProductComponent) — não alterar types | Preservado; nenhum tipo foi alterado |
| pre-registrations usa Suspense + useSearchParams — não mover componente | MapParamsReader mantido no mesmo arquivo |
