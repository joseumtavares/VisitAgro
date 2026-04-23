# L037 — Responsividade operacional mobile do dashboard e mapa

**Data:** 22/04/2026  
**Lote:** L037  
**Versão base:** v0.9.4  
**Autor:** Agente implementador

---

## Objetivo

Tornar o sistema utilizável em dispositivos mobile (Android/iOS, 375px+) sem quebrar o comportamento desktop existente. Foco em menu hamburguer, sidebar colapsável, altura do mapa adaptada, CTA destacado e filtros acessíveis.

---

## Arquivos alterados

| Arquivo | Sensibilidade | Tipo de alteração |
|---|---|---|
| `src/components/layout/DashboardShell.tsx` | Alta | Patch localizado — sidebar mobile + header hamburguer |
| `src/components/map/InteractiveMap.tsx` | Alta | Patch layout apenas — lógica intacta |
| `src/app/dashboard/map/page.tsx` | Baixa | Patch altura do container |
| `src/app/dashboard/page.tsx` | Baixa | Patch classe grid |

---

## Estratégia aplicada

### DashboardShell.tsx

**Problema:** sidebar sempre visível bloqueava conteúdo em mobile.

**Solução:**
- `useState(false)` → `sidebarOpen` controla abertura no mobile
- `fixed lg:static` + `translate-x-full lg:translate-x-0` na sidebar
- `transition-transform duration-200 ease-in-out` para animação suave
- Header mobile `lg:hidden` com botão hamburguer (min 44px)
- Overlay `lg:hidden` fecha sidebar ao tocar fora
- `onClick={() => setSidebarOpen(false)}` em cada `<Link>` de navegação

**Preservado:** NAV_ITEMS, rotas, lógica auth, openGroups, navItemClass.

---

### InteractiveMap.tsx

**Problema:** filtros transbordavam, CTA sumia no mobile, mapa muito alto.

**Solução — filtros:**
- `overflowX: 'auto'`, `WebkitOverflowScrolling: 'touch'`, `paddingBottom: 4`
- `flexWrap: compact ? 'nowrap' : 'wrap'`
- `whiteSpace: 'nowrap'` e `flexShrink: 0` em cada botão de filtro
- `minHeight: 36` nos filtros para área de toque mínima

**Solução — CTA "Novo Lead aqui":**
- `minHeight: 44` e `minWidth: 44` (toque mínimo)
- `fontWeight: 700` e borda dupla `border: 2px solid #0ea5e9` para destaque
- `flexShrink: 0` para nunca ser comprimido

**Solução — altura do mapa:**
- Antes: `minHeight: compact ? 240 : 520` (valor fixo)
- Depois: `minHeight: compact ? 200 : 'min(520px, calc(100dvh - 280px))'`
- No mobile usa `100dvh` (dynamic viewport) para evitar cortes

**Preservado:** toda lógica (setPlacingLead, check-in, geolocalização, eventos Leaflet, apiFetch, toast, checkinForm, loadLeads, saveEdit, saveCheckin, RecenterMap, LocateControl, MapSearchBar, LeadPlacementHandler).

---

### map/page.tsx

**Problema:** `minHeight: 'calc(100vh - 120px)'` não adaptava ao mobile.

**Solução:**
- `style={{ minHeight: 'calc(100dvh - 120px)' }}` no container externo
- Container do mapa: `minHeight: 'min(560px, calc(100dvh - 200px))'`
- `100dvh` (dynamic viewport height) respeita barra de endereço do browser mobile

**Preservado:** hydration guard, auth check, imports, LeafletProvider, compact={false}.

---

### dashboard/page.tsx

**Problema:** `grid-cols-2 lg:grid-cols-3` causava cards muito estreitos em 375px.

**Solução:**
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

**Preservado:** toda lógica de stats, Promise.all, cards, mapa rápido.

---

## Validação mínima

### Mobile (375px, Chrome DevTools ou dispositivo real)

- [ ] Menu hamburguer aparece no header
- [ ] Sidebar abre ao tocar hamburguer
- [ ] Sidebar fecha ao tocar overlay ou navegar
- [ ] Cards do dashboard em coluna única
- [ ] Mapa da página `/dashboard/map` ocupa tela disponível
- [ ] Filtros do mapa roláveis horizontalmente
- [ ] Botão "Novo Lead aqui" visível sem rolar, toque funciona
- [ ] Check-in abre sheet corretamente
- [ ] Geolocalização funciona no check-in

### Desktop (lg+)

- [ ] Sidebar estática visível sem hamburguer
- [ ] Layout de 3 colunas no dashboard
- [ ] Mapa com altura completa
- [ ] Nenhuma regressão visual

### Funcional

- [ ] Login funciona
- [ ] Navegação entre páginas funciona
- [ ] Mapa carrega clientes e leads
- [ ] Criar lead via mapa funciona
- [ ] Check-in registra visita

---

## Rollback

Para reverter, restaurar os 4 arquivos da versão anterior:

```
src/components/layout/DashboardShell.tsx   — reverter sidebarOpen e header lg:hidden
src/components/map/InteractiveMap.tsx      — reverter filtros, CTA e minHeight do mapa
src/app/dashboard/map/page.tsx             — reverter minHeight para 'calc(100vh - 120px)'
src/app/dashboard/page.tsx                 — reverter grid-cols-2 para grid-cols-2
```

Não há alterações de banco, API ou contratos de dados — rollback não afeta backend.

---

## Riscos conhecidos

| Risco | Mitigação |
|---|---|
| `100dvh` não suportado em browsers muito antigos | Fallback implícito para `100vh` na maioria dos casos |
| Scroll horizontal nos filtros pode não ser óbvio para usuários | Visual funcional; pode-se adicionar indicador de scroll em versão futura |
| Sidebar mobile usa `position: fixed` — pode sobrepor toast | Toast usa `z-index: 9999`; sidebar usa `z-30` — sem conflito |
