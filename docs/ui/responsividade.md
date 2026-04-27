# 📱 Padrão Oficial de Responsividade — VisitAgro

## 🎯 Objetivo

Garantir que **todas as telas do sistema sejam utilizáveis em mobile, tablet e desktop**, com foco principal no uso em campo (celular).

Este documento é **obrigatório** para qualquer implementação UI/UX.

---

## 📐 Princípio Base

> O sistema deve ser desenvolvido em **mobile-first**, e depois adaptado para telas maiores.

---

## 📏 Breakpoints Oficiais (Tailwind)

| Dispositivo | Breakpoint |
|------------|-----------|
| Mobile | default (até 640px) |
| Tablet | `sm:` (≥ 640px) |
| Desktop | `lg:` (≥ 1024px) |

---

## 📦 Layout Geral

### Regras obrigatórias

- Nunca usar largura fixa sem breakpoint
- Evitar `px` fixo para containers principais
- Preferir:
  - `w-full`
  - `max-w-*`
  - `flex` / `grid`

---

## 🧭 Navegação

### Mobile

- Menu deve ser:
  - hamburguer
  - acessível com uma mão
- Sidebar deve:
  - abrir/fechar
  - ter overlay

### Desktop

- Sidebar fixa
- Sem alteração estrutural

---

## 📊 Tabelas (CRÍTICO)

### ❌ Proibido
- tabelas largas sem adaptação

### ✅ Obrigatório

**Opção A — Cards mobile (recomendado para tabelas com 4+ colunas):**

```tsx
{/* Mobile: cards */}
<div className="sm:hidden space-y-3">
  {items.map(item => (
    <div key={item.id} className="bg-dark-800 rounded-xl border border-dark-700 p-4">
      <div className="font-medium text-white">{item.name}</div>
      {/* campos relevantes */}
      <div className="flex gap-2 mt-3">
        <button className="flex-1 min-h-[44px] ...">Editar</button>
        <button className="flex-1 min-h-[44px] ...">Remover</button>
      </div>
    </div>
  ))}
</div>

{/* Desktop: tabela */}
<div className="hidden sm:block overflow-x-auto">
  <table className="w-full">...</table>
</div>
```

**Opção B — Scroll horizontal controlado (tabelas simples, até 4 colunas):**

```tsx
<div className="overflow-x-auto">
  <table className="w-full min-w-[480px]">...</table>
</div>
```

### Critério de escolha

| Colunas | Estratégia |
|---------|-----------|
| ≤ 3 | Scroll horizontal com `min-w` |
| 4–5 | Scroll horizontal com `min-w` + ocultar colunas secundárias no mobile |
| 6+ | Cards mobile obrigatório |

---

## 🧾 Formulários

### Mobile

- Layout em **coluna única**
- Inputs com altura confortável
- Labels visíveis
- Botões grandes (mín. 44px)

```tsx
{/* Sempre coluna única no mobile */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>...</div>
  <div>...</div>
  {/* Ocupa largura total no mobile, 2 colunas no tablet+ */}
  <div className="sm:col-span-2">...</div>
</div>
```

### Desktop

- Pode usar múltiplas colunas
- Manter alinhamento visual

### ❌ Proibido em formulários

```tsx
{/* ERRADO — sem breakpoint, quebra no mobile */}
<div className="grid grid-cols-2 gap-4">
```

---

## 🔘 Botões

### Regras obrigatórias

- Altura mínima: **44px**
- Espaçamento adequado entre botões
- Botões principais sempre visíveis no mobile

```tsx
{/* Correto */}
<button className="min-h-[44px] px-4 py-2 ...">Salvar</button>

{/* Mobile: botões empilhados */}
<div className="flex flex-col sm:flex-row gap-2">
  <button className="flex-1 min-h-[44px] ...">Cancelar</button>
  <button className="flex-1 min-h-[44px] ...">Salvar</button>
</div>
```

### CTA crítico

- Deve estar visível sem scroll quando possível
- Exemplo: **"Novo Lead aqui"**, **"Novo Cliente"**

---

## 🔍 Filtros

### Mobile

- Usar:
  - dropdown (recomendado)
  - accordion
  - scroll horizontal

```tsx
{/* Filtros empilham no mobile, ficam em linha no tablet+ */}
<div className="flex flex-col sm:flex-row gap-3">
  <div className="relative flex-1">
    <input ... className="w-full ..." />
  </div>
  <select className="w-full sm:w-auto ...">...</select>
</div>
```

### Desktop

- Pode ser inline

---

## 🗺️ Mapa (Leaflet)

### Mobile

- Deve ter prioridade visual
- Ocupar maior parte da tela
- Não pode ser "espremido"

### Regras

- Não sobrepor controles nativos
- CTA deve ficar fora do container do mapa
- Usar `100dvh` para altura dinâmica no mobile

```tsx
{/* Altura adaptada para mobile */}
<div style={{ minHeight: 'min(560px, calc(100dvh - 200px))' }}>
  <InteractiveMap />
</div>
```

---

## 🧱 Grid

### Padrão obrigatório

```tsx
{/* Cards e KPIs */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

### ❌ Proibido

```tsx
{/* ERRADO — sem mobile */}
<div className="grid grid-cols-3 gap-4">

{/* ERRADO — 2 colunas no mobile */}
<div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## 📋 Checklist de validação (obrigatório em todo lote UI)

Declarar explicitamente na documentação do lote:

```
[ ] Testado em 375px — sem overflow horizontal
[ ] Testado em 768px — layout intermediário coerente
[ ] Testado em ≥1024px — desktop preservado
[ ] Tabelas: cards mobile OU scroll controlado
[ ] Formulários: coluna única no mobile
[ ] Botões: min-h-[44px] nos elementos interativos
[ ] Filtros: acessíveis em tela pequena
[ ] Sidebar: hamburguer funcional
[ ] Nenhuma regra de negócio alterada
```

---

## 🏷️ Lotes que implementam este padrão

| Lote | Escopo |
|------|--------|
| L037 | Sidebar mobile, mapa, filtros do mapa |
| L038 | CRUDs: clients, products, referrals, pre-registrations |

---

## 🔗 Referências

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [AGENTES.md — Seção 4.1](../AGENTES.md)
- [L037 — Patch responsividade](../patches/L037_responsividade.md)
- [L038 — Patch CRUD mobile](../patches/L038_responsividade_crud.md)
