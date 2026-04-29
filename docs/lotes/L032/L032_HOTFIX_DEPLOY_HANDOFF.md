# L032_HOTFIX_DEPLOY — Handoff

## Identificação
- lote_id: L032_Adicao_Busca_MapaCad_Cliente
- hotfix_id: L032_HOTFIX_DEPLOY
- data: 2026-04-18
- origem: falha de build no Vercel após ETAPA 01

## Causa raiz

Dois erros de edição no arquivo `src/app/dashboard/clients/page.tsx`:

1. Declaração duplicada de `const GpsPickerMap = dynamic(...)` — causa primária.
   O SWC perde contexto de parse e reporta erro genérico na linha 133 (`DashboardShell`).

2. Tag `<a` ausente no card de localização — causa secundária.
   Atributos `href/target/rel` soltos sem elemento JSX pai.

## Correções aplicadas

| # | Tipo | Localização original | Ação |
|---|------|---------------------|------|
| 1 | Remoção | Linhas 15–18 | Removida segunda declaração `const GpsPickerMap` |
| 2 | Inserção | Linha 323 (aprox.) | Adicionado `<a` antes de `href={form.maps_link ...}` |

## Arquivos do hotfix

- `patches/page.tsx` → substituir `src/app/dashboard/clients/page.tsx`
- `GUIA_APLICACAO.md` → instruções de aplicação
- `docs/L032_HOTFIX_DEPLOY_HANDOFF.md` → este arquivo

## Escopo preservado

Toda a lógica da ETAPA 01 foi mantida intacta:
- `handleMapConfirm`, `copyCoords`, `showMapPicker`, `copiedCoords`
- Modal fullscreen com `GpsPickerMap` + `LeafletProvider`
- Card de localização com botões Maps / Copiar / Editar
- Fluxo CEP e Nominatim inalterados

## Próximo passo

Aplicar `patches/page.tsx`, validar build localmente e fazer push para deploy.
