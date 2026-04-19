# L033 — ETAPA 01 — EXECUÇÃO

## 1. Mapeamento do repositório

**Stack confirmada**  
Fontes: `AGENTES.md`, `playbook-operacional.md`, `Resumo_do_Lote_L033.md`

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 App Router |
| UI | React 18, Tailwind CSS, Lucide React |
| Estado | Zustand (`src/store/authStore.ts`) |
| Banco | Supabase via `getAdmin()` service role |
| Auth | JWT próprio + `bcryptjs` |
| Deploy | Vercel |

### Assets confirmados no kit
Extraídos de `icons.zip`.

| Arquivo | Dimensão | Uso previsto |
|---|---:|---|
| `visitagro-fortsul-favicon.png` | 32×32 | `<head>` favicon |
| `visitagro-fortsul-apple-touch-icon.png` | ~180×180 | Apple touch icon |
| `visitagro-fortsul-logo-login.svg` | 560×360 | Tela de login |
| `visitagro-fortsul-logo-sidebar.svg` | 460×108 | Topo da sidebar |
| `visitagro-fortsul-dashboard-badge.svg` | 360×96 | Topo do dashboard |

Assets opcionais presentes, mas fora do escopo deste lote: `main-hero`, `header-badge`, `icon-192`, `icon-512`, `logo-light`.

### Pontos de integração identificados

- `src/app/layout.tsx` → `export const metadata` com `title: "Agrovisita Pro"`, sem `icons`
- `src/app/auth/login/page.tsx` → bloco visual com `MapPin` (Lucide) + texto `"VisitAgro Pro"`
- `src/components/layout/DashboardShell.tsx` → cabeçalho da sidebar com `Map` (Lucide) + `"VisitAgro Pro"`
- `src/app/dashboard/page.tsx` → topo da página sem badge de marca

### Áreas sensíveis preservadas integralmente

`middleware.ts`, `src/lib/supabaseAdmin.ts`, `src/lib/auth.ts`, `src/lib/apiFetch.ts`, `src/store/authStore.ts`, `src/types/index.ts`, `src/app/api/**`, banco, migrations — nenhuma alteração.

---

## 2. Estratégia de serving dos assets

**Decisão:** copiar assets necessários para `public/branding/`.

### Justificativa

A pasta `icons/` está na raiz do repositório e não é servida pelo runtime do Next.js. Somente arquivos dentro de `public/` são acessíveis via URL no App Router. A estratégia mais segura e com menor diff é copiar apenas os 5 arquivos necessários para `public/branding/`, conforme o próprio `icons/README-INTEGRACAO.md` já documenta (`/branding/` como path URL).

### Alternativas descartadas

- Importar como módulo ES via `import logo from '@/icons/...'` → exigiria configuração adicional em `next.config.js` para SVGs; desnecessário.
- Mover a pasta `icons/` inteira para `public/` → cria arquivos públicos desnecessários (bases, 512px etc.).

### Assets a copiar
Operação manual única, via terminal ou explorer.

```bash
# Executar na raiz do repositório
mkdir -p public/branding

cp icons/visitagro-fortsul-favicon.png          public/branding/
cp icons/visitagro-fortsul-apple-touch-icon.png public/branding/
cp icons/visitagro-fortsul-logo-login.svg       public/branding/
cp icons/visitagro-fortsul-logo-sidebar.svg     public/branding/
cp icons/visitagro-fortsul-dashboard-badge.svg  public/branding/
```

A pasta `icons/` permanece no repositório para referência e futuras expansões.

---

## 3. Plano de alteração

| Arquivo | Ação | Sensibilidade | Risco de regressão |
|---|---|---|---|
| `src/app/layout.tsx` | Adicionar bloco `icons` ao metadata; ajustar `title` | Alta | Baixo — apenas metadata, sem tocar `RootLayout`, providers ou children |
| `src/app/auth/login/page.tsx` | Substituir bloco Lucide `MapPin` por `<Image>` | Média | Baixo — apenas bloco visual, preservando toda lógica do formulário |
| `src/components/layout/DashboardShell.tsx` | Substituir cabeçalho `Map` + texto por `<Image>` | Alta | Baixo — apenas cabeçalho do topo da sidebar, preservando nav, logout e estrutura |
| `src/app/dashboard/page.tsx` | Inserir badge antes dos KPIs | Média | Baixo — inserção pura, sem remover nada existente |

**Como evitar regressão:** as operações são todas de substituição de bloco visual isolado ou inserção pura. Não há alteração de estado, imports funcionais, handlers, rotas ou contratos.

---

## 4. Implementação

### Passo 0 — Estrutura de assets

Criar `public/branding/` e copiar os 5 arquivos conforme o comando acima. Sem novo arquivo de configuração; sem `manifest.json` neste lote.

### Arquivo 1 — `src/app/layout.tsx`

**O que muda:** adicionar `icons` ao objeto `metadata` e normalizar `title` para `"VisitAgro Pro"`.  
**O que preserva:** estrutura do `RootLayout`, providers, children, classes do `<body>` e `<html>`, imports existentes.  
**Âncora de leitura:** `export const metadata` no topo do arquivo.

**Before:**
```typescript
export const metadata: Metadata = {
  title: "Agrovisita Pro",
  description: "Sistema de gestão agrícola",
};
```

**After:**
```typescript
export const metadata: Metadata = {
  title: "VisitAgro Pro",
  description: "Sistema de gestão agrícola",
  icons: {
    icon: "/branding/visitagro-fortsul-favicon.png",
    apple: "/branding/visitagro-fortsul-apple-touch-icon.png",
  },
};
```

Se `description` tiver texto diferente no arquivo real, preservar o texto existente — apenas adicionar `icons` e corrigir `title`.

### Arquivo 2 — `src/app/auth/login/page.tsx`

**O que muda:** substituir bloco visual do `MapPin` por `<Image>` da logo de login.  
**O que preserva:** `'use client'`, todos os imports funcionais, estado, `handleSubmit`, `loading`, tratamento de erro, `redirect`.  
**Âncora de leitura:** bloco contendo `MapPin` importado de `lucide-react`, localizado acima do formulário, dentro do card de login.

**Adicionar import:**
```typescript
// Inserir junto dos outros imports de componente, após 'use client'
import Image from "next/image";
```

Se `MapPin` for usado apenas no bloco visual e em nenhum outro lugar do arquivo, remover do import de `lucide-react`. Se for usado em outro lugar, manter.

**Before — bloco visual (âncora: `<MapPin>`):**
```tsx
<div className="flex items-center justify-center mb-6">
  <MapPin className="w-12 h-12 text-green-400" />
  <span className="text-white text-2xl font-bold ml-2">VisitAgro Pro</span>
</div>
```

O bloco exato pode variar. A âncora é qualquer `<div>` ou wrapper imediatamente antes do `<form>` (ou do primeiro `<input>`/`<label>`) que contenha `<MapPin`. Substituir esse bloco inteiro.

**After:**
```tsx
<div className="flex items-center justify-center mb-6">
  <Image
    src="/branding/visitagro-fortsul-logo-login.svg"
    alt="VisitAgro Pro"
    width={280}
    height={180}
    priority
    className="max-w-full h-auto"
  />
</div>
```

Dimensão escolhida: `280×180px` (50% do viewBox `560×360`). Caberá bem no card de login sem empurrar o formulário em mobile. Ajustar `width` para `220` se o card for estreito (`< 360px` de largura interna).

### Arquivo 3 — `src/components/layout/DashboardShell.tsx`

**O que muda:** substituir cabeçalho do topo da sidebar (bloco com `Map` + texto) por `<Image>` da logo da sidebar.  
**O que preserva:** `NAV_ITEMS`, rotas, lógica `adminOnly`, active states, logout, footer/perfil, toda estrutura operacional do shell.  
**Âncora de leitura:** bloco com `<Map>` importado de `lucide-react`, localizado no topo da sidebar (antes de `NAV_ITEMS` ou do `<nav>`).

**Adicionar import:**
```typescript
import Image from "next/image";
```

Remover `Map` do import de `lucide-react` apenas se não for usado em outro lugar no arquivo (ex.: ícone de navegação de algum item). Verificar antes de remover.

**Before — cabeçalho da sidebar (âncora: `<Map>`):**
```tsx
<div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
  <Map className="w-6 h-6 text-green-400" />
  <span className="text-white font-bold text-lg">VisitAgro Pro</span>
</div>
```

A âncora é o `<div>` wrapper mais próximo de `<Map>` que esteja antes do `<nav>` ou do mapeamento de `NAV_ITEMS`. A estrutura de classes pode variar; substituir o conteúdo interno do wrapper, mantendo o wrapper externo e suas classes de `border-b`, se existirem.

**After:**
```tsx
<div className="flex items-center px-4 py-3 border-b border-gray-700">
  <Image
    src="/branding/visitagro-fortsul-logo-sidebar.svg"
    alt="VisitAgro Pro"
    width={184}
    height={43}
    priority
    className="max-w-full h-auto"
  />
</div>
```

Dimensão escolhida: `184×43px` (~40% do viewBox `460×108`). Proporção horizontal ideal para sidebar. Aumentar para `230×54` se a sidebar for mais larga (ex.: `256px` ou mais).

### Arquivo 4 — `src/app/dashboard/page.tsx`

**O que muda:** inserir badge de marca no topo da página, antes dos KPIs.  
**O que preserva:** KPI cards, mapa rápido, fetches, loading states, botões/ações, responsividade atual.  
**Âncora de inserção:** primeiro `<div>` ou `<section>` que seja filho direto do `return` e contenha os cards de KPI — inserir antes dele.

**Adicionar import:**
```typescript
import Image from "next/image";
```

**Inserção (âncora: imediatamente antes do primeiro grid/container de KPIs):**
```tsx
{/* Branding L033 — badge institucional */}
<div className="flex items-center gap-3 mb-4">
  <Image
    src="/branding/visitagro-fortsul-dashboard-badge.svg"
    alt="VisitAgro Pro"
    width={240}
    height={64}
    priority
    className="h-10 w-auto"
  />
</div>
{/* /Branding L033 */}
```

Dimensão: `h-10` via Tailwind (`40px` altura) com `w-auto` preserva proporção. O SVG `360×96` em altura `40px` terá ~`150px` de largura — discreto e elegante. O comentário de âncora facilita remoção ou ajuste em lotes futuros.

---

## 5. Testes manuais

### Login

- Abrir `/auth/login` — logo VisitAgro deve aparecer acima do formulário
- Verificar que não há overflow horizontal em viewport `≤ 375px`
- Testar login com credenciais corretas → redirect funciona
- Testar login com credenciais incorretas → mensagem de erro visível
- Testar submit → estado de loading aparece e desaparece corretamente

### Sidebar / Shell

- Abrir qualquer rota autenticada — logo sidebar visível no topo
- Navegar entre itens do menu → active state preservado
- Verificar que itens `adminOnly` continuam controlados por `role`
- Testar logout → redireciona para login sem erro
- Verificar em viewport `≤ 768px` → logo não distorce nem quebra layout

### Dashboard

- Abrir `/dashboard` → badge de marca visível, discreto, acima dos KPIs
- Verificar KPI cards presentes e com dados
- Verificar mapa rápido acessível
- Verificar sem overflow em mobile

### Branding global

- Verificar favicon na aba do navegador (pode exigir hard refresh `Ctrl+Shift+R`)
- Em iOS Safari: adicionar à tela inicial → apple touch icon exibido
- Verificar título da aba: deve ler `"VisitAgro Pro"`
- Verificar consistência: `"VisitAgro Pro"` em metadata, login e sidebar (não `"Agrovisita Pro"`)

### Build

```bash
npm run lint
npm run build
```

---

## 6. Pontos de atenção

### Limitações deste patch

- **Fonte de verdade parcial:** os arquivos reais de `src/` não foram lidos diretamente (repositório GitHub não acessível). As âncoras foram derivadas das descrições no `Resumo_do_Lote_L033.md` e `Instrução_do_lote_L033.md`. O integrador deve confirmar as âncoras antes de aplicar substituição.
- **`next/image` precisa de domínio configurado?** Não — os assets estão em `public/branding/`, que são arquivos locais servidos pelo próprio Next.js sem configuração de `remotePatterns`. Nenhuma alteração em `next.config.js` é necessária.
- **SVG no `<img>` vs `next/image`:** o componente `<Image>` do Next.js suporta SVG local sem configuração adicional. Se o projeto tiver `dangerouslyAllowSVG: false` em `next.config.js`, usar o PNG equivalente em vez do SVG (`visitagro-fortsul-logo-login.png` etc.).
- **`Map` no `DashboardShell`:** verificar se o ícone `Map` aparece também como ícone de algum item de navegação (ex.: item `"Mapa"`). Se sim, manter o import e remover apenas do bloco de cabeçalho — não do import global.

### Decisões tomadas

- SVG preferido sobre PNG para `logo-login`, `logo-sidebar` e `dashboard-badge`: menor peso, escala perfeita em retina.
- PNG para favicon e apple-touch-icon: compatibilidade máxima com browsers e iOS.
- Badge no dashboard (não hero): `main-hero.svg` com `68KB` seria excessivo para o topo de uma tela operacional. O badge de `14KB` é suficiente e discreto.
- `priority` em todos os `<Image>` de branding: evita delay de LCP em imagens visíveis above-the-fold.

### Oportunidade futura
Não implementar agora.

`logo_url` dinâmico por empresa em `settings/company`: o tipo `Company` em `src/types/index.ts` já tem o campo. A rota `src/app/api/settings/company/route.ts` já existe. Quando esse lote for executado, o branding estático aqui aplicado deve ceder lugar ao logo dinâmico via:

```tsx
<Image src={company.logo_url || '/branding/visitagro-fortsul-logo-sidebar.svg'} ... />
```

Registrar como `L034` ou similar.

---

## 7. Impacto documental

- `docs/changelog.md`: adicionar entrada em `[0.9.5]` ou como sub-item de `[0.9.4]`
- `docs/lotes/`: criar `L033_ETAPA_01_EXECUCAO.md` (conteúdo abaixo)
- `docs/index.md`: não requer alteração — seção de lotes já referencia `docs/lotes/README.md`
- Nenhum patch SQL — lote é exclusivamente de UI/assets

---

## 8. Conteúdo — `docs/lotes/L033_ETAPA_01_EXECUCAO.md`

```markdown
# L033 — ETAPA 01 — EXECUÇÃO

**Lote:** L033  
**Título:** Branding Fortsul + VisitAgro — Fase 1 — integração estática mínima  
**Data de execução:** 2026-04-18  
**Executor:** Claude (agente patch mínimo seguro)  
**Status:** Aguardando revisão (Etapa 02)

---

## Resumo executivo

Patch cirúrgico de branding estático. Aplicação do kit visual Fortsul + VisitAgro
em quatro pontos: favicon/apple-touch-icon global, tela de login, sidebar e dashboard.
Sem alteração de lógica, banco, API, autenticação ou store.

---

## Assets copiados

De `icons/` para `public/branding/`:

- `visitagro-fortsul-favicon.png`
- `visitagro-fortsul-apple-touch-icon.png`
- `visitagro-fortsul-logo-login.svg`
- `visitagro-fortsul-logo-sidebar.svg`
- `visitagro-fortsul-dashboard-badge.svg`

---

## Arquivos alterados

| Arquivo | Sensibilidade | Ação |
|---------|--------------|------|
| `src/app/layout.tsx` | Alta | Adicionado bloco `icons` ao metadata; `title` normalizado para "VisitAgro Pro" |
| `src/app/auth/login/page.tsx` | Média | Bloco `<MapPin>` substituído por `<Image>` logo-login |
| `src/components/layout/DashboardShell.tsx` | Alta | Bloco `<Map>` + texto substituído por `<Image>` logo-sidebar |
| `src/app/dashboard/page.tsx` | Média | Badge dashboard inserido antes dos KPIs |

---

## Arquivos preservados

Todos os demais arquivos do repositório, especialmente:
`middleware.ts`, `src/lib/supabaseAdmin.ts`, `src/lib/auth.ts`,
`src/lib/apiFetch.ts`, `src/store/authStore.ts`, `src/types/index.ts`,
`src/app/api/**`, `sql/**`.

---

## Estratégia de serving

Assets em `public/branding/` — convenção padrão Next.js App Router.
Nenhuma alteração em `next.config.js`. Nenhum `manifest.json` neste lote.

---

## Oportunidade futura registrada

`logo_url` dinâmico por empresa via `settings/company` — registrar como próximo lote
quando o módulo de configuração dinâmica de empresa for ativado.

---

## Validação mínima

```bash
npm run lint
npm run build
```

Fluxo manual: login → sidebar → dashboard → branding global → responsividade.

---

## Riscos residuais

- Âncoras baseadas em padrões descritos; confirmar contra código real antes de aplicar.
- Se `Map` ou `MapPin` forem usados em outros pontos do mesmo arquivo, ajustar import
  sem remover referências ativas.
- SVGs podem exigir fallback PNG se `dangerouslyAllowSVG` estiver desabilitado.

---

## Handoff

→ Próximo passo: Etapa 02 — Revisão Técnica.
```

---

## 9. Handoff para revisão (Etapa 02)

Pontos que o revisor deve verificar obrigatoriamente:

1. **Âncoras reais:** confirmar que os blocos `<MapPin>` (login) e `<Map>` (`DashboardShell`) são exatamente os pontos descritos, e que não há outras referências aos mesmos ícones no escopo visual que precisariam de tratamento.
2. **Import de `Map` no `DashboardShell`:** verificar se `Map` é usado também como ícone de item de navegação (`mapa`). Se sim, o import deve ser mantido; apenas a instância no cabeçalho deve ser substituída.
3. **Classe `border-b` no wrapper da sidebar:** o patch mantém a classe de separação visual existente. Confirmar que o wrapper real tem essa classe (ou equivalente) para não perder o separador visual entre logo e menu.
4. **`next/image` já importado?** Se `login/page.tsx` ou `DashboardShell.tsx` já importam `Image` de `next/image` para outros fins, não duplicar o import.
5. **Dimensões de display:** os valores `280×180`, `184×43` e `240×64` são baseados nos viewBoxes reais dos SVGs. Se o layout real impuser restrições diferentes (card de login mais estreito, sidebar mais larga), ajustar proporcionalmente mantendo a razão de aspecto.
6. **`priority` nos badges:** se o dashboard já tiver muitos recursos com `priority`, avaliar remover o atributo do badge (menos crítico que favicon/login).
7. **Título `"VisitAgro Pro"`:** confirmar se a identidade oficial do produto para o cliente final é `"VisitAgro Pro"` ou apenas `"VisitAgro"`. O `Resumo_do_Lote_L033.md` refere `"VisitAgro Pro"` como identidade alvo normalizada — manter essa decisão salvo instrução contrária.
