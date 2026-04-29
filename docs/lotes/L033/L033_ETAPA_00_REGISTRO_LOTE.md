# Resumo do lote

- **Lote ID:** L033
- **Título do lote:** Branding Fortsul + VisitAgro — Fase 1 — integração estática mínima de ícones e marca

## Objetivo funcional

Aplicar branding estático, com diff mínimo e sem ambiguidade, em quatro pontos centrais:

- favicon / apple touch icon
- tela de login
- branding da sidebar
- presença discreta de marca no topo do dashboard

O anexo delimita exatamente esse escopo e veda mudanças em auth, store, middleware, backend, API, banco e configuração dinâmica por empresa.

## Problema observado

O repositório já tem kit Fortsul + VisitAgro em `icons/`, mas o app ainda está com branding parcial/inconsistente:

- `src/app/layout.tsx` usa `title: "Agrovisita Pro"` e não declara icons
- a tela de login mostra **VisitAgro Pro** com `MapPin` temporário
- a sidebar mostra **VisitAgro Pro** com `Map`
- o topo do dashboard segue só com cabeçalho textual

## Causa suspeita

O kit visual foi adicionado, mas ainda não foi integrado aos pontos reais de UI/metadata e a estratégia de serving dos assets ainda não foi amarrada ao runtime do app. Além disso, há inconsistência textual entre **“Agrovisita Pro”** e **“VisitAgro Pro”**.

## Escopo incluído

- Confirmar o menor caminho seguro para servir os assets do kit, sem espalhar cópias desnecessárias.
- Integrar favicon e apple touch icon no ponto global de metadata.
- Trocar apenas o bloco visual temporário da tela de login por logo real.
- Trocar apenas o bloco de branding do topo da sidebar por logo real.
- Inserir badge ou hero leve no topo do dashboard, sem reordenar a operação da página.
- Harmonizar o naming da marca apenas nos pontos diretamente afetados por este lote.

## Fora de escopo

- Lógica de login, logout, redirects, permissões, navegação, Zustand/store, middleware, backend, contratos de API, banco, migrations e `logo_url` dinâmico em `settings/company`.
- Redesign amplo, PWA/manifest complexo, dependências novas, refatoração cosmética ampla ou reescrita de arquivos inteiros sem necessidade.
- Qualquer alteração fora de layout, login, shell/sidebar e topo do dashboard, salvo um ajuste auxiliar mínimo para serving estático dos assets.

## Risco

- **Risco do lote:** médio-controlado.

### Justificativa

O lote é só de branding/UI e não envolve banco nem API, mas toca `src/app/layout.tsx` e o shell do dashboard, que o próprio guia classifica como áreas de alta sensibilidade e que pedem diff localizado, sem reordenação massiva nem refatoração cosmética.

### Arquivos de alta sensibilidade

- `src/app/layout.tsx`
- `src/components/layout/DashboardShell.tsx`

Por proximidade funcional, `src/types/index.ts` e `src/app/api/settings/company/route.ts` devem permanecer fora do patch, a menos que surja bloqueador real.

### Exige migration SQL?

Não. Não há evidência de necessidade de banco para este lote, e os artefatos atuais em `sql/` e `docs/patches/` são de temas não relacionados a branding.

### Exige atualização documental?

Sim, no fechamento — no mínimo `docs/changelog.md`; e, se o lote for materializado no repositório, deve haver registro mestre coerente em `docs/lotes/`, conforme a convenção operacional.

## Definition of Ready

- Escopo congelado em branding estático de quatro pontos, sem expansão para auth/API/banco.
- Identidade textual alvo explicitada antes da execução: normalizar para a marca oficial do lote nos pontos tocados, evitando manter a divergência atual entre Agrovisita Pro e VisitAgro Pro.
- Estratégia de serving dos assets definida antes do patch: reaproveitar local já público se existir; caso não exista, mover/copiar só o estritamente necessário.
- Âncoras reais já conhecidas para execução: metadata em `layout.tsx`, bloco visual do login, cabeçalho da sidebar e cabeçalho do dashboard.

## Definition of Done

- Favicon aplicado.
- Apple touch icon configurado.
- Login com logo real sem quebrar formulário.
- Sidebar com marca real sem quebrar navegação.
- Dashboard com badge/hero discreto e responsivo.
- Identidade textual consistente nos pontos alterados.
- Nenhuma regressão funcional em login, logout, redirect, itens protegidos, KPIs, mapa rápido e fluxo do dashboard.
- Diff restrito ao menor conjunto possível de arquivos, com mudanças localizadas e alinhadas às regras de `AGENTES.md` e ao playbook operacional.
- Fechamento com validação mínima documentada e atualização coerente de changelog/registro do lote.

## Validação mínima

```bash
npm run lint
npm run build
```

### Fluxo manual mínimo

- Abrir login e validar branding e responsividade.
- Testar login válido, inválido e loading.
- Abrir dashboard e validar branding inserido, KPIs e mapa rápido.
- Navegar pela sidebar e validar item ativo e logout.
- Validar favicon e consistência do nome da marca.

O playbook exige lint/build/fluxo manual, e o anexo já detalha esses testes para login, sidebar, dashboard, branding global e responsividade.

## Paths prováveis

### Diretos do lote

- `src/app/layout.tsx`
- `src/app/auth/login/page.tsx`
- `src/components/layout/DashboardShell.tsx`
- `src/app/dashboard/page.tsx`

### Assets reais do kit

- `icons/visitagro-fortsul-favicon.(png|svg)`
- `icons/visitagro-fortsul-apple-touch-icon.png`
- `icons/visitagro-fortsul-logo-login.(png|svg)`
- `icons/visitagro-fortsul-logo-sidebar.(png|svg)`
- `icons/visitagro-fortsul-dashboard-badge.(png|svg)`
- `icons/visitagro-fortsul-main-hero.(png|svg)`

### Auxiliares, só se houver bloqueio de serving

Um local estático público mínimo, provavelmente algo como `public/branding/*` ou convenção equivalente do App Router, mas isso só deve entrar se a verificação de runtime mostrar necessidade.

### Documentação potencial de fechamento

- `docs/changelog.md`
- Registro em `docs/lotes/`, seguindo a convenção `LXX_ETAPA_00_REGISTRO_LOTE.md`

### Patches/SQL relacionados ao tema

Não há patch temático de branding hoje. Em `docs/patches/` só aparece `L20_product_components.md`, e em `sql/` só constam:

- `020_product_components.sql`
- `030_rep_commissions_rep_id.sql`
- `insert_admin.sql`
- `schema_atual_supabase.sql`

Sem relação aparente com este lote.

## Próximo agente

Agente de mapa de impacto (Cursor/rastreador), não revisor ainda.

## Handoff recomendado

- Confirmar a estratégia mínima de serving dos assets.
- Mapear âncoras exatas nos 4 arquivos centrais.
- Verificar se há mais ocorrências de “Agrovisita Pro” / “VisitAgro Pro” dentro do escopo.
- Devolver impacto direto/indireto sem propor redesign nem tocar em auth/store/API.

A ordem oficial do playbook é:

1. Abertura do lote
2. Mapa de impacto
3. Patch mínimo seguro
4. Consolidação
5. Pós-merge
