# L037 — Abertura Formal do Lote

## 1. Identificação

| Campo | Valor |
|------|------|
| lote_id | L037 |
| título | Responsividade operacional mobile do dashboard e mapa |
| tipo | UI/UX — refinamento responsivo |
| prioridade | Alta (impacto direto no uso em campo) |
| status | 🟡 Aberto — aguardando execução |
| branch sugerida | feature/L037-mobile-responsividade |
| data de abertura | 22/04/2026 |

---

## 2. Objetivo Funcional

Tornar o sistema utilizável em campo no mobile sem quebrar o desktop.

Foco:
- Navegação responsiva (sidebar colapsável)
- Priorização visual do mapa
- Destaque do CTA **"Novo Lead aqui"**

---

## 3. Escopo Incluído

1. Sidebar fixa no desktop; menu suspenso/overlay no mobile  
2. Mapa visualmente prioritário no mobile  
3. CTA "Novo Lead aqui" destacado  
4. Filtros e legendas acessíveis no mobile  
5. Responsividade global do shell  
6. Refinamentos visuais leves no dashboard  
7. Documentação do lote  

---

## 4. Fora de Escopo

- API (`src/app/api/**`)
- Autenticação (middleware, auth)
- Store global (`authStore`)
- Tipos (`src/types`)
- SQL / migrations
- Redesign completo
- CRUD pages (clients, products, etc.)
- `apiFetch.ts`
- Novos componentes de mapa

---

## 5. Riscos

| Risco | Severidade | Mitigação |
|------|-----------|----------|
| Quebrar sidebar desktop | Médio | Usar breakpoints `lg:` |
| InteractiveMap complexo | Alto | Alterar apenas layout |
| DashboardShell global | Alto | Patch mínimo |
| Overflow no mobile | Médio | Usar `100dvh` |
| Conflito com Leaflet | Baixo | Não sobrepor controles |
| globals.css impacto | Médio | Máx. 2–3 regras |

---

## 6. Arquivos Impactados

### 6.1 Obrigatórios

| Arquivo | Sensibilidade | Motivo |
|--------|--------------|--------|
| DashboardShell.tsx | 🔴 Alta | Shell global |
| InteractiveMap.tsx | 🔴 Alta | Mapa + CTA |
| map/page.tsx | 🟡 Média | Altura do mapa |
| dashboard/page.tsx | 🟡 Média | Grid KPI |

### 6.2 Condicionais

| Arquivo | Condição |
|--------|---------|
| globals.css | Apenas se necessário |

### 6.3 Documentação

- docs/changelog.md  
- docs/index.md  
- docs/patches/L037_responsividade.md  

### 6.4 Intocáveis

- middleware.ts  
- apiFetch.ts  
- authStore.ts  
- types/index.ts  
- src/app/api/**  
- páginas CRUD  

---

## 7. Sensibilidade por Arquivo

### DashboardShell.tsx (🔴 Alta)
- Adicionar `sidebarOpen`
- Criar menu mobile
- Overlay
- Usar `lg:hidden`

### InteractiveMap.tsx (🔴 Alta)
- Ajustar filtros mobile
- Destacar CTA
- Ajustar altura do mapa

### map/page.tsx (🟡)
- Trocar `minHeight` por `100dvh`

### dashboard/page.tsx (🟡)
- Ajustar grid:
`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

---

## 8. Estratégia de Implementação

Ordem:

1. DashboardShell  
2. Dashboard  
3. Map page  
4. InteractiveMap  
5. globals.css (se necessário)  
6. Documentação  

Princípios:

- Mobile-first  
- Diff mínimo  
- Reutilizar componentes  
- Não alterar lógica  

---

## 9. Checklist de Validação

### Mobile

- Menu hamburguer funciona  
- Sidebar abre/fecha  
- Navegação ok  
- Mapa ocupa tela  
- CTA visível  
- Filtros acessíveis  
- Check-in funciona  
- Scroll ok  

### Desktop

- Sidebar fixa  
- Layout intacto  
- Sem regressões  

### Funcional

- Login ok  
- API ok  
- Build ok  

---

## 10. Registro Documental

### docs/patches/L037_responsividade.md
- Objetivo
- Arquivos
- Estratégia
- Validação
- Rollback

### docs/changelog.md

```
## [L037] — 22/04/2026

### UI/UX — Responsividade mobile
- Menu mobile no DashboardShell
- Ajustes no mapa
- CTA destacado
```

### docs/index.md

```
| L037 | Responsividade Mobile | 🟡 Em andamento |
```

---

## Definition of Ready ✅

- Escopo definido  
- Riscos mapeados  
- Arquivos identificados  
- Validação definida  

---

## Status Final

**Lote L037 aberto e pronto para execução.**
