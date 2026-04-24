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

Mobile:
- usar **cards**
OU
- scroll horizontal controlado

Desktop:
- manter tabela tradicional

---

## 🧾 Formulários

### Mobile

- Layout em coluna única
- Inputs com altura confortável
- Labels visíveis
- Botões grandes (mín. 44px)

### Desktop

- Pode usar múltiplas colunas
- Manter alinhamento visual

---

## 🔘 Botões

### Regras obrigatórias

- Altura mínima: **44px**
- Espaçamento adequado entre botões
- Botões principais sempre visíveis no mobile

### CTA crítico

- Deve estar visível sem scroll quando possível
- Exemplo: **"Novo Lead aqui"**

---

## 🔍 Filtros

### Mobile

- Usar:
  - dropdown
  - accordion
  - scroll horizontal

### Desktop

- Pode ser inline

---

## 🗺️ Mapa (Leaflet)

### Mobile

- Deve ter prioridade visual
- Ocupar maior parte da tela
- Não pode ser “espremido”

### Regras

- Não sobrepor controles nativos
- CTA deve ficar fora do container do mapa

---

## 🧱 Grid

### Padrão obrigatório

```css
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3